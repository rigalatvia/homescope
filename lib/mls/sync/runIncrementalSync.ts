import type { MLSConnectorKind, MLSHiddenReason, MLSSyncResult, MLSSyncStats, NormalizedMLSListing } from "@/lib/mls/types";
import { filterRawListingsByTargetPostalAreas } from "@/lib/mls/filter/targetPostalAreas";
import { normalizeListing } from "@/lib/mls/normalize/normalizeListing";
import { cleanupMisclassifiedKingstonListings } from "@/lib/mls/sync/cleanupMisclassifiedKingstonListings";
import { createMLSConnector } from "@/lib/mls/sync/createConnector";
import {
  getDefaultIncrementalStartPage,
  getIncrementalNextCursor,
  getIncrementalStartPage,
  getIncrementalSweepStartedAt,
  getIncrementalSyncSince,
  setIncrementalNextCursor,
  setIncrementalStartPage,
  setIncrementalSweepStartedAt,
  setIncrementalSyncSince
} from "@/lib/mls/sync/incrementalSyncCursor";
import { deleteStoredHiddenAndNonActiveListings } from "@/lib/mls/sync/staleCleanup";
import { clearMLSSyncStop, isMLSSyncStopRequested } from "@/lib/mls/sync/stopSignal";
import { deleteExistingListingDocuments } from "@/lib/mls/upsert/repository";
import { upsertNormalizedListings } from "@/lib/mls/upsert/upsertListings";
import { logSyncError, logSyncInfo } from "@/lib/mls/utils/logger";
import { ensureServerSecretsLoaded } from "@/lib/server/secret-manager";
import { mlsSyncConfig } from "@/lib/mls/config";

export async function runIncrementalSync(params?: {
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
    const cleanupRemoved = await cleanupMisclassifiedKingstonListings();
    if (cleanupRemoved > 0) {
      stats.archived += cleanupRemoved;
      notes.push(`cleanup removed ${cleanupRemoved} Kingston listing(s) incorrectly mapped into King.`);
    }

    const preCleanup = await deleteStoredHiddenAndNonActiveListings();
    if (preCleanup.deleted > 0) {
      stats.archived += preCleanup.deleted;
      stats.hidden += preCleanup.deleted;
      notes.push(
        `cleanup deleted ${preCleanup.deleted} listing(s) already stored as hidden or non-active before incremental processing.`
      );
    }

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
      await setIncrementalStartPage(startPage);
      await setIncrementalNextCursor(null);
      await setIncrementalSweepStartedAt(sweepStartedAt);
      notes.push(`Incremental cursor overridden manually. Restarted incremental sweep from page ${startPage}.`);
    } else if (startPage > getDefaultIncrementalStartPage() && !nextCursor) {
      startPage = getDefaultIncrementalStartPage();
      sweepStartedAt = startedAt;
      await setIncrementalStartPage(startPage);
      await setIncrementalNextCursor(null);
      await setIncrementalSweepStartedAt(sweepStartedAt);
      notes.push(`Incremental cursor was reset from an incomplete legacy state and restarted at page ${startPage}.`);
    } else if (startPage === getDefaultIncrementalStartPage()) {
      nextCursor = null;
      sweepStartedAt = startedAt;
      await setIncrementalNextCursor(null);
      await setIncrementalSweepStartedAt(sweepStartedAt);
      notes.push(`Incremental sweep started at ${sweepStartedAt}.`);
    } else if (!sweepStartedAt) {
      startPage = getDefaultIncrementalStartPage();
      nextCursor = null;
      sweepStartedAt = startedAt;
      await setIncrementalStartPage(startPage);
      await setIncrementalNextCursor(null);
      await setIncrementalSweepStartedAt(sweepStartedAt);
      notes.push(`Incremental resumed without a sweep marker, so it restarted safely at page ${startPage}.`);
    }

    let page = startPage;
    let reachedEnd = false;
    const maxPages = Math.max(1, mlsSyncConfig.incrementalMaxPagesPerRun);
    const stopPage = startPage + maxPages - 1;

    while (page <= stopPage) {
      if (await isMLSSyncStopRequested()) {
        await setIncrementalStartPage(page);
        await setIncrementalNextCursor(nextCursor);
        await clearMLSSyncStop();
        notes.push(`Incremental sync stop requested. Paused before page ${page}. Continue from page ${page} on next run.`);
        return buildIncrementalResult(startedAt, stats, notes, connector.connectorName as MLSConnectorKind, connector.sourceSystem);
      }

      const rawPage = await connector.fetchUpdatedListingsPage(since, {
        page,
        pageSize: mlsSyncConfig.pageSize,
        cursor: nextCursor
      });

      if (rawPage.items.length === 0) {
        reachedEnd = true;
        break;
      }

      stats.fetched += rawPage.items.length;
      logSyncInfo("Incremental sync fetched listings page", { page, count: rawPage.items.length });

      const filteredRaw = filterRawListingsByTargetPostalAreas(rawPage.items);
      stats.filtered += filteredRaw.included.length;
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

      const visibleListings = normalized.filter((listing) => listing.isVisible);
      const hiddenListings = normalized.filter((listing) => !listing.isVisible);

      const upsert = await upsertNormalizedListings(visibleListings, nowIso);
      stats.created += upsert.created;
      stats.updated += upsert.updated;
      stats.upserted += upsert.upserted;
      stats.unchanged += upsert.unchanged;
      stats.snapshotsWritten += upsert.snapshotsWritten;

      if (hiddenListings.length > 0) {
        const deleted = await deleteExistingListingDocuments(hiddenListings.map((listing) => listing.listingId));
        stats.archived += deleted;
        stats.hidden += deleted;
        if (deleted > 0) {
          notes.push(`incremental deleted ${deleted} non-active or hidden listing(s) from page ${page}.`);
        }
      }

      if (!rawPage.nextCursor || rawPage.items.length < mlsSyncConfig.pageSize) {
        reachedEnd = true;
        break;
      }

      nextCursor = rawPage.nextCursor;
      page += 1;
    }

    const finishedAt = new Date().toISOString();

    if (reachedEnd) {
      const nextSince = sweepStartedAt || finishedAt;
      await setIncrementalSyncSince(nextSince);
      await setIncrementalStartPage(getDefaultIncrementalStartPage());
      await setIncrementalNextCursor(null);
      await setIncrementalSweepStartedAt(null);
      notes.push(`Incremental reached end of updated feed. Cursor advanced_to=${nextSince} and page reset to 1.`);
    } else {
      await setIncrementalStartPage(page);
      await setIncrementalNextCursor(nextCursor);
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
    return buildIncrementalResult(startedAt, stats, notes, connector.connectorName as MLSConnectorKind, connector.sourceSystem);
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
  sourceSystem: string
): MLSSyncResult {
  const finishedAt = new Date().toISOString();
  return {
    mode: "incremental",
    connector: connectorKind,
    sourceSystem,
    startedAt,
    finishedAt,
    stats,
    notes
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
