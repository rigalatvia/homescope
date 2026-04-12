import type { MLSConnectorKind, MLSHiddenReason, MLSSyncResult, MLSSyncStats, NormalizedMLSListing } from "@/lib/mls/types";
import { mlsSyncConfig } from "@/lib/mls/config";
import { filterRawListingsByTargetPostalAreas } from "@/lib/mls/filter/targetPostalAreas";
import { normalizeListing } from "@/lib/mls/normalize/normalizeListing";
import { createMLSConnector } from "@/lib/mls/sync/createConnector";
import { hideNotReturnedListings } from "@/lib/mls/sync/staleCleanup";
import { deleteListingDocument } from "@/lib/mls/upsert/repository";
import { upsertNormalizedListings } from "@/lib/mls/upsert/upsertListings";
import { logSyncError, logSyncInfo } from "@/lib/mls/utils/logger";

export async function runFullSync(connectorKind?: MLSConnectorKind): Promise<MLSSyncResult> {
  const startedAt = new Date().toISOString();
  const connector = createMLSConnector(connectorKind);
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

  logSyncInfo("Full sync started", {
    connector: connector.connectorName,
    sourceSystem: connector.sourceSystem
  });

  try {
    const seenListingIds = new Set<string>();
    let page = 1;
    let reachedEnd = false;

    while (page <= mlsSyncConfig.fullSyncMaxPagesPerRun) {
      const rawPage = await connector.fetchAllListings({
        page,
        pageSize: mlsSyncConfig.pageSize
      });

      if (rawPage.length === 0) {
        reachedEnd = true;
        break;
      }

      stats.fetched += rawPage.length;
      logSyncInfo("Full sync fetched page", { page, count: rawPage.length });

      const filteredRaw = filterRawListingsByTargetPostalAreas(rawPage);
      stats.filtered += filteredRaw.included.length;
      if (filteredRaw.excludedCount > 0) {
        logSyncInfo("Full sync target-area filter applied", {
          page,
          kept: filteredRaw.included.length,
          excludedOutsideTargetAreas: filteredRaw.excludedCount
        });
      }

      const nowIso = new Date().toISOString();
      const normalized = filteredRaw.included.map((raw) => normalizeListing(raw, nowIso));
      stats.normalized += normalized.length;
      const includedCount = normalized.filter((l) => l.isVisible).length;
      stats.included += includedCount;
      stats.excluded += normalized.length - includedCount;
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

      for (const listing of normalized) {
        seenListingIds.add(listing.listingId);
      }

      if (hiddenListings.length > 0) {
        for (const listing of hiddenListings) {
          await deleteListingDocument(listing.listingId);
        }
      }

      if (rawPage.length < mlsSyncConfig.pageSize) {
        reachedEnd = true;
        break;
      }

      page += 1;
    }

    if (reachedEnd) {
      const nowIso = new Date().toISOString();
      stats.hidden = await hideNotReturnedListings(seenListingIds, nowIso);
      stats.archived = stats.hidden;
    } else {
      const note = `Full sync processed partial dataset (${mlsSyncConfig.fullSyncMaxPagesPerRun} pages). Stale-hide skipped.`;
      notes.push(note);
      logSyncInfo("Full sync partial run", {
        maxPagesPerRun: mlsSyncConfig.fullSyncMaxPagesPerRun,
        staleHideSkipped: true
      });
    }

    const finishedAt = new Date().toISOString();
    logSyncInfo("Full sync summary", {
      totalFetched: stats.fetched,
      totalFiltered: stats.filtered,
      totalWritten: stats.upserted,
      totalCreated: stats.created,
      totalUpdated: stats.updated,
      totalVisible: stats.included,
      totalHidden: stats.excluded + stats.archived,
      totalArchived: stats.archived,
      hiddenByReason: stats.hiddenByReason
    });
    logSyncInfo("Full sync completed", { stats });

    return {
      mode: "full",
      connector: connector.connectorName as MLSConnectorKind,
      sourceSystem: connector.sourceSystem,
      startedAt,
      finishedAt,
      stats,
      notes
    };
  } catch (error) {
    stats.failed += 1;
    logSyncError("Full sync failed", error, { stats });
    throw error;
  }
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
