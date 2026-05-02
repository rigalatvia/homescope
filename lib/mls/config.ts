import type { MLSConnectorKind, MLSMunicipality, MLSPropertyClass } from "@/lib/mls/types";

export const allowedPropertyClasses: MLSPropertyClass[] = [
  "Residential Freehold",
  "Residential Freehold Lease",
  "Residential Condo & Other",
  "Residential Condo & Other Lease"
];

export const allowedMunicipalities: MLSMunicipality[] = [
  "Aurora",
  "Newmarket",
  "Richmond Hill",
  "Vaughan",
  "King",
  "Toronto"
];

export const allowedDisplayStatuses = ["active"] as const;

export const mlsSyncConfig = {
  staleThresholdHours: Number(process.env.MLS_STALE_THRESHOLD_HOURS || 48),
  connectorKind: (process.env.MLS_CONNECTOR_KIND || "ddf-treb") as MLSConnectorKind,
  sourceSystem: process.env.MLS_SOURCE_SYSTEM || "toronto-board-ddf",
  // Use the largest practical page size so the full-feed sweep reaches end-of-feed
  // in fewer requests. The DDF connector caps this to 100 as well.
  pageSize: Math.min(Math.max(Number(process.env.MLS_PAGE_SIZE || process.env.DDF_PAGE_SIZE || 100), 1), 100),
  // Keep each run tightly bounded so a single admin/API request does not hit
  // platform timeouts when the upstream feed gets slow on deep pages.
  fullSyncMaxPagesPerRun: Math.max(Number(process.env.MLS_FULL_SYNC_MAX_PAGES_PER_RUN || 1), 1),
  featureFlags: {
    snapshotsEnabled: process.env.MLS_SNAPSHOTS_ENABLED !== "false",
    cleanupEnabled: process.env.MLS_CLEANUP_ENABLED !== "false",
    strictFieldValidation: process.env.MLS_STRICT_PUBLIC_FIELDS !== "false"
  }
};
