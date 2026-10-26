import type { MLSListingFirestoreDocument, NormalizedMLSListing } from "@/lib/mls/types";
import { mlsSyncConfig } from "@/lib/mls/config";
import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { campaignId, eligibilityReason, newCampaign } from "@/lib/social/policy";
import { NEVER } from "@/lib/social/types";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { cacheListing, listingReadCache, recordReads, recordListingChanges, writeSyncDocuments } from "@/lib/mls/sync/execution";

const TRACKED_FIELDS: Array<keyof MLSListingFirestoreDocument> = [
  "price",
  "status",
  "propertyType",
  "commonInterest",
  "structureType",
  "propertyAttached",
  "publicRemarks",
  "isVisible",
  "hiddenReason"
];

export async function upsertNormalizedListings(listings: NormalizedMLSListing[], nowIso: string): Promise<{
  created: number;
  updated: number;
  upserted: number;
  unchanged: number;
  snapshotsWritten: number;
  hidden: number;
}> {
  let created = 0;
  let updated = 0;
  let upserted = 0;
  let unchanged = 0;
  let snapshotsWritten = 0;
  let hidden = 0;

  const unique = [...new Map(listings.map(listing => [listing.listingId, listing])).values()];
  const db = getFirebaseAdminFirestore();
  const writes: Parameters<typeof writeSyncDocuments>[0] = [];
  const stored = new Map<string, MLSListingFirestoreDocument>();
  const cache = listingReadCache();
  for (const listing of unique) {
    const cached = cache?.get(listing.listingId);
    if (cached) stored.set(listing.listingId, cached);
  }
  const unread = unique.filter(listing => !cache?.has(listing.listingId));
  for (let i = 0; i < unread.length; i += 100) {
    const chunk = unread.slice(i, i + 100);
    const snapshots = await db.getAll(...chunk.map(listing => db.collection("listings").doc(listing.listingId)));
    recordReads(snapshots.length);
    for (const snapshot of snapshots) {
      const data = snapshot.exists ? snapshot.data() as MLSListingFirestoreDocument : null;
      if (data) stored.set(snapshot.id, data);
      cacheListing(snapshot.id, data);
    }
  }
  for (const listing of unique) {
    const existing = stored.get(listing.listingId) ?? null;
    // Do not fill the database with never-public out-of-area records.
    if (!existing && !listing.isVisible) continue;
    const doc = toFirestoreDoc(listing, nowIso, existing);

    if (existing && meaningfulListingEqual(existing, listing)) {
      unchanged += 1;
      continue;
    }

    writes.push({ ref: db.collection("listings").doc(doc.listingId), data: { ...doc } });
    upserted += 1;
    if (existing?.isVisible && !doc.isVisible) hidden++;
    if (existing) {
      updated += 1;
    } else {
      created += 1;
      // Lightweight review draft only: no images, uploads or Meta calls in sync.
      if (!eligibilityReason(doc)) {
        const ref = db.collection("propertySocialPosts").doc(campaignId(doc.listingId));
        const previous = await ref.get(); recordReads(1);
        // Preserve publication history when a previously imported ID returns.
        if (!previous.exists) {
          const draft = newCampaign(doc, nowIso, true);
          draft.listingGroup = "new";
          draft.nextAttemptAt = NEVER;
          writes.push({ ref, data: { ...draft } });
        }
      }
    }

    if (mlsSyncConfig.featureFlags.snapshotsEnabled) {
      const changedFields = getChangedFields(existing, doc);
      if (!existing || changedFields.length > 0) {
        const snapshotId = randomUUID();
        writes.push({ ref: db.collection("listingSnapshots").doc(snapshotId), data: {
          snapshotId, listingId: doc.listingId, sourceListingKey: doc.sourceListingKey,
          changedFields: existing ? changedFields : ["created"],
          before: existing ? pickTrackedFields(existing) : null,
          after: pickTrackedFields(doc), reason: mapSnapshotReason(existing, changedFields), capturedAt: nowIso
        } });
        snapshotsWritten += 1;
      }
    }
  }

  // A page is at most 100 listings (300 writes with snapshots and drafts), so
  // each listing, snapshot and review draft commit in one bounded transaction.
  if (writes.length > 400) throw new Error("MLS upsert page exceeds atomic write limit");
  await writeSyncDocuments(writes);
  for (const write of writes) if (write.ref.parent.id === "listings") {
    cacheListing(write.ref.id, write.data as MLSListingFirestoreDocument);
  }
  recordListingChanges({ created, updated, unchanged, hidden });
  return { created, updated, upserted, unchanged, snapshotsWritten, hidden };
}

export function meaningfulListingEqual(existing: MLSListingFirestoreDocument, incoming: NormalizedMLSListing): boolean {
  return (Object.keys(incoming) as Array<keyof NormalizedMLSListing>)
    .filter(key => !["syncedAt", "rawSourceHash", "sourceUpdatedAt"].includes(key))
    .every(key => isDeepStrictEqual(existing[key], incoming[key]));
}

function toFirestoreDoc(
  listing: NormalizedMLSListing,
  nowIso: string,
  existing: MLSListingFirestoreDocument | null
): MLSListingFirestoreDocument {
  return {
    ...listing,
    // Durable discovery outbox. The social worker consumes this independently;
    // Meta/storage failures never run inside or fail MLS synchronization.
    ...(!existing ? { socialDiscoveredAt: nowIso, socialDiscoveryPendingAt: nowIso } : {}),
    createdAt: existing?.createdAt || nowIso,
    updatedAt: nowIso,
    lastSeenInSourceAt: nowIso
  };
}

function getChangedFields(
  before: MLSListingFirestoreDocument | null,
  after: MLSListingFirestoreDocument
): string[] {
  if (!before) return ["created"];
  return TRACKED_FIELDS.filter((field) => !isDeepStrictEqual(before[field], after[field])).map(String);
}

function pickTrackedFields(doc: MLSListingFirestoreDocument): Partial<MLSListingFirestoreDocument> {
  return {
    price: doc.price,
    status: doc.status,
    propertyType: doc.propertyType ?? null,
    commonInterest: doc.commonInterest ?? null,
    structureType: doc.structureType ?? null,
    propertyAttached: doc.propertyAttached ?? null,
    publicRemarks: doc.publicRemarks,
    isVisible: doc.isVisible,
    hiddenReason: doc.hiddenReason
  };
}

function mapSnapshotReason(
  existing: MLSListingFirestoreDocument | null,
  changedFields: string[]
): "created" | "updated" | "hidden" | "price_changed" | "status_changed" | "remarks_changed" {
  if (!existing) return "created";
  if (changedFields.includes("isVisible") || changedFields.includes("hiddenReason")) return "hidden";
  if (changedFields.includes("price")) return "price_changed";
  if (changedFields.includes("status")) return "status_changed";
  if (changedFields.includes("publicRemarks")) return "remarks_changed";
  return "updated";
}
