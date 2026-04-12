import { deleteListingDocument, listAllListingIds, listStaleVisibleListings } from "@/lib/mls/upsert/repository";
import { logSyncInfo } from "@/lib/mls/utils/logger";

export async function hideNotReturnedListings(seenListingIds: Set<string>, nowIso: string): Promise<number> {
  void nowIso;
  const allListingIds = await listAllListingIds();
  let deleted = 0;

  for (const listingId of allListingIds) {
    if (seenListingIds.has(listingId)) continue;
    await deleteListingDocument(listingId);
    deleted += 1;
  }

  if (deleted > 0) {
    logSyncInfo("Listings deleted because connector did not return them", { deleted });
  }

  return deleted;
}

export async function hideStaleListings(staleBeforeIso: string, nowIso: string): Promise<number> {
  void nowIso;
  const stale = await listStaleVisibleListings(staleBeforeIso);
  let deleted = 0;

  for (const listing of stale) {
    await deleteListingDocument(listing.listingId);
    deleted += 1;
  }

  logSyncInfo("Stale cleanup deleted listings", {
    staleBeforeIso,
    deleted
  });

  return deleted;
}
