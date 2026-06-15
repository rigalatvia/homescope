import { applyListingFilters, paginateListings } from "@/lib/listings/filters";
import {
  getFeaturedListings as getFeaturedListingsFromFirestore,
  getListingsByAgentKey as getListingsByAgentKeyFromFirestore,
  getPublicListingsPage as getPublicListingsPageFromFirestore,
  getPublicListingsByIds as getPublicListingsByIdsFromFirestore,
  getListingsByMunicipality as getListingsByMunicipalityFromFirestore,
  getListingStatsByMunicipality as getListingStatsByMunicipalityFromFirestore,
  getMonthlyMarketStatsByMunicipality as getMonthlyMarketStatsByMunicipalityFromFirestore,
  getListingsNearCoordinate as getListingsNearCoordinateFromFirestore,
  getPublicListingByMlsNumber as getPublicListingByMlsNumberFromFirestore,
  getPublicListingBySlug as getPublicListingBySlugFromFirestore,
  getPublicListings as getPublicListingsFromFirestore
} from "@/lib/listings/firestore-data";
import { DEFAULT_FEATURED_AGENT_KEYS, getSiteSettings } from "@/lib/settings/site-settings";
import { getSchoolDirectory } from "@/lib/schools/firestore-data";
import { calculateDistanceKm } from "@/lib/schools/geo";
import type { Listing, ListingFilters, PaginatedListings } from "@/types/listing";
import type { School } from "@/types/school";

