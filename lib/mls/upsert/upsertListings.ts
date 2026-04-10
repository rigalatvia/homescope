import type { MLSListingFirestoreDocument, NormalizedMLSListing } from "@/lib/mls/types";
import { mlsSyncConfig } from "@/lib/mls/config";
import { createListingSnapshot, getListingById, upsertListingDocument } from "@/lib/mls/upsert/repository";
import { logSyncInfo } from "@/lib/mls/utils/logger";

const TRACKED_FIELDS: Array<keyof MLSListingFirestoreDocument> = ["price", "status", "publicRemarks", "isVisible", "hiddenReason"];

export async function upsertNormalizedListings(listings: NormalizedMLSListing[], nowIso: string): Promise<{
  upserted: number;
  unchanged: number;
  snapshotsWritten: number;
}> {
  let upserted = 0;
  let unchanged = 0;
  let snapshotsWritten = 0;

  for (const listing of listings) {
    const existing = await getListingById(listing.listingId);
    const doc = toFirestoreDoc(listing, nowIso, existing);

    if (existing && existing.rawSourceHash === doc.rawSourceHash && existing.isVisible === doc.isVisible) {
      unchanged += 1;
      continue;
    }

    await upsertListingDocument(doc);
    upserted += 1;

    logSyncInfo("Listing upserted", {
      listingId: doc.listingId,
      isVisible: doc.isVisible,
      hiddenReason: doc.hiddenReason
    });

    if (mlsSyncConfig.featureFlags.snapshotsEnabled) {
      const changedFields = getChangedFields(existing, doc);
      if (!existing || changedFields.length > 0) {
        await createListingSnapshot(
          doc.listingId,
          doc.sourceListingKey,
          existing ? changedFields : ["created"],
          existing ? pickTrackedFields(existing) : null,
          pickTrackedFields(doc),
          mapSnapshotReason(existing, changedFields),
          nowIso
        );
        snapshotsWritten += 1;
      }
    }
  }

  return { upserted, unchanged, snapshotsWritten };
}

function toFirestoreDoc(
  listing: NormalizedMLSListing,
  nowIso: string,
  existing: MLSListingFirestoreDocument | null
): MLSListingFirestoreDocument {
  return {
    ...listing,
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
  return TRACKED_FIELDS.filter((field) => before[field] !== after[field]).map(String);
}

function pickTrackedFields(doc: MLSListingFirestoreDocument): Partial<MLSListingFirestoreDocument> {
  return {
    price: doc.price,
    status: doc.status,
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
