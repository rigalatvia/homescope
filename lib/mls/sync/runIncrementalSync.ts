import type { MLSConnectorKind, MLSSyncResult, MLSSyncStats } from "@/lib/mls/types";
import { normalizeListing } from "@/lib/mls/normalize/normalizeListing";
import { createMLSConnector } from "@/lib/mls/sync/createConnector";
import { upsertNormalizedListings } from "@/lib/mls/upsert/upsertListings";
import { logSyncError, logSyncInfo } from "@/lib/mls/utils/logger";

export async function runIncrementalSync(params?: {
  connectorKind?: MLSConnectorKind;
  since?: Date;
}): Promise<MLSSyncResult> {
  const startedAt = new Date().toISOString();
  const connector = createMLSConnector(params?.connectorKind);
  const since = params?.since ?? new Date(Date.now() - 15 * 60 * 1000);
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

  logSyncInfo("Incremental sync started", {
    connector: connector.connectorName,
    since: since.toISOString()
  });

  try {
    const rawListings = await connector.fetchUpdatedListings(since);
    stats.fetched = rawListings.length;
    logSyncInfo("Incremental sync fetched listings", { count: stats.fetched });

    const nowIso = new Date().toISOString();
    const normalized = rawListings.map((raw) => normalizeListing(raw, nowIso));
    stats.normalized = normalized.length;
    stats.included = normalized.filter((l) => l.isVisible).length;
    stats.excluded = normalized.length - stats.included;
    stats.excludedPermToAdvertiseFalse = normalized.filter(
      (listing) => listing.hiddenReason === "perm_to_advertise_false"
    ).length;
    logSyncInfo("Incremental sync exclusion breakdown", {
      excludedTotal: stats.excluded,
      excludedPermToAdvertiseFalse: stats.excludedPermToAdvertiseFalse
    });

    const upsert = await upsertNormalizedListings(normalized, nowIso);
    stats.upserted = upsert.upserted;
    stats.unchanged = upsert.unchanged;
    stats.snapshotsWritten = upsert.snapshotsWritten;

    const finishedAt = new Date().toISOString();
    logSyncInfo("Incremental sync completed", { stats });

    return {
      mode: "incremental",
      connector: connector.connectorName as MLSConnectorKind,
      sourceSystem: connector.sourceSystem,
      startedAt,
      finishedAt,
      stats
    };
  } catch (error) {
    stats.failed += 1;
    logSyncError("Incremental sync failed", error, { stats });
    throw error;
  }
}
