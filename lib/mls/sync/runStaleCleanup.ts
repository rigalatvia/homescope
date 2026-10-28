import { saveCleanupCursor } from "@/lib/mls/sync/cleanupCursor";
import { recordReconciliationPage, reconcileMissing, hasReconciliationManifest, IncompleteReconciliationError } from "@/lib/mls/sync/reconciliation";
import { withSyncLease, recordRetrieved, recordFiltered, remainingSyncTime } from "@/lib/mls/sync/execution";
import { mlsSyncConfig } from "@/lib/mls/config";
import { filterRawListingsByTargetPostalAreas } from "@/lib/mls/filter/targetPostalAreas";
import { normalizeListing } from "@/lib/mls/normalize/normalizeListing";
import {
  getCleanupNextCursor,
  getCleanupStartPage,
  getCleanupSweepStartedAt,
  getDefaultCleanupStartPage,
} from "@/lib/mls/sync/cleanupCursor";
import { createMLSConnector } from "@/lib/mls/sync/createConnector";
import { clearMLSSyncStop, isMLSSyncStopRequested } from "@/lib/mls/sync/stopSignal";
import { upsertNormalizedListings } from "@/lib/mls/upsert/upsertListings";
import { logSyncError, logSyncInfo } from "@/lib/mls/utils/logger";
import { ensureServerSecretsLoaded } from "@/lib/server/secret-manager";
import type { MLSConnectorKind, MLSHiddenReason, MLSSyncResult, MLSSyncStats, NormalizedMLSListing } from "@/lib/mls/types";

