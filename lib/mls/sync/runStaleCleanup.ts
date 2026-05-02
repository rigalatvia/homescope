import { mlsSyncConfig } from "@/lib/mls/config";
import type { MLSConnectorKind, MLSSyncResult, MLSSyncStats } from "@/lib/mls/types";
import { cleanupMisclassifiedKingstonListings } from "@/lib/mls/sync/cleanupMisclassifiedKingstonListings";
import { createMLSConnector } from "@/lib/mls/sync/createConnector";
import {
  getDefaultFullSyncStartPage,
  setFullSyncNextCursor,
  setFullSyncStartPage,
  setFullSyncSweepStartedAt
} from "@/lib/mls/sync/fullSyncCursor";
import {
  deleteExistingListingDocuments,
  listHiddenListings,
  listListingsWithStatuses
} from "@/lib/mls/upsert/repository";
import { logSyncError, logSyncInfo } from "@/lib/mls/utils/logger";

export async function runStaleCleanup(_connectorKind?: MLSConnectorKind): Promise<MLSSyncResult> {
  const startedAt = new Date().toISOString();
  const nowIso = new Date().toISOString();
  const notes: string[] = [];
  const stats: MLSSyncStats = {
    fetched: 0,
    filtered: 0,
    normalized: 0,
    included: 0,
    excluded: 0,
    excludedPermToAdvertiseFalse: 0,
    hiddenByReason: {},
    created: 0,
    updated: 0,
    archived: 0,
    upserted: 0,
    hidden: 0,
    unchanged: 0,
    snapshotsWritten: 0,
    failed: 0
  };

  logSyncInfo("Cleanup started (non-active and hidden listings mode)", {
    sourceSystem: mlsSyncConfig.sourceSystem
  });

  try {
    const connector = createMLSConnector(_connectorKind);

    const cleanupRemoved = await cleanupMisclassifiedKingstonListings();
    if (cleanupRemoved > 0) {
      stats.archived += cleanupRemoved;
      stats.hidden += cleanupRemoved;
      stats.hiddenByReason.connector_not_returned = cleanupRemoved;
      notes.push(`cleanup removed ${cleanupRemoved} misclassified King-area listing(s).`);
    }

    const [hiddenListings, nonActiveListings] = await Promise.all([
      listHiddenListings(),
      listListingsWithStatuses(["sold", "leased", "suspended", "expired", "terminated", "draft"])
    ]);

    const hiddenIds = hiddenListings.map((listing) => listing.listingId);
    const nonActiveIds = nonActiveListings.map((listing) => listing.listingId);
    const candidateIds = Array.from(new Set([...hiddenIds, ...nonActiveIds]));
    stats.fetched = candidateIds.length;

    const deleted = await deleteExistingListingDocuments(candidateIds);

    stats.hidden += deleted;
    stats.archived += deleted;
    stats.hiddenByReason = {
      ...(cleanupRemoved > 0 ? { connector_not_returned: cleanupRemoved } : {}),
      ...(nonActiveIds.length > 0 ? { status_not_displayable: nonActiveIds.length } : {}),
      ...(hiddenIds.length > 0 ? { stale_listing: hiddenIds.length } : {})
    };

    if (connector.fetchNonActiveListingsPage) {
      let page = 1;
      let cursor: string | null = null;
      let fetchedFromFeed = 0;
      let deletedFromFeed = 0;

      while (true) {
        const feedPage = await connector.fetchNonActiveListingsPage({
          page,
          pageSize: mlsSyncConfig.pageSize,
          cursor
        });

        if (feedPage.items.length === 0) break;

        fetchedFromFeed += feedPage.items.length;
        const listingIds = feedPage.items.map((listing) => `${listing.sourceSystem}:${listing.sourceListingKey}`);
        const removed = await deleteExistingListingDocuments(listingIds);
        deletedFromFeed += removed;

        if (!feedPage.nextCursor || feedPage.items.length < mlsSyncConfig.pageSize) {
          break;
        }

        cursor = feedPage.nextCursor;
        page += 1;
      }

      if (fetchedFromFeed > 0) {
        stats.fetched += fetchedFromFeed;
        stats.hidden += deletedFromFeed;
        stats.archived += deletedFromFeed;
        stats.hiddenByReason.status_not_displayable =
          (stats.hiddenByReason.status_not_displayable || 0) + deletedFromFeed;
        notes.push(
          `cleanup checked ${fetchedFromFeed} current non-active feed row(s) and deleted ${deletedFromFeed} matching listing(s) from Firestore.`
        );
      }
    }

    await setFullSyncStartPage(getDefaultFullSyncStartPage());
    await setFullSyncNextCursor(null);
    await setFullSyncSweepStartedAt(null);
    notes.push(`cleanup deleted ${deleted} hidden or non-active listing(s).`);

    const finishedAt = new Date().toISOString();
    logSyncInfo("Cleanup summary (non-active and hidden listings mode)", {
      totalFetched: stats.fetched,
      totalWritten: stats.upserted,
      totalVisible: stats.included,
      totalHidden: stats.archived,
      totalArchived: stats.archived,
      hiddenByReason: stats.hiddenByReason
    });
    logSyncInfo("Cleanup completed", {
      hidden: stats.hidden,
      cursorResetToPage: getDefaultFullSyncStartPage(),
      deletedNonActive: nonActiveIds.length,
      deletedHidden: hiddenIds.length,
      completedAt: nowIso
    });

    return {
      mode: "cleanup",
      connector: "mock",
      sourceSystem: mlsSyncConfig.sourceSystem,
      startedAt,
      finishedAt,
      stats,
      notes
    };
  } catch (error) {
    stats.failed += 1;
    logSyncError("Stale cleanup failed", error, { stats });
    throw error;
  }
}
