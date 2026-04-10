import { DEFAULT_SYNC_SETTINGS } from "@/lib/firebase-sync/settings";
import type { FirestoreSyncRepository } from "@/lib/firebase-sync/firestore/repository";
import type {
  ContactMessageDocument,
  FeedSyncSettingsDocument,
  LeadSubmissionDocument,
  ListingFirestoreDocument,
  ListingSnapshotDocument,
  SyncJobDocument
} from "@/types/firebase-sync";

export class InMemoryFirestoreSyncRepository implements FirestoreSyncRepository {
  private readonly listings = new Map<string, ListingFirestoreDocument>();
  private readonly listingsBySourceKey = new Map<string, string>();
  private readonly snapshots: ListingSnapshotDocument[] = [];
  private readonly syncJobs = new Map<string, SyncJobDocument>();
  private readonly leads: LeadSubmissionDocument[] = [];
  private readonly contacts: ContactMessageDocument[] = [];
  private settings: FeedSyncSettingsDocument = DEFAULT_SYNC_SETTINGS;

  async getListingBySourceKey(sourceListingKey: string): Promise<ListingFirestoreDocument | null> {
    const listingId = this.listingsBySourceKey.get(sourceListingKey);
    if (!listingId) return null;
    return this.listings.get(listingId) ?? null;
  }

  async upsertListing(listing: ListingFirestoreDocument): Promise<void> {
    this.listings.set(listing.listingId, listing);
    this.listingsBySourceKey.set(listing.sourceListingKey, listing.listingId);
  }

  async bulkUpsertListings(listings: ListingFirestoreDocument[]): Promise<void> {
    listings.forEach((listing) => {
      this.listings.set(listing.listingId, listing);
      this.listingsBySourceKey.set(listing.sourceListingKey, listing.listingId);
    });
  }

  async writeListingSnapshot(snapshot: ListingSnapshotDocument): Promise<void> {
    this.snapshots.push(snapshot);
  }

  async hideListing(listingId: string, hiddenReason: ListingFirestoreDocument["hiddenReason"], nowIso: string): Promise<void> {
    const existing = this.listings.get(listingId);
    if (!existing) return;
    this.listings.set(listingId, {
      ...existing,
      isVisible: false,
      hiddenReason,
      updatedAt: nowIso
    });
  }

  async listStaleListings(lastSeenBeforeIso: string): Promise<ListingFirestoreDocument[]> {
    return Array.from(this.listings.values()).filter((listing) => listing.lastSeenInSourceAt < lastSeenBeforeIso);
  }

  async listAllSourceKeys(): Promise<string[]> {
    return Array.from(this.listingsBySourceKey.keys());
  }

  async createSyncJob(job: SyncJobDocument): Promise<void> {
    this.syncJobs.set(job.id, job);
  }

  async updateSyncJob(jobId: string, patch: Partial<SyncJobDocument>): Promise<void> {
    const existing = this.syncJobs.get(jobId);
    if (!existing) return;
    this.syncJobs.set(jobId, { ...existing, ...patch });
  }

  async getSyncSettings(): Promise<FeedSyncSettingsDocument> {
    return this.settings;
  }

  async saveLead(lead: LeadSubmissionDocument): Promise<void> {
    this.leads.push(lead);
  }

  async saveContactMessage(contactMessage: ContactMessageDocument): Promise<void> {
    this.contacts.push(contactMessage);
  }

  async queryPublicListings(filters?: {
    municipality?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    limit?: number;
  }): Promise<ListingFirestoreDocument[]> {
    let listings = Array.from(this.listings.values()).filter((listing) => listing.isVisible);

    if (filters?.municipality) listings = listings.filter((listing) => listing.municipality === filters.municipality);
    if (filters?.minPrice != null) {
      const minPrice = filters.minPrice;
      listings = listings.filter((listing) => (listing.price ?? 0) >= minPrice);
    }
    if (filters?.maxPrice != null) {
      const maxPrice = filters.maxPrice;
      listings = listings.filter((listing) => (listing.price ?? Number.MAX_SAFE_INTEGER) <= maxPrice);
    }
    if (filters?.bedrooms != null) {
      const bedrooms = filters.bedrooms;
      listings = listings.filter((listing) => (listing.bedrooms ?? 0) >= bedrooms);
    }
    if (filters?.bathrooms != null) {
      const bathrooms = filters.bathrooms;
      listings = listings.filter((listing) => (listing.bathrooms ?? 0) >= bathrooms);
    }

    listings.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));

    return filters?.limit ? listings.slice(0, filters.limit) : listings;
  }

  async getPublicListingBySlug(slug: string): Promise<ListingFirestoreDocument | null> {
    return Array.from(this.listings.values()).find((listing) => listing.slug === slug && listing.isVisible) ?? null;
  }
}