async function runStaleCleanupInternal(
  connectorKind?: MLSConnectorKind,
  options?: { maxPagesPerRun?: number; reconciliationOnly?: boolean }
): Promise<MLSSyncResult> {
  await ensureServerSecretsLoaded();

  const startedAt = new Date().toISOString();
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

  logSyncInfo("Cleanup started (active-feed reconciliation mode)", {
    sourceSystem: mlsSyncConfig.sourceSystem
  });

  try {
    const connector = createMLSConnector(connectorKind);

    if (!connector.fetchActiveListingsPage) {
      notes.push("cleanup connector does not support active-feed reconciliation.");
      return buildCleanupResult(startedAt, stats, notes, connector.connectorName as MLSConnectorKind, connector.sourceSystem);
    }

    let startPage = await getCleanupStartPage();
    let nextCursor = await getCleanupNextCursor();
    let sweepStartedAt = await getCleanupSweepStartedAt();
    if (startPage > 1 && !await hasReconciliationManifest("cleanup", connector.sourceSystem, sweepStartedAt)) {
      startPage = 1; nextCursor = null; sweepStartedAt = null;
      await saveCleanupCursor({ nextPage: 1, nextCursor: null, sweepStartedAt: null });
    }

    if (startPage > getDefaultCleanupStartPage() && !nextCursor) {
      startPage = getDefaultCleanupStartPage();
      sweepStartedAt = startedAt;
      await saveCleanupCursor({ nextPage: startPage, nextCursor: null, sweepStartedAt });
      notes.push(`Cleanup cursor was reset from an incomplete legacy state and restarted at page ${startPage}.`);
    } else if (startPage === getDefaultCleanupStartPage()) {
      nextCursor = null;
      sweepStartedAt = startedAt;
      await saveCleanupCursor({ nextPage: 1, nextCursor: null, sweepStartedAt });
      notes.push(`Cleanup sweep started at ${sweepStartedAt}.`);
    } else if (!sweepStartedAt) {
      startPage = getDefaultCleanupStartPage();
      nextCursor = null;
      sweepStartedAt = startedAt;
      await saveCleanupCursor({ nextPage: startPage, nextCursor: null, sweepStartedAt });
      notes.push(`Cleanup resumed without a sweep marker, so it restarted safely at page ${startPage}.`);
    }

    let page = startPage;
    let reachedEnd = false;
    const maxPages = Math.max(1, options?.maxPagesPerRun ?? mlsSyncConfig.cleanupMaxPagesPerRun);
    const stopPage = startPage + maxPages - 1;

    while (page <= stopPage) {
      if (remainingSyncTime() < 5000) {
        notes.push("Runtime budget reached; saved cursor will resume on retry.");
        break;
      }
      if (await isMLSSyncStopRequested()) {
        await saveCleanupCursor({ nextPage: page, nextCursor, sweepStartedAt });
        await clearMLSSyncStop();
        notes.push(`Cleanup stop requested. Paused before page ${page}. Continue from page ${page} on next run.`);
        return buildCleanupResult(startedAt, stats, notes, connector.connectorName as MLSConnectorKind, connector.sourceSystem);
      }

      const activePage = await connector.fetchActiveListingsPage({
        page,
        pageSize: mlsSyncConfig.pageSize,
        cursor: nextCursor
      });

      if (activePage.items.length === 0 && !activePage.nextCursor) {
        if (sweepStartedAt) await recordReconciliationPage("cleanup", connector.sourceSystem, sweepStartedAt, page, [], 0);
        reachedEnd = true;
        break;
      }

      stats.fetched += activePage.items.length;
      recordRetrieved(activePage.items.length);
      logSyncInfo("Cleanup fetched current active page", { page, count: activePage.items.length });

      const filteredRaw = filterRawListingsByTargetPostalAreas(activePage.items);
      stats.filtered += filteredRaw.included.length;
      recordFiltered(filteredRaw.included.length);

      const nowIso = new Date().toISOString();
      const normalized = filteredRaw.included.map((raw) => normalizeListing(raw, nowIso));
      stats.normalized += normalized.length;
      stats.included += normalized.filter((listing) => listing.isVisible).length;
      stats.excluded += normalized.length - normalized.filter((listing) => listing.isVisible).length;
      incrementHiddenReasonCounts(stats.hiddenByReason, buildHiddenReasonCounts(normalized));
      stats.excludedPermToAdvertiseFalse += normalized.filter(
        (listing) => listing.hiddenReason === "perm_to_advertise_false"
      ).length;

      const visibleListings = normalized.filter((listing) => listing.isVisible);

      // Daily incremental sync already applies changed records. Cleanup only needs
      // the manifest, avoiding a second full-document read of every active record.
      const upsert = options?.reconciliationOnly
        ? { created: 0, updated: 0, upserted: 0, unchanged: 0, snapshotsWritten: 0, hidden: 0 }
        : await upsertNormalizedListings(normalized, nowIso);
      stats.created += upsert.created;
      stats.updated += upsert.updated;
      stats.upserted += upsert.upserted;
      stats.unchanged += upsert.unchanged;
      stats.snapshotsWritten += upsert.snapshotsWritten;
      if (sweepStartedAt) await recordReconciliationPage("cleanup", connector.sourceSystem, sweepStartedAt, page, visibleListings.map(listing => listing.listingId), activePage.items.length);

      stats.hidden += upsert.hidden;
      stats.archived += upsert.hidden;

      if (!activePage.nextCursor) {
        reachedEnd = true;
        break;
      }

      nextCursor = activePage.nextCursor;
      page += 1;
      await saveCleanupCursor({ nextPage: page, nextCursor, sweepStartedAt });
    }

    if (reachedEnd) {
      if (sweepStartedAt) {
        const hiddenNotSeen = await reconcileMissing("cleanup", connector.sourceSystem, sweepStartedAt, page);
        if (hiddenNotSeen > 0) {
          stats.archived += hiddenNotSeen;
          stats.hidden += hiddenNotSeen;
          stats.hiddenByReason.connector_not_returned =
            (stats.hiddenByReason.connector_not_returned || 0) + hiddenNotSeen;
          notes.push(`cleanup hidden ${hiddenNotSeen} listing(s) not present in the current active feed.`);
        }
      }

      await saveCleanupCursor({ nextPage: getDefaultCleanupStartPage(), nextCursor: null, sweepStartedAt: null });
      notes.push("Cleanup reached end of current active feed. Cursor reset to page 1.");
    } else {
      await saveCleanupCursor({ nextPage: page, nextCursor, sweepStartedAt });
      notes.push(
        `Cleanup processed a batch (${maxPages} page${maxPages === 1 ? "" : "s"}) from page ${startPage}. Continue from page ${page} on next run.`
      );
    }

    return buildCleanupResult(
      startedAt,
      stats,
      notes,
      connector.connectorName as MLSConnectorKind,
      connector.sourceSystem,
      reachedEnd
    );
  } catch (error) {
    if (error instanceof IncompleteReconciliationError) {
      await saveCleanupCursor({ nextPage: 1, nextCursor: null, sweepStartedAt: null });
    }
    stats.failed += 1;
    logSyncError("Stale cleanup failed", error, { stats });
    throw error;
  }
}

function buildCleanupResult(
  startedAt: string,
  stats: MLSSyncStats,
  notes: string[],
  connectorKind: MLSConnectorKind,
  sourceSystem: string,
  complete = false
): MLSSyncResult {
  const finishedAt = new Date().toISOString();
  logSyncInfo("Cleanup batch finished", {
    complete,
    fetched: stats.fetched,
    filtered: stats.filtered,
    created: stats.created,
    updated: stats.updated,
    hidden: stats.archived,
    completedAt: finishedAt
  });
  return {
    mode: "cleanup",
    connector: connectorKind,
    sourceSystem,
    startedAt,
    finishedAt,
    stats,
    notes,
    complete
  };
}

function incrementHiddenReasonCounts(
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

export async function runStaleCleanup(connectorKind?: MLSConnectorKind, options?: { maxPagesPerRun?: number; reconciliationOnly?: boolean }): Promise<MLSSyncResult> {
  await ensureServerSecretsLoaded();
  return withSyncLease(() => runStaleCleanupInternal(connectorKind, options));
}
