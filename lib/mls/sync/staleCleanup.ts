import { hideListingDocument, listAllListingIds, listStaleVisibleListings } from "@/lib/mls/upsert/repository";
import { logSyncInfo } from "@/lib/mls/utils/logger";

export async function hideNotReturnedListings(seenListingIds: Set<string>, nowIso: string): Promise<number> {
  const allListingIds = await listAllListingIds();
  let hidden = 0;

  for (const listingId of allListingIds) {
    if (seenListingIds.has(listingId)) continue;
    await hideListingDocument(listingId, "connector_not_returned", nowIso);
    hidden += 1;
  }

  if (hidden > 0) {
    logSyncInfo("Listings hidden because connector did not return them", { hidden });
  }

  return hidden;
}

export async function hideStaleListings(staleBeforeIso: string, nowIso: string): Promise<number> {
  const stale = await listStaleVisibleListings(staleBeforeIso);
  let hidden = 0;

  for (const listing of stale) {
    await hideListingDocument(listing.listingId, "stale_listing", nowIso);
    hidden += 1;
  }

  logSyncInfo("Stale cleanup completed", {
    staleBeforeIso,
    hidden
  });

  return hidden;
}
