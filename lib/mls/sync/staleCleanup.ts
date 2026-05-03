import {
  deleteExistingListingDocuments,
  listAllListingIds,
  listHiddenListings,
  listListingsWithStatuses,
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

export async function deleteListingsNotSeenSinceForSource(staleBeforeIso: string, sourceSystem: string): Promise<number> {
  const prefix = `${sourceSystem}:`;
  const stale = await listListingsNotSeenSince(staleBeforeIso);
  const deleted = await deleteExistingListingDocuments(
    stale.filter((listing) => listing.listingId.startsWith(prefix)).map((listing) => listing.listingId)
  );

  if (deleted > 0) {
    logSyncInfo("Listings deleted because they were not seen during the current cleanup sweep", {
      staleBeforeIso,
      sourceSystem,
      deleted
    });
  }

  return deleted;
}

export async function deleteStoredHiddenAndNonActiveListings(): Promise<{
  deleted: number;
  hiddenCandidates: number;
  nonActiveCandidates: number;
}> {
  const [hiddenListings, nonActiveListings] = await Promise.all([
    listHiddenListings(),
    listListingsWithStatuses(["sold", "leased", "suspended", "expired", "terminated", "draft"])
  ]);

  const hiddenIds = hiddenListings.map((listing) => listing.listingId);
  const nonActiveIds = nonActiveListings.map((listing) => listing.listingId);
  const deleted = await deleteExistingListingDocuments(Array.from(new Set([...hiddenIds, ...nonActiveIds])));

  if (deleted > 0) {
    logSyncInfo("Deleted listings already stored as hidden or non-active", {
      deleted,
      hiddenCandidates: hiddenIds.length,
      nonActiveCandidates: nonActiveIds.length
    });
  }

  return {
    deleted,
    hiddenCandidates: hiddenIds.length,
    nonActiveCandidates: nonActiveIds.length
  };
}
