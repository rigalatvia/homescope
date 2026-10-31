import { saveIncrementalCursor } from "@/lib/mls/sync/incrementalSyncCursor";
import { withSyncLease, recordRetrieved, recordFiltered, remainingSyncTime, syncMemoryPressure, releaseSyncPage } from "@/lib/mls/sync/execution";
import type { MLSConnectorKind, MLSHiddenReason, MLSSyncResult, MLSSyncStats, NormalizedMLSListing } from "@/lib/mls/types";
import { filterRawListingsByTargetPostalAreas } from "@/lib/mls/filter/targetPostalAreas";
import { normalizeListing } from "@/lib/mls/normalize/normalizeListing";
import { createMLSConnector } from "@/lib/mls/sync/createConnector";
import {
  getDefaultIncrementalStartPage,
  getIncrementalNextCursor,
  getIncrementalStartPage,
  getIncrementalSweepStartedAt,
  getIncrementalSyncSince,
} from "@/lib/mls/sync/incrementalSyncCursor";
import { clearMLSSyncStop, isMLSSyncStopRequested } from "@/lib/mls/sync/stopSignal";
import { upsertNormalizedListings } from "@/lib/mls/upsert/upsertListings";
import { logSyncError, logSyncInfo } from "@/lib/mls/utils/logger";
import { ensureServerSecretsLoaded } from "@/lib/server/secret-manager";
import { mlsSyncConfig } from "@/lib/mls/config";

async function runIncrementalSyncInternal(params?: {
  connectorKind?: MLSConnectorKind;
  since?: Date;
}): Promise<MLSSyncResult> {
  await ensureServerSecretsLoaded();

  const startedAt = new Date().toISOString();
  const connector = createMLSConnector(params?.connectorKind);
  const notes: string[] = [];

  const since =
    params?.since && !Number.isNaN(params.since.getTime())
      ? params.since
      : await getIncrementalSyncSince();

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

  logSyncInfo("Incremental sync started", {
    connector: connector.connectorName,
    since: since.toISOString(),
    sinceSource: params?.since ? "request" : "cursor"
  });

  try {
    if (!connector.fetchUpdatedListingsPage) {
      throw new Error("Incremental sync connector does not support paged updated-listing fetches.");
    }

    let startPage = await getIncrementalStartPage();
    let nextCursor = await getIncrementalNextCursor();
    let sweepStartedAt = await getIncrementalSweepStartedAt();

    if (params?.since && !Number.isNaN(params.since.getTime())) {
      startPage = getDefaultIncrementalStartPage();
      nextCursor = null;
      sweepStartedAt = startedAt;
      await saveIncrementalCursor({ nextPage: startPage, nextCursor: null, sweepStartedAt, sweepSinceIso: since.toISOString() });
      notes.push(`Incremental cursor overridden manually. Restarted incremental sweep from page ${startPage}.`);
    } else if (startPage > getDefaultIncrementalStartPage() && !nextCursor) {
      startPage = getDefaultIncrementalStartPage();
      sweepStartedAt = startedAt;
      await saveIncrementalCursor({ nextPage: startPage, nextCursor: null, sweepStartedAt });
      notes.push(`Incremental cursor was reset from an incomplete legacy state and restarted at page ${startPage}.`);
    } else if (startPage === getDefaultIncrementalStartPage()) {
      nextCursor = null;
      sweepStartedAt = startedAt;
      await saveIncrementalCursor({ nextPage: 1, nextCursor: null, sweepStartedAt });
      notes.push(`Incremental sweep started at ${sweepStartedAt}.`);
    } else if (!sweepStartedAt) {
      startPage = getDefaultIncrementalStartPage();
      nextCursor = null;
      sweepStartedAt = startedAt;
      await saveIncrementalCursor({ nextPage: startPage, nextCursor: null, sweepStartedAt });
      notes.push(`Incremental resumed without a sweep marker, so it restarted safely at page ${startPage}.`);
    }

    let page = startPage;
    let reachedEnd = false;
    const maxPages = Math.max(1, mlsSyncConfig.incrementalMaxPagesPerRun);
    const stopPage = startPage + maxPages - 1;

    while (page <= stopPage) {
      releaseSyncPage();
      if (syncMemoryPressure()) {
        notes.push("Memory budget reached; saved cursor will resume on retry.");
        break;
      }
      if (remainingSyncTime() < 5000) {
        notes.push("Runtime budget reached; saved cursor will resume on retry.");
        break;
      }
      if (await isMLSSyncStopRequested()) {
        await saveIncrementalCursor({ nextPage: page, nextCursor, sweepStartedAt });
        await clearMLSSyncStop();
        notes.push(`Incremental sync stop requested. Paused before page ${page}. Continue from page ${page} on next run.`);
        return buildIncrementalResult(startedAt, stats, notes, connector.connectorName as MLSConnectorKind, connector.sourceSystem);
      }

      const rawPage = await connector.fetchUpdatedListingsPage(since, {
        page,
        pageSize: Math.min(50, mlsSyncConfig.pageSize),
        cursor: nextCursor
      });

      if (rawPage.items.length === 0 && !rawPage.nextCursor) {
        reachedEnd = true;
        break;
      }

      stats.fetched += rawPage.items.length;
      recordRetrieved(rawPage.items.length);
      logSyncInfo("Incremental sync fetched listings page", { page, count: rawPage.items.length });

      const filteredRaw = filterRawListingsByTargetPostalAreas(rawPage.items);
      stats.filtered += filteredRaw.included.length;
      recordFiltered(filteredRaw.included.length);
      if (filteredRaw.excludedCount > 0) {
        logSyncInfo("Incremental sync target-area filter applied", {
          page,
          kept: filteredRaw.included.length,
          excludedOutsideTargetAreas: filteredRaw.excludedCount
        });
      }

      const nowIso = new Date().toISOString();
      const normalized = filteredRaw.included.map((raw) => normalizeListing(raw, nowIso));
      stats.normalized += normalized.length;
      const visibleCount = normalized.filter((l) => l.isVisible).length;
      stats.included += visibleCount;
      stats.excluded += normalized.length - visibleCount;
      mergeHiddenReasonCounts(stats.hiddenByReason, buildHiddenReasonCounts(normalized));
      stats.excludedPermToAdvertiseFalse += normalized.filter(
        (listing) => listing.hiddenReason === "perm_to_advertise_false"
      ).length;

      const upsert = await upsertNormalizedListings(normalized, nowIso);
      stats.created += upsert.created;
      stats.updated += upsert.updated;
      stats.upserted += upsert.upserted;
      stats.unchanged += upsert.unchanged;
      stats.snapshotsWritten += upsert.snapshotsWritten;

      stats.hidden += upsert.hidden;
      stats.archived += upsert.hidden;

      if (!rawPage.nextCursor) {
        reachedEnd = true;
        break;
      }

      nextCursor = rawPage.nextCursor;
      page += 1;
      await saveIncrementalCursor({ nextPage: page, nextCursor, sweepStartedAt });
    }

    const finishedAt = new Date().toISOString();

    if (reachedEnd) {
      const nextSince = new Date(Date.parse(sweepStartedAt || startedAt) - 5 * 60 * 1000).toISOString();
      await saveIncrementalCursor({ sinceIso: nextSince, nextPage: 1, nextCursor: null, sweepStartedAt: null, sweepSinceIso: null });
      notes.push(`Incremental reached end of updated feed. Cursor advanced_to=${nextSince} and page reset to 1.`);
    } else {
      await saveIncrementalCursor({ nextPage: page, nextCursor, sweepStartedAt });
      notes.push(
        `Incremental processed a batch (${maxPages} page${maxPages === 1 ? "" : "s"}) from page ${startPage}. Continue from page ${page} on next run.`
      );
    }
    logSyncInfo("Incremental sync summary", {
      totalFetched: stats.fetched,
      totalFiltered: stats.filtered,
      totalWritten: stats.upserted,
      totalCreated: stats.created,
      totalUpdated: stats.updated,
      totalVisible: stats.included,
      totalHidden: stats.excluded,
      totalArchived: stats.archived,
      hiddenByReason: stats.hiddenByReason,
      nextSince: reachedEnd ? sweepStartedAt || finishedAt : since.toISOString()
    });
    logSyncInfo("Incremental sync completed", { stats });
    return buildIncrementalResult(startedAt, stats, notes, connector.connectorName as MLSConnectorKind, connector.sourceSystem, reachedEnd);
  } catch (error) {
    stats.failed += 1;
    logSyncError("Incremental sync failed", error, { stats });
    throw error;
  }
}

