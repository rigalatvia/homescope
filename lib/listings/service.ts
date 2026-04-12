import { paginateListings } from "@/lib/listings/filters";
import {
  getListingsByMunicipality as getListingsByMunicipalityFromFirestore,
  getPublicListingBySlug as getPublicListingBySlugFromFirestore,
  getPublicListings as getPublicListingsFromFirestore
} from "@/lib/listings/firestore-data";
import { getSiteSettings } from "@/lib/settings/site-settings";
import type { Listing, ListingFilters, PaginatedListings } from "@/types/listing";

export async function getPublicListings(filters: ListingFilters): Promise<PaginatedListings> {
  const filtered = await getPublicListingsFromFirestore(filters);
  const sorted = await sortListingsWithFeaturedPriority(filtered);
  return paginateListings(sorted, filters);
}

export async function getPublicListingBySlug(slug: string): Promise<Listing | null> {
  return getPublicListingBySlugFromFirestore(slug);
}

export async function getAllPublicListings(): Promise<Listing[]> {
  const listings = await getPublicListingsFromFirestore();
  return sortListingsWithFeaturedPriority(listings);
}

export async function getFeaturedListings(): Promise<Listing[]> {
  const [listings, settings] = await Promise.all([getPublicListingsFromFirestore(), getSiteSettings()]);
  const sorted = sortByFeaturedIds(listings, settings.featuredListingIds);
  return sorted.slice(0, 6);
}

export async function getListingsByMunicipality(city: string): Promise<Listing[]> {
  const listings = await getListingsByMunicipalityFromFirestore(city);
  return sortListingsWithFeaturedPriority(listings);
}

async function sortListingsWithFeaturedPriority(listings: Listing[]): Promise<Listing[]> {
  const settings = await getSiteSettings();
  return sortByFeaturedIds(listings, settings.featuredListingIds);
}

function sortByFeaturedIds(listings: Listing[], featuredListingIds: string[]): Listing[] {
  if (!Array.isArray(featuredListingIds) || featuredListingIds.length === 0) {
    return [...listings].sort((a, b) => b.price - a.price);
  }

  const featuredRank = new Map<string, number>();
  featuredListingIds.forEach((id, index) => {
    if (!featuredRank.has(id)) featuredRank.set(id, index);
  });

  return [...listings].sort((a, b) => {
    const aRank = featuredRank.get(a.id);
    const bRank = featuredRank.get(b.id);

    if (aRank != null && bRank != null) return aRank - bRank;
    if (aRank != null) return -1;
    if (bRank != null) return 1;
    return b.price - a.price;
  });
}
