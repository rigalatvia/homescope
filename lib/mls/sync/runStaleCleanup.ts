import { mlsSyncConfig } from "@/lib/mls/config";
import { filterRawListingsByTargetPostalAreas } from "@/lib/mls/filter/targetPostalAreas";
import { normalizeListing } from "@/lib/mls/normalize/normalizeListing";
import { cleanupMisclassifiedKingstonListings } from "@/lib/mls/sync/cleanupMisclassifiedKingstonListings";
import {
  getCleanupNextCursor,
  getCleanupStartPage,
  getCleanupSweepStartedAt,
  getDefaultCleanupStartPage,
  setCleanupNextCursor,
  setCleanupStartPage,
  setCleanupSweepStartedAt
} from "@/lib/mls/sync/cleanupCursor";
import { createMLSConnector } from "@/lib/mls/sync/createConnector";
import { deleteListingsNotSeenSinceForSource, deleteStoredHiddenAndNonActiveListings } from "@/lib/mls/sync/staleCleanup";
import { clearMLSSyncStop, isMLSSyncStopRequested } from "@/lib/mls/sync/stopSignal";
import { deleteExistingListingDocuments } from "@/lib/mls/upsert/repository";
import { upsertNormalizedListings } from "@/lib/mls/upsert/upsertListings";
import { logSyncError, logSyncInfo } from "@/lib/mls/utils/logger";
import type { MLSConnectorKind, MLSHiddenReason, MLSSyncResult, MLSSyncStats, NormalizedMLSListing } from "@/lib/mls/types";

export async function runStaleCleanup(connectorKind?: MLSConnectorKind): Promise<MLSSyncResult> {
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

    const cleanupRemoved = await cleanupMisclassifiedKingstonListings();
    if (cleanupRemoved > 0) {
      stats.archived += cleanupRemoved;
      stats.hidden += cleanupRemoved;
      stats.hiddenByReason.connector_not_returned = cleanupRemoved;
      notes.push(`cleanup removed ${cleanupRemoved} misclassified King-area listing(s).`);
    }

    const preCleanup = await deleteStoredHiddenAndNonActiveListings();
    if (preCleanup.deleted > 0) {
      stats.archived += preCleanup.deleted;
      stats.hidden += preCleanup.deleted;
      stats.hiddenByReason.status_not_displayable =
        (stats.hiddenByReason.status_not_displayable || 0) + preCleanup.deleted;
      notes.push(`cleanup deleted ${preCleanup.deleted} listing(s) already stored as hidden or non-active.`);
    }

    if (!connector.fetchActiveListingsPage) {
      notes.push("cleanup connector does not support active-feed reconciliation.");
      return buildCleanupResult(startedAt, stats, notes, connector.connectorName as MLSConnectorKind, connector.sourceSystem);
    }

    let startPage = await getCleanupStartPage();
    let nextCursor = await getCleanupNextCursor();
    let sweepStartedAt = await getCleanupSweepStartedAt();

    if (startPage > getDefaultCleanupStartPage() && !nextCursor) {
      startPage = getDefaultCleanupStartPage();
      sweepStartedAt = startedAt;
      await setCleanupStartPage(startPage);
      await setCleanupNextCursor(null);
      await setCleanupSweepStartedAt(sweepStartedAt);
      notes.push(`Cleanup cursor was reset from an incomplete legacy state and restarted at page ${startPage}.`);
    } else if (startPage === getDefaultCleanupStartPage()) {
      nextCursor = null;
      sweepStartedAt = startedAt;
      await setCleanupNextCursor(null);
      await setCleanupSweepStartedAt(sweepStartedAt);
      notes.push(`Cleanup sweep started at ${sweepStartedAt}.`);
    } else if (!sweepStartedAt) {
      startPage = getDefaultCleanupStartPage();
      nextCursor = null;
      sweepStartedAt = startedAt;
      await setCleanupStartPage(startPage);
      await setCleanupNextCursor(null);
      await setCleanupSweepStartedAt(sweepStartedAt);
      notes.push(`Cleanup resumed without a sweep marker, so it restarted safely at page ${startPage}.`);
    }

    let page = startPage;
    let reachedEnd = false;
    const maxPages = Math.max(1, mlsSyncConfig.cleanupMaxPagesPerRun);
    const stopPage = startPage + maxPages - 1;

    while (page <= stopPage) {
      if (await isMLSSyncStopRequested()) {
        await setCleanupStartPage(page);
        await setCleanupNextCursor(nextCursor);
        await clearMLSSyncStop();
        notes.push(`Cleanup stop requested. Paused before page ${page}. Continue from page ${page} on next run.`);
        return buildCleanupResult(startedAt, stats, notes, connector.connectorName as MLSConnectorKind, connector.sourceSystem);
      }

      const activePage = await connector.fetchActiveListingsPage({
        page,
        pageSize: mlsSyncConfig.pageSize,
        cursor: nextCursor
      });

      if (activePage.items.length === 0) {
        reachedEnd = true;
        break;
      }

      stats.fetched += activePage.items.length;
      logSyncInfo("Cleanup fetched current active page", { page, count: activePage.items.length });

      const filteredRaw = filterRawListingsByTargetPostalAreas(activePage.items);
      stats.filtered += filteredRaw.included.length;

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
          notes.push(`cleanup deleted ${deleted} non-displayable listing(s) from active-feed page ${page}.`);
        }
      }

      if (!activePage.nextCursor || activePage.items.length < mlsSyncConfig.pageSize) {
        reachedEnd = true;
        break;
      }

      nextCursor = activePage.nextCursor;
      page += 1;
    }

    if (reachedEnd) {
      if (stats.fetched === 0) {
        notes.push(
          "Cleanup reached end of the active feed without fetching any rows, so stale deletion was skipped as a safety precaution."
        );
      } else if (sweepStartedAt) {
        const deletedNotSeen = await deleteListingsNotSeenSinceForSource(sweepStartedAt, connector.sourceSystem);
        if (deletedNotSeen > 0) {
          stats.archived += deletedNotSeen;
          stats.hidden += deletedNotSeen;
          stats.hiddenByReason.connector_not_returned =
            (stats.hiddenByReason.connector_not_returned || 0) + deletedNotSeen;
          notes.push(`cleanup deleted ${deletedNotSeen} listing(s) not present in the current active feed.`);
        }
      }

      await setCleanupStartPage(getDefaultCleanupStartPage());
      await setCleanupNextCursor(null);
      await setCleanupSweepStartedAt(null);
      notes.push("Cleanup reached end of current active feed. Cursor reset to page 1.");
    } else {
      await setCleanupStartPage(page);
      await setCleanupNextCursor(nextCursor);
      notes.push(
        `Cleanup processed a batch (${maxPages} page${maxPages === 1 ? "" : "s"}) from page ${startPage}. Continue from page ${page} on next run.`
      );
    }

    return buildCleanupResult(
      startedAt,
      stats,
      notes,
      connector.connectorName as MLSConnectorKind,
      connector.sourceSystem
    );
  } catch (error) {
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
  sourceSystem: string
): MLSSyncResult {
  const finishedAt = new Date().toISOString();
  logSyncInfo("Cleanup completed", {
    fetched: stats.fetched,
    filtered: stats.filtered,
    created: stats.created,
    updated: stats.updated,
    deleted: stats.archived,
    completedAt: finishedAt
  });
  return {
    mode: "cleanup",
    connector: connectorKind,
    sourceSystem,
    startedAt,
    finishedAt,
    stats,
    notes
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
