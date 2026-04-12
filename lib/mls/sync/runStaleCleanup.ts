import { mlsSyncConfig } from "@/lib/mls/config";
import type { MLSConnectorKind, MLSSyncResult, MLSSyncStats } from "@/lib/mls/types";
import { getDefaultFullSyncStartPage, setFullSyncStartPage } from "@/lib/mls/sync/fullSyncCursor";
import { listAllListingIds, deleteListingDocument } from "@/lib/mls/upsert/repository";
import { logSyncError, logSyncInfo } from "@/lib/mls/utils/logger";

export async function runStaleCleanup(_connectorKind?: MLSConnectorKind): Promise<MLSSyncResult> {
  const startedAt = new Date().toISOString();
  const nowIso = new Date().toISOString();
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

  logSyncInfo("Cleanup started (full listings reset mode)", {
    sourceSystem: mlsSyncConfig.sourceSystem
  });

  try {
    const allListingIds = await listAllListingIds();
    stats.fetched = allListingIds.length;

    for (const listingId of allListingIds) {
      await deleteListingDocument(listingId);
    }

    stats.hidden = allListingIds.length;
    stats.archived = stats.hidden;
    stats.hiddenByReason = stats.hidden > 0 ? { stale_listing: stats.hidden } : {};

    await setFullSyncStartPage(getDefaultFullSyncStartPage());

    const finishedAt = new Date().toISOString();
    logSyncInfo("Cleanup summary (full listings reset mode)", {
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
      completedAt: nowIso
    });

    return {
      mode: "cleanup",
      connector: "mock",
      sourceSystem: mlsSyncConfig.sourceSystem,
      startedAt,
      finishedAt,
      stats
    };
  } catch (error) {
    stats.failed += 1;
    logSyncError("Stale cleanup failed", error, { stats });
    throw error;
  }
}
