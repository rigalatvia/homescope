import {
  deleteExistingListingDocuments,
  listAllListingIds,
  listListingsNotSeenSince,
  listStaleVisibleListings
} from "@/lib/mls/upsert/repository";
import { logSyncInfo } from "@/lib/mls/utils/logger";

export async function hideNotReturnedListings(seenListingIds: Set<string>, nowIso: string): Promise<number> {
  void nowIso;
  const allListingIds = await listAllListingIds();
  const missingListingIds = allListingIds.filter((listingId) => !seenListingIds.has(listingId));
  const deleted = await deleteExistingListingDocuments(missingListingIds);

  if (deleted > 0) {
    logSyncInfo("Listings deleted because connector did not return them", { deleted });
  }

  return deleted;
}

export async function hideStaleListings(staleBeforeIso: string, nowIso: string): Promise<number> {
  void nowIso;
  const stale = await listStaleVisibleListings(staleBeforeIso);
  const deleted = await deleteExistingListingDocuments(stale.map((listing) => listing.listingId));

  logSyncInfo("Stale cleanup deleted listings", {
    staleBeforeIso,
    deleted
  });

  return deleted;
}

export async function deleteListingsNotSeenSince(staleBeforeIso: string): Promise<number> {
  const stale = await listListingsNotSeenSince(staleBeforeIso);
  const deleted = await deleteExistingListingDocuments(stale.map((listing) => listing.listingId));

  if (deleted > 0) {
    logSyncInfo("Listings deleted because they were not seen during the current full sync cycle", {
      staleBeforeIso,
      deleted
    });
  }

  return deleted;
}
