import { ALLOWED_MUNICIPALITIES } from "@/lib/firebase-sync/settings";
import type { FirestoreSyncRepository } from "@/lib/firebase-sync/firestore/repository";
import type { ListingFirestoreDocument } from "@/types/firebase-sync";

export interface PublicListingsFilter {
  municipality?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  limit?: number;
}

export async function getPublicListings(
  repository: FirestoreSyncRepository,
  filters: PublicListingsFilter = {}
): Promise<ListingFirestoreDocument[]> {
  const listings = await repository.queryPublicListings(filters);
  return listings.filter((listing) => listing.isVisible && listing.municipality != null && ALLOWED_MUNICIPALITIES.includes(listing.municipality));
}

export async function getPublicListingBySlug(
  repository: FirestoreSyncRepository,
  slug: string
): Promise<ListingFirestoreDocument | null> {
  const listing = await repository.getPublicListingBySlug(slug);
  if (!listing) return null;
  if (!listing.isVisible) return null;
  if (!listing.municipality || !ALLOWED_MUNICIPALITIES.includes(listing.municipality)) return null;
  return listing;
}

export async function getFeaturedListings(
  repository: FirestoreSyncRepository,
  limit = 6
): Promise<ListingFirestoreDocument[]> {
  const listings = await getPublicListings(repository, { limit: Math.max(limit * 2, limit) });
  return listings
    .filter((listing) => listing.badges.includes("Premium") || listing.images.length > 0)
    .slice(0, limit);
}

export async function getListingsByMunicipality(
  repository: FirestoreSyncRepository,
  municipality: string,
  limit = 20
): Promise<ListingFirestoreDocument[]> {
  return getPublicListings(repository, { municipality, limit });
}

export async function getFilteredListings(
  repository: FirestoreSyncRepository,
  filters: PublicListingsFilter
): Promise<ListingFirestoreDocument[]> {
  return getPublicListings(repository, filters);
}
