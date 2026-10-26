import { saveFullSyncCursor } from "@/lib/mls/sync/fullSyncCursor";
import { recordReconciliationPage, reconcileMissing, hasReconciliationManifest, IncompleteReconciliationError } from "@/lib/mls/sync/reconciliation";
import { withSyncLease, recordRetrieved, recordFiltered, remainingSyncTime } from "@/lib/mls/sync/execution";
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
import {
  getDefaultFullSyncStartPage,
  getFullSyncNextCursor,
  getFullSyncStartPage,
  getFullSyncSweepStartedAt,
} from "@/lib/mls/sync/fullSyncCursor";
import { clearMLSSyncStop, isMLSSyncStopRequested } from "@/lib/mls/sync/stopSignal";
import { upsertNormalizedListings } from "@/lib/mls/upsert/upsertListings";
import { logSyncError, logSyncInfo } from "@/lib/mls/utils/logger";
import { ensureServerSecretsLoaded } from "@/lib/server/secret-manager";

async function runFullSyncInternal(connectorKind?: MLSConnectorKind): Promise<MLSSyncResult> {
  await ensureServerSecretsLoaded();

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
  const exclusionAuditRows: string[] = [];

  logSyncInfo("Full sync started", {
    connector: connector.connectorName,
    sourceSystem: connector.sourceSystem
  });

  try {
    const savedStartPage = await getFullSyncStartPage();
    let nextCursor = await getFullSyncNextCursor();
    let sweepStartedAt = await getFullSyncSweepStartedAt();
    let startPage = savedStartPage;
    if (startPage > 1 && !await hasReconciliationManifest("full", connector.sourceSystem, sweepStartedAt)) {
      startPage = 1; nextCursor = null; sweepStartedAt = null;
      await saveFullSyncCursor({ nextPage: 1, nextCursor: null, sweepStartedAt: null });
    }

    if (startPage > getDefaultFullSyncStartPage() && !nextCursor && connector.fetchAllListingsPage) {
      startPage = getDefaultFullSyncStartPage();
      nextCursor = null;
      sweepStartedAt = startedAt;
      await saveFullSyncCursor({ nextPage: startPage, nextCursor: null, sweepStartedAt });
      notes.push(
        `Full sync cursor was upgraded from legacy page-only pagination and restarted at page ${startPage}.`
      );
    } else if (startPage === getDefaultFullSyncStartPage()) {
      nextCursor = null;
      sweepStartedAt = startedAt;
      await saveFullSyncCursor({ nextPage: 1, nextCursor: null, sweepStartedAt });
      notes.push(`Full sync sweep started at ${sweepStartedAt}.`);
    } else if (!sweepStartedAt) {
      notes.push(
        "Full sync resumed without a sweep marker. End-of-feed stale hiding will be skipped for this cycle as a safety precaution."
      );
    }
    let page = startPage;
    let reachedEnd = false;
    const unlimited = mlsSyncConfig.fullSyncMaxPagesPerRun <= 0;
    const maxPages = unlimited ? Number.POSITIVE_INFINITY : Math.max(1, mlsSyncConfig.fullSyncMaxPagesPerRun);
    const stopPage = unlimited ? Number.POSITIVE_INFINITY : startPage + maxPages - 1;

    logSyncInfo("Full sync cursor state", {
      startPage,
      stopPage: Number.isFinite(stopPage) ? stopPage : "unlimited",
      maxPagesPerRun: Number.isFinite(maxPages) ? maxPages : "unlimited"
    });

    while (page <= stopPage) {
      if (remainingSyncTime() < 5000) {
        notes.push("Runtime budget reached; saved cursor will resume on retry.");
        break;
      }
      if (await isMLSSyncStopRequested()) {
        await saveFullSyncCursor({ nextPage: page, nextCursor, sweepStartedAt });
        await clearMLSSyncStop();
        notes.push(`Full sync stop requested. Paused before page ${page}. Continue from page ${page} on next run.`);
        logSyncInfo("Full sync stop requested", { nextPage: page });
        break;
      }

      let rawPage: RawMLSFeedListing[] = [];
      let nextCursorFromFeed: string | null = null;
      if (connector.fetchAllListingsPage) {
        const rawPageResponse = await connector.fetchAllListingsPage({
          page,
          pageSize: mlsSyncConfig.pageSize,
          cursor: nextCursor
        });
        nextCursorFromFeed = rawPageResponse.nextCursor;
        rawPage = rawPageResponse.items;
      } else {
        rawPage = await connector.fetchAllListings({
          page,
          pageSize: mlsSyncConfig.pageSize,
          cursor: nextCursor
        });
      }

      if (rawPage.length === 0 && !nextCursorFromFeed) {
        if (sweepStartedAt) await recordReconciliationPage("full", connector.sourceSystem, sweepStartedAt, page, [], 0);
        reachedEnd = true;
        break;
      }

      stats.fetched += rawPage.length;
      recordRetrieved(rawPage.length);
      logSyncInfo("Full sync fetched page", { page, count: rawPage.length });

      const filteredRaw = filterRawListingsByTargetPostalAreas(rawPage);
      stats.filtered += filteredRaw.included.length;
      recordFiltered(filteredRaw.included.length);
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
      collectExclusionAuditRows(filteredRaw.included, normalized, exclusionAuditRows, 50);
      stats.normalized += normalized.length;
      const includedCount = normalized.filter((l) => l.isVisible).length;
      stats.included += includedCount;
      stats.excluded += normalized.length - includedCount;
      incrementHiddenReasonCounts(stats.hiddenByReason, buildHiddenReasonCounts(normalized));
      stats.excludedPermToAdvertiseFalse += normalized.filter(
        (listing) => listing.hiddenReason === "perm_to_advertise_false"
      ).length;

      const visibleListings = normalized.filter((listing) => listing.isVisible);

      const upsert = await upsertNormalizedListings(normalized, nowIso);
      stats.created += upsert.created;
      stats.updated += upsert.updated;
      stats.upserted += upsert.upserted;
      stats.unchanged += upsert.unchanged;
      stats.snapshotsWritten += upsert.snapshotsWritten;
      if (sweepStartedAt) await recordReconciliationPage("full", connector.sourceSystem, sweepStartedAt, page, visibleListings.map(listing => listing.listingId), rawPage.length);

      stats.hidden += upsert.hidden;
      stats.archived += upsert.hidden;

      if (connector.fetchAllListingsPage) {
        if (!nextCursorFromFeed) {
          reachedEnd = true;
          break;
        }

        page += 1;
        nextCursor = nextCursorFromFeed;
        await saveFullSyncCursor({ nextPage: page, nextCursor, sweepStartedAt });
      } else {
        if (rawPage.length < mlsSyncConfig.pageSize) {
          reachedEnd = true;
          break;
        }

        page += 1;
      }
    }

    const stopRequested = notes.some((note) => note.includes("stop requested"));

    if (reachedEnd) {
      if (sweepStartedAt) {
        const notReturnedDeleted = await reconcileMissing("full", connector.sourceSystem, sweepStartedAt, page);
        if (notReturnedDeleted > 0) {
          stats.archived += notReturnedDeleted;
          stats.hidden += notReturnedDeleted;
          stats.hiddenByReason.connector_not_returned =
            (stats.hiddenByReason.connector_not_returned || 0) + notReturnedDeleted;
          notes.push(`Full sync hidden ${notReturnedDeleted} listing(s) not returned by the feed.`);
        }
      }
      await saveFullSyncCursor({ nextPage: getDefaultFullSyncStartPage(), nextCursor: null, sweepStartedAt: null });
      notes.push("Full sync reached end of feed. Cursor reset to page 1.");
    } else if (!stopRequested) {
      await saveFullSyncCursor({ nextPage: page, nextCursor, sweepStartedAt });
      const pageLabel = Number.isFinite(maxPages) ? String(maxPages) : "unlimited";
      const note = `Full sync processed a batch (${pageLabel} pages) from page ${startPage}. Continue from page ${page} on next run.`;
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
    notes.push(...buildExclusionAuditNotesForRun(exclusionAuditRows));

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
      complete: reachedEnd,
      notes
    };
  } catch (error) {
    if (error instanceof IncompleteReconciliationError) {
      await saveFullSyncCursor({ nextPage: 1, nextCursor: null, sweepStartedAt: null });
    }
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

function buildExclusionAuditNotesForRun(rows: string[]): string[] {
  if (rows.length === 0) {
    return ["exclusionAudit no excluded rows captured in this batch"];
  }

  const lines = rows.slice(0, 20).map((row, idx) => `exclusionAudit[${idx + 1}] ${row}`);
  if (rows.length > 20) {
    lines.push(`exclusionAudit more=${rows.length - 20}`);
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

function collectExclusionAuditRows(
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
    if (normalized.isVisible === true || !normalized.hiddenReason) continue;

    target.push(
      [
        `mls=${normalized.mlsNumber || raw.mlsNumber || "unknown"}`,
        `listingId=${normalized.listingId}`,
        `municipality=${normalized.municipality || raw.municipality || "null"}`,
        `propertyClass=${normalized.propertyClass || raw.propertyClass || "null"}`,
        `propertyType=${normalized.propertyType || raw.propertyType || "null"}`,
        `status=${normalized.status}`,
        `rawStatus=${raw.status || "null"}`,
        `hiddenReason=${normalized.hiddenReason}`,
        `address=${normalized.address.fullAddress || raw.address?.fullAddress || "null"}`
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

export async function runFullSync(connectorKind?: MLSConnectorKind): Promise<MLSSyncResult> {
  await ensureServerSecretsLoaded();
  return withSyncLease(() => runFullSyncInternal(connectorKind));
}
