export type FeedSourceSystem = "approved-mls-ddf";

export type PropertyClass =
  | "Residential Freehold"
  | "Residential Freehold Lease"
  | "Residential Condo & Other"
  | "Residential Condo & Other Lease";

export type AllowedMunicipality = "Aurora" | "Newmarket" | "Richmond Hill" | "Vaughan" | "Toronto";

export type ListingStatus = "active" | "sold" | "leased" | "suspended" | "expired" | "terminated" | "draft";

export type SyncMode = "full" | "incremental" | "cleanup";

export type HiddenReason =
  | "perm_to_advertise_false"
  | "unsupported_property_class"
  | "unsupported_municipality"
  | "status_not_displayable"
  | "missing_required_public_fields"
  | "stale_listing"
  | "connector_not_returned";

export interface RawFeedListingPayload {
  sourceSystem: FeedSourceSystem;
  sourceListingKey: string;
  mlsNumber?: string | null;
  propertyClass?: string | null;
  transactionType?: string | null;
  permToAdvertise?: "Yes" | "No" | boolean | null;
  municipality?: string | null;
  area?: string | null;
  address?: {
    streetNumber?: string | null;
    streetName?: string | null;
    unit?: string | null;
    fullAddress?: string | null;
    postalCode?: string | null;
  } | null;
  listPrice?: number | string | null;
  bedrooms?: number | string | null;
  bathrooms?: number | string | null;
  propertyType?: string | null;
  style?: string | null;
  publicRemarks?: string | null;
  media?: Array<{
    url?: string | null;
    type?: string | null;
    caption?: string | null;
    sortOrder?: number | null;
  }> | null;
  coordinates?: {
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  brokerageName?: string | null;
  status?: string | null;
  sourceUpdatedAt?: string | null;
  createdAt?: string | null;
  additionalFields?: Record<string, unknown>;
}

export interface NormalizedListing {
  listingId: string;
  mlsNumber: string | null;
  sourceSystem: FeedSourceSystem;
  sourceListingKey: string;
  propertyClass: PropertyClass | null;
  transactionType: string | null;
  permToAdvertise: boolean;
  municipality: AllowedMunicipality | null;
  area: string | null;
  address: {
    streetNumber: string | null;
    streetName: string | null;
    unit: string | null;
    fullAddress: string | null;
    postalCode: string | null;
  };
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  propertyType: string | null;
  style: string | null;
  publicRemarks: string | null;
  images: string[];
  coordinates: {
    latitude: number | null;
    longitude: number | null;
  };
  brokerageName: string | null;
  status: ListingStatus;
  sourceUpdatedAt: string | null;
  syncedAt: string;
  isVisible: boolean;
  hiddenReason: HiddenReason | null;
  slug: string;
  badges: string[];
  rawSourceHash: string;
}

export interface ListingFirestoreDocument extends NormalizedListing {
  createdAt: string;
  updatedAt: string;
  lastSeenInSourceAt: string;
}

export interface ListingSnapshotDocument {
  snapshotId: string;
  listingId: string;
  sourceListingKey: string;
  capturedAt: string;
  changedFields: string[];
  before: Partial<ListingFirestoreDocument> | null;
  after: Partial<ListingFirestoreDocument>;
  reason: "created" | "updated" | "hidden" | "status_changed" | "price_changed" | "remarks_changed";
}

export interface LeadSubmissionDocument {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  preferredDateTime: string;
  message: string;
  listingId: string;
  listingSlug: string;
  municipality: string | null;
  intent: "showing_request";
  createdAt: string;
  source: "website";
}

export interface ContactMessageDocument {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  createdAt: string;
  source: "website";
}

export interface SyncJobDocument {
  id: string;
  mode: SyncMode;
  status: "running" | "completed" | "failed";
  startedAt: string;
  finishedAt: string | null;
  sourceSystem: FeedSourceSystem;
  stats: {
    received: number;
    normalized: number;
    upserted: number;
    hidden: number;
    snapshotsWritten: number;
    unchanged: number;
    failed: number;
  };
  errorSummary: string | null;
  metadata?: Record<string, unknown>;
}

export interface FeedSyncSettingsDocument {
  id: "feedSync";
  sourceSystem: FeedSourceSystem;
  allowedMunicipalities: AllowedMunicipality[];
  allowedPropertyClasses: PropertyClass[];
  displayableStatuses: ListingStatus[];
  syncIntervalsMinutes: {
    full: number;
    incremental: number;
    cleanup: number;
  };
  staleListingThresholdHours: number;
  featureFlags: {
    snapshotsEnabled: boolean;
    staleCleanupEnabled: boolean;
    mediaSyncEnabled: boolean;
    strictPublicFieldValidation: boolean;
  };
  updatedAt: string;
}

export interface SyncContext {
  nowIso: string;
  mode: SyncMode;
  sourceSystem: FeedSourceSystem;
}
