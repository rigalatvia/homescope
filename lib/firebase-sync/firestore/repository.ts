import type {
  ContactMessageDocument,
  FeedSyncSettingsDocument,
  LeadSubmissionDocument,
  ListingFirestoreDocument,
  ListingSnapshotDocument,
  SyncJobDocument
} from "@/types/firebase-sync";

export interface FirestoreSyncRepository {
  getListingBySourceKey(sourceListingKey: string): Promise<ListingFirestoreDocument | null>;
  upsertListing(listing: ListingFirestoreDocument): Promise<void>;
  bulkUpsertListings(listings: ListingFirestoreDocument[]): Promise<void>;
  writeListingSnapshot(snapshot: ListingSnapshotDocument): Promise<void>;
  hideListing(listingId: string, hiddenReason: ListingFirestoreDocument["hiddenReason"], nowIso: string): Promise<void>;
  listStaleListings(lastSeenBeforeIso: string): Promise<ListingFirestoreDocument[]>;
  listAllSourceKeys(): Promise<string[]>;
  createSyncJob(job: SyncJobDocument): Promise<void>;
  updateSyncJob(jobId: string, patch: Partial<SyncJobDocument>): Promise<void>;
  getSyncSettings(): Promise<FeedSyncSettingsDocument>;
  saveLead(lead: LeadSubmissionDocument): Promise<void>;
  saveContactMessage(contactMessage: ContactMessageDocument): Promise<void>;
  queryPublicListings(filters?: {
    municipality?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    limit?: number;
  }): Promise<ListingFirestoreDocument[]>;
  getPublicListingBySlug(slug: string): Promise<ListingFirestoreDocument | null>;
}
