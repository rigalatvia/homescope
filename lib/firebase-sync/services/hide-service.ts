import type { FirestoreSyncRepository } from "@/lib/firebase-sync/firestore/repository";

export async function hideMissingListings(params: {
  repository: FirestoreSyncRepository;
  seenSourceKeys: Set<string>;
  nowIso: string;
}): Promise<number> {
  let hidden = 0;
  const sourceKeys = await params.repository.listAllSourceKeys();

  for (const sourceKey of sourceKeys) {
    if (params.seenSourceKeys.has(sourceKey)) continue;

    const existing = await params.repository.getListingBySourceKey(sourceKey);
    if (!existing || !existing.isVisible) continue;

    await params.repository.hideListing(existing.listingId, "connector_not_returned", params.nowIso);
    hidden += 1;
  }

  return hidden;
}

export async function cleanupStaleListings(params: {
  repository: FirestoreSyncRepository;
  staleBeforeIso: string;
  nowIso: string;
}): Promise<number> {
  const stale = await params.repository.listStaleListings(params.staleBeforeIso);
  let hidden = 0;

  for (const listing of stale) {
    if (!listing.isVisible) continue;
    await params.repository.hideListing(listing.listingId, "stale_listing", params.nowIso);
    hidden += 1;
  }

  return hidden;
}
