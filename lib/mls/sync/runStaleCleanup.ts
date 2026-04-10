import { mlsSyncConfig } from "@/lib/mls/config";
import type { MLSConnectorKind, MLSSyncResult, MLSSyncStats } from "@/lib/mls/types";
import { hideStaleListings } from "@/lib/mls/sync/staleCleanup";
import { logSyncError, logSyncInfo } from "@/lib/mls/utils/logger";

export async function runStaleCleanup(_connectorKind?: MLSConnectorKind): Promise<MLSSyncResult> {
  const startedAt = new Date().toISOString();
  const now = Date.now();
  const staleBeforeIso = new Date(now - mlsSyncConfig.staleThresholdHours * 60 * 60 * 1000).toISOString();
  const stats: MLSSyncStats = {
    fetched: 0,
    normalized: 0,
    included: 0,
    excluded: 0,
    excludedPermToAdvertiseFalse: 0,
    upserted: 0,
    hidden: 0,
    unchanged: 0,
    snapshotsWritten: 0,
    failed: 0
  };

  logSyncInfo("Stale cleanup started", {
    staleBeforeIso,
    thresholdHours: mlsSyncConfig.staleThresholdHours
  });

  try {
    const nowIso = new Date().toISOString();
    stats.hidden = await hideStaleListings(staleBeforeIso, nowIso);
    const finishedAt = new Date().toISOString();
    logSyncInfo("Stale cleanup completed", { hidden: stats.hidden });

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
