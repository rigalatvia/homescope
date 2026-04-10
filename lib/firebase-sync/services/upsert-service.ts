import type { FirestoreSyncRepository } from "@/lib/firebase-sync/firestore/repository";
import { maybeWriteListingSnapshot } from "@/lib/firebase-sync/services/snapshot-service";
import type { ListingFirestoreDocument, NormalizedListing } from "@/types/firebase-sync";

export interface UpsertOutcome {
  upserted: number;
  unchanged: number;
  snapshotsWritten: number;
}

export async function upsertNormalizedListings(params: {
  repository: FirestoreSyncRepository;
  listings: NormalizedListing[];
  nowIso: string;
}): Promise<UpsertOutcome> {
  let upserted = 0;
  let unchanged = 0;
  let snapshotsWritten = 0;

  for (const normalized of params.listings) {
    const existing = await params.repository.getListingBySourceKey(normalized.sourceListingKey);
    const doc = toListingDocument(normalized, params.nowIso, existing);

    if (existing && existing.rawSourceHash === doc.rawSourceHash && existing.isVisible === doc.isVisible) {
      unchanged += 1;
      continue;
    }

    await params.repository.upsertListing(doc);
    upserted += 1;

    const wrote = await maybeWriteListingSnapshot({
      repository: params.repository,
      before: existing,
      after: doc,
      nowIso: params.nowIso
    });

    if (wrote) snapshotsWritten += 1;
  }

  return { upserted, unchanged, snapshotsWritten };
}

function toListingDocument(
  listing: NormalizedListing,
  nowIso: string,
  existing: ListingFirestoreDocument | null
): ListingFirestoreDocument {
  return {
    ...listing,
    createdAt: existing?.createdAt || nowIso,
    updatedAt: nowIso,
    lastSeenInSourceAt: nowIso
  };
}