function buildIncrementalResult(
  startedAt: string,
  stats: MLSSyncStats,
  notes: string[],
  connectorKind: MLSConnectorKind,
  sourceSystem: string,
  complete = false
): MLSSyncResult {
  const finishedAt = new Date().toISOString();
  return {
    mode: "incremental",
    connector: connectorKind,
    sourceSystem,
    startedAt,
    finishedAt,
    stats,
    notes,
    complete
  };
}

function mergeHiddenReasonCounts(
  target: MLSSyncStats["hiddenByReason"],
  source: MLSSyncStats["hiddenByReason"]
): void {
  for (const [reason, count] of Object.entries(source)) {
    if (!reason || !count) continue;
    const key = reason as MLSHiddenReason;
    target[key] = (target[key] || 0) + count;
  }
}

function buildHiddenReasonCounts(listings: NormalizedMLSListing[]): MLSSyncStats["hiddenByReason"] {
  const counts: MLSSyncStats["hiddenByReason"] = {};
  for (const listing of listings) {
    if (!listing.hiddenReason) continue;
    const reason = listing.hiddenReason as MLSHiddenReason;
    counts[reason] = (counts[reason] || 0) + 1;
  }
  return counts;
}

export async function runIncrementalSync(params?: { connectorKind?: MLSConnectorKind; since?: Date }): Promise<MLSSyncResult> {
  await ensureServerSecretsLoaded();
  return withSyncLease(() => runIncrementalSyncInternal(params));
}
