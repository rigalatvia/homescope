import type { AllowedMunicipality, FeedSyncSettingsDocument, ListingStatus, PropertyClass } from "@/types/firebase-sync";

export const ALLOWED_PROPERTY_CLASSES: PropertyClass[] = [
  "Residential Freehold",
  "Residential Freehold Lease",
  "Residential Condo & Other",
  "Residential Condo & Other Lease"
];

export const ALLOWED_MUNICIPALITIES: AllowedMunicipality[] = [
  "Aurora",
  "Newmarket",
  "Richmond Hill",
  "Vaughan",
  "Toronto"
];

export const DISPLAYABLE_STATUSES: ListingStatus[] = ["active"];

export const DEFAULT_SYNC_SETTINGS: FeedSyncSettingsDocument = {
  id: "feedSync",
  sourceSystem: "approved-mls-ddf",
  allowedMunicipalities: ALLOWED_MUNICIPALITIES,
  allowedPropertyClasses: ALLOWED_PROPERTY_CLASSES,
  displayableStatuses: DISPLAYABLE_STATUSES,
  syncIntervalsMinutes: {
    full: 1440,
    incremental: 15,
    cleanup: 60
  },
  staleListingThresholdHours: 48,
  featureFlags: {
    snapshotsEnabled: true,
    staleCleanupEnabled: true,
    mediaSyncEnabled: true,
    strictPublicFieldValidation: true
  },
  updatedAt: new Date().toISOString()
};
