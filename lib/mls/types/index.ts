export type MLSConnectorKind = "mock" | "approved-placeholder" | "ddf-treb";

export type MLSPropertyClass =
  | "Residential Freehold"
  | "Residential Freehold Lease"
  | "Residential Condo & Other"
  | "Residential Condo & Other Lease";

export type MLSMunicipality = "Aurora" | "Newmarket" | "Richmond Hill" | "Vaughan" | "King" | "Toronto";

export type MLSListingStatus = "active" | "sold" | "leased" | "suspended" | "expired" | "terminated" | "draft";

export type MLSHiddenReason =
  | "perm_to_advertise_false"
  | "unsupported_property_class"
  | "unsupported_municipality"
  | "outside_target_fsa"
  | "status_not_displayable"
  | "missing_required_public_fields"
  | "stale_listing"
  | "connector_not_returned";

export type MLSSyncMode = "full" | "incremental" | "cleanup";

export interface MLSConnectorConfig {
  kind: MLSConnectorKind;
  sourceSystem: string;
  baseUrl?: string;
  apiKey?: string;
  username?: string;
  password?: string;
  pageSize: number;
}

export interface MLSListingMedia {
  url: string;
  type: "photo" | "virtual-tour" | "floorplan" | "other";
  caption?: string | null;
  sortOrder?: number | null;
}

export interface RawMLSFeedListing {
  sourceSystem: string;
  sourceListingKey: string;
  mlsNumber?: string | null;
  listAgentNationalAssociationId?: string | null;
  propertyClass?: string | null;
  transactionType?: string | null;
  permToAdvertise?: "Yes" | "No" | boolean | null;
  permissionSignals?: {
    permToAdvertise?: string | boolean | null;
    permToAdvertiseYN?: string | boolean | null;
    permitToAdvertise?: string | boolean | null;
    internetEntireListingDisplayYN?: string | boolean | null;
    internetAddressDisplayYN?: string | boolean | null;
  } | null;
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
  leaseAmount?: number | string | null;
  leaseAmountFrequency?: string | null;
  leasePerUnit?: string | null;
  existingLeaseType?: string | null;
  bedrooms?: number | string | null;
  bathrooms?: number | string | null;
  propertyType?: string | null;
  style?: string | null;
  publicRemarks?: string | null;
  images?: MLSListingMedia[] | null;
  coordinates?: {
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  brokerageName?: string | null;
  status?: string | null;
  sourceUpdatedAt?: string | null;
}

export interface NormalizedMLSListing {
  listingId: string;
  mlsNumber: string | null;
  listAgentNationalAssociationId: string | null;
  sourceSystem: string;
  sourceListingKey: string;
  propertyClass: MLSPropertyClass | null;
  transactionType: string | null;
  permToAdvertise: boolean;
  municipality: MLSMunicipality | null;
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
  status: MLSListingStatus;
  sourceUpdatedAt: string | null;
  syncedAt: string;
  isVisible: boolean;
  hiddenReason: MLSHiddenReason | null;
  slug: string;
  badges: string[];
  rawSourceHash: string;
}

export interface MLSListingFirestoreDocument extends NormalizedMLSListing {
  createdAt: string;
  updatedAt: string;
  lastSeenInSourceAt: string;
}

export interface MLSListingSnapshotDocument {
  snapshotId: string;
  listingId: string;
  sourceListingKey: string;
  capturedAt: string;
  changedFields: string[];
  before: Partial<MLSListingFirestoreDocument> | null;
  after: Partial<MLSListingFirestoreDocument>;
  reason: "created" | "updated" | "hidden" | "price_changed" | "status_changed" | "remarks_changed";
}

export interface MLSConnectorHealth {
  ok: boolean;
  connector: MLSConnectorKind;
  message: string;
  checkedAt: string;
}

export interface MLSFetchOptions {
  since?: Date;
  page?: number;
  pageSize?: number;
}

export interface MLSSyncStats {
  fetched: number;
  filtered: number;
  normalized: number;
  included: number;
  excluded: number;
  excludedPermToAdvertiseFalse: number;
  hiddenByReason: Partial<Record<MLSHiddenReason, number>>;
  created: number;
  updated: number;
  archived: number;
  upserted: number;
  hidden: number;
  unchanged: number;
  snapshotsWritten: number;
  failed: number;
}

export interface MLSSyncResult {
  mode: MLSSyncMode;
  startedAt: string;
  finishedAt: string;
  stats: MLSSyncStats;
  connector: MLSConnectorKind;
  sourceSystem: string;
  notes?: string[];
}