export async function getPublicListings(
  filters: ListingFilters,
  options?: { includeAllItems?: boolean }
): Promise<PaginatedListings> {
  const includeAllItems = options?.includeAllItems === true;
  const school = filters.schoolSlug ? await getSchoolForListingFilter(filters.schoolSlug) : undefined;

  if (filters.mlsNumber) {
    const listing = await getPublicListingByMlsNumberFromFirestore(filters.mlsNumber);
    const filtered = listing ? applyListingFilters([listing], filters, { school }) : [];
    const sorted = sortListingsForBrowsing(addSchoolDistances(filtered, school), filters.sort, school);
    const paginated = paginateListings(sorted, filters);

    if (!includeAllItems) {
      return {
        ...paginated,
        allItems: undefined
      };
    }

    return paginated;
  }

  if (school?.latitude != null && school.longitude != null && filters.schoolSlug) {
    const listings = await getNearbyListingCandidates({
      latitude: school.latitude,
      longitude: school.longitude,
      radiusKm: filters.schoolRadiusKm ?? 3,
      municipality: filters.city || school.municipality,
      maxCandidates: 2500
    });
    const filtered = applyListingFilters(listings, filters, { school });
    const sorted = sortListingsForBrowsing(addSchoolDistances(filtered, school), filters.sort, school);
    const paginated = paginateListings(sorted, filters);

    if (!includeAllItems) {
      return {
        ...paginated,
        allItems: undefined
      };
    }

    return paginated;
  }

  if (canUseIndexedSearch(filters)) {
    const paged = await getPublicListingsPageFromFirestore(filters);
    let items = paged.items;
    let allItems: Listing[] | undefined;

    if (filters.propertyType) {
      items = items.filter((listing) => propertyTypeMatchesFilter(listing.propertyType, filters.propertyType!));
    }

    if (includeAllItems) {
      const allCandidates = await getPublicListingsFromFirestore(filters);
      allItems = sortListingsForBrowsing(
        addSchoolDistances(applyListingFilters(allCandidates, filters, { school }), school),
        filters.sort,
        school
      );
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
  const filtered = applyListingFilters(listings, filters, { school });
  const sorted = sortListingsForBrowsing(addSchoolDistances(filtered, school), filters.sort, school);
  const paginated = paginateListings(sorted, filters);

  if (!includeAllItems) {
    return {
      ...paginated,
      allItems: undefined
    };
  }

  return paginated;
}

async function getSchoolForListingFilter(slug: string): Promise<School | undefined> {
  try {
    const directory = await getSchoolDirectory();
    return directory.find((school) => school.slug === slug);
  } catch (error) {
    console.error("[listings] Failed reading school directory for listing filter", error);
    return undefined;
  }
}

export async function getPublicListingBySlug(slug: string): Promise<Listing | null> {
  return getPublicListingBySlugFromFirestore(slug);
}

export async function getAllPublicListings(): Promise<Listing[]> {
  const listings = await getPublicListingsFromFirestore({});
  return sortListingsWithFeaturedPriority(listings);
}

export async function getFeaturedListings(): Promise<Listing[]> {
  const yanAgentKey = DEFAULT_FEATURED_AGENT_KEYS[0];
  const [yanListings, fallbackListings] = await Promise.all([
    getListingsByAgentKeyFromFirestore(yanAgentKey, 6),
    getFeaturedListingsFromFirestore()
  ]);

  const seen = new Set<string>();
  const ordered: Listing[] = [];

  for (const listing of [...yanListings, ...fallbackListings]) {
    if (seen.has(listing.id)) continue;
    seen.add(listing.id);
    ordered.push(listing);
    if (ordered.length >= 6) break;
  }

  return ordered;
}

export async function getListingsByMunicipality(city: string, limit = 200): Promise<Listing[]> {
  const listings = await getListingsByMunicipalityFromFirestore(city, limit);
  return sortListingsWithFeaturedPriority(listings);
}

export async function getListingStatsByMunicipality(city: string) {
  return getListingStatsByMunicipalityFromFirestore(city);
}

export async function getMonthlyMarketStatsByMunicipality(options: {
  municipality: string;
  monthStartIso: string;
  nextMonthStartIso: string;
  asOfIso: string;
}) {
  return getMonthlyMarketStatsByMunicipalityFromFirestore(options);
}

export async function getNearbyListingCandidates(options: {
  latitude: number;
  longitude: number;
  radiusKm: number;
  municipality?: string;
  maxCandidates?: number;
}): Promise<Listing[]> {
  try {
    return await getListingsNearCoordinateFromFirestore(options);
  } catch (error) {
    console.error("[listings] Nearby coordinate lookup failed; falling back to municipality listings", error);
    if (options.municipality) {
      return getPublicListingsFromFirestore({ city: options.municipality });
    }
    return getPublicListingsFromFirestore({});
  }
}

export async function getPublicListingsByIds(listingIds: string[]): Promise<Listing[]> {
  return getPublicListingsByIdsFromFirestore(listingIds);
}

export async function getSimilarListingsForListing(listing: Listing, limit = 8): Promise<Listing[]> {
  const cityCandidates = await getListingsByMunicipality(listing.city, 250);
  const candidateMap = new Map<string, Listing>();

  for (const candidate of cityCandidates) {
    candidateMap.set(candidate.id, candidate);
  }

  if (candidateMap.size < limit + 1) {
    const layoutCandidates = await getPublicListings(
      {
        transactionType: listing.transactionType,
        bedrooms: listing.bedrooms,
        bedroomsMatch: "exact",
        bathrooms: listing.bathrooms,
        bathroomsMatch: "exact",
        page: 1,
        pageSize: 50
      },
      { includeAllItems: true }
    );

    for (const candidate of layoutCandidates.allItems ?? layoutCandidates.items) {
      candidateMap.set(candidate.id, candidate);
    }
  }

  return Array.from(candidateMap.values())
    .filter((candidate) => candidate.id !== listing.id)
    .filter((candidate) => candidate.transactionType === listing.transactionType)
    .sort((left, right) => compareSimilarListings(listing, left, right))
    .slice(0, limit);
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

function sortListingsForBrowsing(
  listings: Listing[],
  sort: ListingFilters["sort"] = "price_asc",
  school?: School
): Listing[] {
  if (sort === "distance" && school?.latitude != null && school.longitude != null) {
    return [...listings].sort((a, b) => {
      const aDistance = getDistanceToSchool(a, school);
      const bDistance = getDistanceToSchool(b, school);
      if (aDistance !== bDistance) return aDistance - bDistance;
      return a.price - b.price;
    });
  }

  if (sort === "price_desc") {
    return [...listings].sort((a, b) => b.price - a.price);
  }

  if (sort === "newest") {
    return [...listings].sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt));
  }

  return [...listings].sort((a, b) => a.price - b.price);
}

function addSchoolDistances(listings: Listing[], school?: School): Listing[] {
  if (school?.latitude == null || school.longitude == null) return listings;

  return listings.map((listing) => {
    const distanceKm = getDistanceToSchool(listing, school);
    if (!Number.isFinite(distanceKm)) return listing;
    return {
      ...listing,
      distanceKmFromSchool: distanceKm
    };
  });
}

function getDistanceToSchool(listing: Listing, school: School): number {
  if (
    listing.latitude == null ||
    listing.longitude == null ||
    school.latitude == null ||
    school.longitude == null
  ) {
    return Number.POSITIVE_INFINITY;
  }

  return calculateDistanceKm(school.latitude, school.longitude, listing.latitude, listing.longitude);
}

function toMillis(value: string): number {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function compareSimilarListings(source: Listing, left: Listing, right: Listing): number {
  const leftScore = getSimilarityBucket(source, left);
  const rightScore = getSimilarityBucket(source, right);
  if (leftScore !== rightScore) return leftScore - rightScore;

  const leftLayoutDiff = getLayoutDifference(source, left);
  const rightLayoutDiff = getLayoutDifference(source, right);
  if (leftLayoutDiff !== rightLayoutDiff) return leftLayoutDiff - rightLayoutDiff;

  return toMillis(right.updatedAt) - toMillis(left.updatedAt);
}

function getSimilarityBucket(source: Listing, candidate: Listing): number {
  const sourceArea = normalizeComparable(source.area);
  const candidateArea = normalizeComparable(candidate.area);
  if (sourceArea && candidateArea && sourceArea === candidateArea) return 0;
  if (normalizeComparable(source.city) === normalizeComparable(candidate.city)) return 1;
  if (getLayoutDifference(source, candidate) === 0) return 2;
  return 3;
}

function normalizeComparable(value: string): string {
  const normalized = value.trim().toLowerCase();
  return normalized === "gta" || normalized === "unknown" ? "" : normalized;
}

function getLayoutDifference(source: Listing, candidate: Listing): number {
  return Math.abs(candidate.bedrooms - source.bedrooms) + Math.abs(candidate.bathrooms - source.bathrooms);
}

function normalizePropertyType(value: string): string {
  return value.trim().toLowerCase();
}

function propertyTypeMatchesFilter(listingType: string, selectedType: string): boolean {
  const listing = normalizePropertyType(listingType);
  const selected = normalizePropertyType(selectedType);
  if (listing === selected) return true;
  if (selected === "freehold") return ["detached", "semi-detached", "townhouse", "house", "freehold"].includes(listing);
  if (selected === "townhouse") return ["townhouse", "condo townhouse"].includes(listing);
  if (selected === "condo") return ["condo", "apartment", "condo townhouse"].includes(listing);
  return false;
}

function canUseIndexedSearch(filters: ListingFilters): boolean {
  if (filters.addressContains) return false;
  if (filters.mlsNumber) return false;
  if (filters.propertyType) return false;
  if (filters.bedrooms != null) return false;
  if (filters.bathrooms != null) return false;
  if (filters.minLatitude != null) return false;
  if (filters.maxLatitude != null) return false;
  if (filters.minLongitude != null) return false;
  if (filters.maxLongitude != null) return false;
  if (filters.schoolSlug) return false;
  if ((filters.minPrice != null || filters.maxPrice != null) && filters.sort === "newest") return false;
  return true;
}
