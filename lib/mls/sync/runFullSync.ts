import type {
  MLSConnectorKind,
  MLSHiddenReason,
  MLSSyncResult,
  MLSSyncStats,
  NormalizedMLSListing,
  RawMLSFeedListing
} from "@/lib/mls/types";
import { mlsSyncConfig } from "@/lib/mls/config";
import { filterRawListingsByTargetPostalAreas } from "@/lib/mls/filter/targetPostalAreas";
import { normalizeListing } from "@/lib/mls/normalize/normalizeListing";
import { createMLSConnector } from "@/lib/mls/sync/createConnector";
import { getDefaultFullSyncStartPage, getFullSyncStartPage, setFullSyncStartPage } from "@/lib/mls/sync/fullSyncCursor";
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
  const rawPropertyClassCounts = new Map<string, number>();
  const rawPropertyClassMissing = { count: 0 };
  const rawPermToAdvertiseCounts = new Map<string, number>();
  const mappedPropertyClassCounts = new Map<string, number>();
  const permissionAuditRows: string[] = [];

  logSyncInfo("Full sync started", {
    connector: connector.connectorName,
    sourceSystem: connector.sourceSystem
  });

  try {
    const seenListingIds = new Set<string>();
    const startPage = await getFullSyncStartPage();
    let page = startPage;
    let reachedEnd = false;
    const maxPages = Math.max(1, mlsSyncConfig.fullSyncMaxPagesPerRun);
    const stopPage = startPage + maxPages - 1;

    logSyncInfo("Full sync cursor state", { startPage, stopPage, maxPagesPerRun: maxPages });

    while (page <= stopPage) {
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
      collectRawPropertyClassStats(filteredRaw.included, rawPropertyClassCounts, rawPropertyClassMissing);
      collectRawPermToAdvertiseStats(filteredRaw.included, rawPermToAdvertiseCounts);
      collectMappedPropertyClassStats(normalized, mappedPropertyClassCounts);
      collectPermissionAuditRows(filteredRaw.included, normalized, permissionAuditRows, 25);
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
      await setFullSyncStartPage(getDefaultFullSyncStartPage());
      notes.push("Full sync reached end of feed. Cursor reset to page 1.");
    } else {
      await setFullSyncStartPage(page);
      const note = `Full sync processed a batch (${maxPages} pages) from page ${startPage}. Continue from page ${page} on next run.`;
      notes.push(note);
      logSyncInfo("Full sync partial run", {
        startPage,
        nextPage: page,
        maxPagesPerRun: maxPages,
        staleHideSkipped: true
      });
    }
    const rawClassTop = formatTopCounts(rawPropertyClassCounts, 12);
    const rawPermTop = formatTopCounts(rawPermToAdvertiseCounts, 8);
    const mappedClassTop = formatTopCounts(mappedPropertyClassCounts, 8);
    notes.push(
      `rawPropertyClassSummary missing=${rawPropertyClassMissing.count} top=${rawClassTop || "none"}`
    );
    notes.push(`rawPermToAdvertiseSummary top=${rawPermTop || "none"}`);
    notes.push(`mappedPropertyClassSummary top=${mappedClassTop || "none"}`);
    notes.push(...buildPermissionAuditNotesForRun(permissionAuditRows));

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

function buildPermissionAuditNotesForRun(rows: string[]): string[] {
  if (rows.length === 0) {
    return ["permissionAudit no rows captured in this batch"];
  }

  const lines = rows.slice(0, 12).map((row, idx) => `permissionAudit[${idx + 1}] ${row}`);
  if (rows.length > 12) {
    lines.push(`permissionAudit more=${rows.length - 12}`);
  }
  return lines;
}

function collectRawPropertyClassStats(
  rawListings: Array<{ propertyClass?: string | null }>,
  counts: Map<string, number>,
  missing: { count: number }
): void {
  for (const raw of rawListings) {
    const value = normalizeRawClassValue(raw.propertyClass);
    if (!value) {
      missing.count += 1;
      continue;
    }
    counts.set(value, (counts.get(value) || 0) + 1);
  }
}

function collectMappedPropertyClassStats(
  normalized: NormalizedMLSListing[],
  counts: Map<string, number>
): void {
  for (const listing of normalized) {
    const value = listing.propertyClass || "null";
    counts.set(value, (counts.get(value) || 0) + 1);
  }
}

function collectRawPermToAdvertiseStats(
  rawListings: Array<{ permToAdvertise?: "Yes" | "No" | boolean | null }>,
  counts: Map<string, number>
): void {
  for (const raw of rawListings) {
    const value = raw.permToAdvertise;
    const key =
      value === true || value === "Yes"
        ? "true_or_yes"
        : value === false || value === "No"
          ? "false_or_no"
          : "missing";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
}

function collectPermissionAuditRows(
  rawListings: RawMLSFeedListing[],
  normalizedListings: NormalizedMLSListing[],
  target: string[],
  maxRows: number
): void {
  if (target.length >= maxRows) return;

  for (let i = 0; i < rawListings.length; i += 1) {
    if (target.length >= maxRows) break;
    const raw = rawListings[i];
    const normalized = normalizedListings[i];
    if (!raw || !normalized) continue;

    if (normalized.hiddenReason !== "perm_to_advertise_false" && normalized.isVisible !== true) {
      continue;
    }

    target.push(
      [
        `mls=${normalized.mlsNumber || raw.mlsNumber || "unknown"}`,
        `rawPerm=${stringifyPermissionValue(raw.permToAdvertise)}`,
        `rawPermToAdvertise=${stringifyPermissionValue(raw.permissionSignals?.permToAdvertise)}`,
        `rawPermToAdvertiseYN=${stringifyPermissionValue(raw.permissionSignals?.permToAdvertiseYN)}`,
        `rawPermitToAdvertise=${stringifyPermissionValue(raw.permissionSignals?.permitToAdvertise)}`,
        `rawInternetEntire=${stringifyPermissionValue(raw.permissionSignals?.internetEntireListingDisplayYN)}`,
        `rawInternetAddress=${stringifyPermissionValue(raw.permissionSignals?.internetAddressDisplayYN)}`,
        `normalizedPerm=${normalized.permToAdvertise}`,
        `isVisible=${normalized.isVisible}`,
        `hiddenReason=${normalized.hiddenReason || "none"}`
      ].join(" | ")
    );
  }
}

function stringifyPermissionValue(value: string | boolean | null | undefined): string {
  if (value == null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  const text = String(value).trim();
  return text.length > 0 ? text : "empty";
}

function normalizeRawClassValue(value?: string | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed;
}

function formatTopCounts(counts: Map<string, number>, limit: number): string {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, value]) => `${key}:${value}`)
    .join(", ");
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
