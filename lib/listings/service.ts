import { applyListingFilters, paginateListings } from "@/lib/listings/filters";
import {
  getPublicListingsPage as getPublicListingsPageFromFirestore,
  getListingsByMunicipality as getListingsByMunicipalityFromFirestore,
  getPublicListingBySlug as getPublicListingBySlugFromFirestore,
  getPublicListings as getPublicListingsFromFirestore
} from "@/lib/listings/firestore-data";
import {
  DEFAULT_FEATURED_AGENT_KEYS,
  DEFAULT_FEATURED_AGENT_NATIONAL_ASSOCIATION_IDS,
  getSiteSettings
} from "@/lib/settings/site-settings";
import type { Listing, ListingFilters, PaginatedListings } from "@/types/listing";

export async function getPublicListings(
  filters: ListingFilters,
  options?: { includeAllItems?: boolean }
): Promise<PaginatedListings> {
  const includeAllItems = options?.includeAllItems === true;

  if (canUseIndexedSearch(filters)) {
    const paged = await getPublicListingsPageFromFirestore(filters);
    let items = paged.items;
    let allItems: Listing[] | undefined;

    if (filters.propertyType) {
      const selectedType = normalizePropertyType(filters.propertyType);
      items = items.filter((listing) => normalizePropertyType(listing.propertyType) === selectedType);
    }

    if (includeAllItems) {
      const allCandidates = await getPublicListingsFromFirestore(filters);
      allItems = sortListingsForBrowsing(applyListingFilters(allCandidates, filters), filters.sort);
    }

    return {
      items,
      total: paged.total,
      page: paged.page,
      pageSize: paged.pageSize,
      totalPages: paged.totalPages,
      allItems
    };
  }

  const listings = await getPublicListingsFromFirestore(filters);
  const filtered = applyListingFilters(listings, filters);
  const sorted = sortListingsForBrowsing(filtered, filters.sort);
  const paginated = paginateListings(sorted, filters);

  if (!includeAllItems) {
    return {
      ...paginated,
      allItems: undefined
    };
  }

  return paginated;
}

export async function getPublicListingBySlug(slug: string): Promise<Listing | null> {
  return getPublicListingBySlugFromFirestore(slug);
}

export async function getAllPublicListings(): Promise<Listing[]> {
  const listings = await getPublicListingsFromFirestore();
  return sortListingsWithFeaturedPriority(listings);
}

export async function getFeaturedListings(): Promise<Listing[]> {
  const listings = await getPublicListingsFromFirestore();
  const defaultAgentFeatured = listings.filter(isDefaultAgentFeatured).sort((a, b) => b.price - a.price);
  const remaining = listings
    .filter((listing) => !isDefaultAgentFeatured(listing))
    .sort((a, b) => b.price - a.price);

  return [...defaultAgentFeatured, ...remaining].slice(0, 6);
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
    const aDefaultFeatured = isDefaultAgentFeatured(a);
    const bDefaultFeatured = isDefaultAgentFeatured(b);

    if (aRank != null && bRank != null) return aRank - bRank;
    if (aRank != null) return -1;
    if (bRank != null) return 1;
    if (aDefaultFeatured && bDefaultFeatured) return b.price - a.price;
    if (aDefaultFeatured) return -1;
    if (bDefaultFeatured) return 1;
    return b.price - a.price;
  });
}

function isDefaultAgentFeatured(listing: Listing): boolean {
  const agentKey = listing.listAgentKey?.trim();

  return !!(
    agentKey &&
    DEFAULT_FEATURED_AGENT_KEYS.includes(
      agentKey as (typeof DEFAULT_FEATURED_AGENT_KEYS)[number]
    )
  );
}

function sortListingsForBrowsing(listings: Listing[], sort: ListingFilters["sort"] = "price_asc"): Listing[] {
  if (sort === "price_desc") {
    return [...listings].sort((a, b) => b.price - a.price);
  }

  if (sort === "newest") {
    return [...listings].sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt));
  }

  return [...listings].sort((a, b) => a.price - b.price);
}

function toMillis(value: string): number {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizePropertyType(value: string): string {
  return value.trim().toLowerCase();
}

function canUseIndexedSearch(filters: ListingFilters): boolean {
  if (filters.addressContains) return false;
  if (filters.propertyType) return false;
  if (filters.bedrooms != null) return false;
  if (filters.bathrooms != null) return false;
  if (filters.minLatitude != null) return false;
  if (filters.maxLatitude != null) return false;
  if (filters.minLongitude != null) return false;
  if (filters.maxLongitude != null) return false;
  if ((filters.minPrice != null || filters.maxPrice != null) && filters.sort === "newest") return false;
  return true;
}
