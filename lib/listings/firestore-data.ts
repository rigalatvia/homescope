import { unstable_cache } from "next/cache";
import type { Listing, ListingFilters } from "@/types/listing";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { allowedMunicipalities } from "@/lib/mls/config";
import type { MLSListingFirestoreDocument } from "@/lib/mls/types";
import {
  getFilteredListingsPage as getFilteredMLSListingsPage,
  getFeaturedListings as getFeaturedMLSListings,
  getFilteredListings as getFilteredMLSListings,
  getListingsByAgentKey as getMLSListingsByAgentKey,
  getListingsByMunicipality as getMLSListingsByMunicipality,
  getListingStatsByMunicipality as getMLSListingStatsByMunicipality,
  getMonthlyMarketStatsByMunicipality as getMLSMonthlyMarketStatsByMunicipality,
  getListingsNearCoordinate as getMLSListingsNearCoordinate,
  getPublicListingByMlsNumber as getMLSListingByMlsNumber,
  getPublicListingBySlug as getMLSListingBySlug,
  getPublicListings as getPublicMLSListings
} from "@/lib/mls/sync/publicQueries";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1568605114967-8130f3a36994";
const PUBLIC_LISTINGS_REVALIDATE_SECONDS = 15 * 60;

const getCachedPublicMLSListings = unstable_cache(
  async () => getPublicMLSListings(500),
  ["public-mls-listings"],
  { revalidate: PUBLIC_LISTINGS_REVALIDATE_SECONDS }
);

const getCachedFeaturedMLSListings = unstable_cache(
  async () => getFeaturedMLSListings(6),
  ["featured-mls-listings"],
  { revalidate: PUBLIC_LISTINGS_REVALIDATE_SECONDS }
);

const getCachedFilteredMLSListings = unstable_cache(
  async (filters: {
    municipality?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
  }) => getFilteredMLSListings(filters),
  ["filtered-mls-listings"],
  { revalidate: PUBLIC_LISTINGS_REVALIDATE_SECONDS }
);

const getCachedFilteredMLSListingsPage = unstable_cache(
  async (filters: {
    municipality?: string;
    transactionType?: "sale" | "lease";
    mlsNumber?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: "price_asc" | "price_desc" | "newest";
    page?: number;
    pageSize?: number;
  }) => getFilteredMLSListingsPage(filters),
  ["filtered-mls-listings-page"],
  { revalidate: PUBLIC_LISTINGS_REVALIDATE_SECONDS }
);

const getCachedMLSListingBySlug = unstable_cache(
  async (slug: string) => getMLSListingBySlug(slug),
  ["public-mls-listing-by-slug"],
  { revalidate: PUBLIC_LISTINGS_REVALIDATE_SECONDS }
);

const getCachedMLSListingByMlsNumber = unstable_cache(
  async (mlsNumber: string) => getMLSListingByMlsNumber(mlsNumber),
  ["public-mls-listing-by-mls-number"],
  { revalidate: PUBLIC_LISTINGS_REVALIDATE_SECONDS }
);

const getCachedMLSListingsByMunicipality = unstable_cache(
  async (city: string, limit: number) => getMLSListingsByMunicipality(city, limit),
  ["public-mls-listings-by-municipality"],
  { revalidate: PUBLIC_LISTINGS_REVALIDATE_SECONDS }
);

const getCachedMLSListingStatsByMunicipality = unstable_cache(
  async (city: string) => getMLSListingStatsByMunicipality(city),
  ["public-mls-listing-stats-by-municipality"],
  { revalidate: PUBLIC_LISTINGS_REVALIDATE_SECONDS }
);

const getCachedMLSMonthlyMarketStatsByMunicipality = unstable_cache(
  async (options: {
    municipality: string;
    monthStartIso: string;
    nextMonthStartIso: string;
    asOfIso: string;
  }) => getMLSMonthlyMarketStatsByMunicipality(options),
  ["public-mls-monthly-market-stats-by-municipality"],
  { revalidate: PUBLIC_LISTINGS_REVALIDATE_SECONDS }
);

const getCachedMLSListingsNearCoordinate = unstable_cache(
  async (filters: {
    latitude: number;
    longitude: number;
    radiusKm: number;
    municipality?: string;
    maxCandidates?: number;
  }) => getMLSListingsNearCoordinate(filters),
  ["public-mls-listings-near-coordinate"],
  { revalidate: PUBLIC_LISTINGS_REVALIDATE_SECONDS }
);

const getCachedMLSListingsByAgentKey = unstable_cache(
  async (agentKey: string, limit: number) => getMLSListingsByAgentKey(agentKey, limit),
  ["public-mls-listings-by-agent-key"],
  { revalidate: PUBLIC_LISTINGS_REVALIDATE_SECONDS }
);

const getCachedPublicListingsByIds = unstable_cache(
  async (listingIds: string[]) => getPublicListingsByIdsFromFirestore(listingIds),
  ["public-mls-listings-by-ids"],
  { revalidate: PUBLIC_LISTINGS_REVALIDATE_SECONDS }
);

export async function getPublicListings(filters?: ListingFilters): Promise<Listing[]> {
  const listings = filters
    ? await getCachedFilteredMLSListings({
        municipality: filters.city,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        bedrooms: filters.bedrooms,
        bathrooms: filters.bathrooms
      })
    : await getCachedPublicMLSListings();

  const mappedListings = listings.map(mapMLSListingToUIListing).filter((listing) => listing.isPubliclyAdvertisable);
  if (filters?.transactionType) {
    return mappedListings.filter((listing) => listing.transactionType === filters.transactionType);
  }
  if (filters?.propertyType) {
    return mappedListings.filter((listing) => propertyTypeMatchesFilter(listing.propertyType, filters.propertyType!));
  }

  return mappedListings;
}

export async function getPublicListingsPage(filters: ListingFilters): Promise<{
  items: Listing[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const result = await getCachedFilteredMLSListingsPage({
    municipality: filters.city,
    transactionType: filters.transactionType,
    mlsNumber: filters.mlsNumber?.trim().toUpperCase(),
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sort: toIndexedListingSort(filters.sort),
    page: filters.page,
    pageSize: filters.pageSize
  });

  return {
    items: result.items.map(mapMLSListingToUIListing).filter((listing) => listing.isPubliclyAdvertisable),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages
  };
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

function toIndexedListingSort(sort: ListingFilters["sort"]): "price_asc" | "price_desc" | "newest" | undefined {
  return sort === "distance" ? undefined : sort;
}

export async function getPublicListingBySlug(slug: string): Promise<Listing | null> {
  const listing = await getCachedMLSListingBySlug(slug);
  if (!listing) return null;
  const mapped = mapMLSListingToUIListing(listing);
  return mapped.isPubliclyAdvertisable ? mapped : null;
}

export async function getPublicListingByMlsNumber(mlsNumber: string): Promise<Listing | null> {
  const listing = await getCachedMLSListingByMlsNumber(mlsNumber);
  if (!listing) return null;
  const mapped = mapMLSListingToUIListing(listing);
  return mapped.isPubliclyAdvertisable ? mapped : null;
}

export async function getListingsByMunicipality(city: string, limit = 200): Promise<Listing[]> {
  const listings = await getCachedMLSListingsByMunicipality(city, limit);
  return listings.map(mapMLSListingToUIListing).filter((listing) => listing.isPubliclyAdvertisable);
}

export async function getListingStatsByMunicipality(city: string) {
  return getCachedMLSListingStatsByMunicipality(city);
}

export async function getMonthlyMarketStatsByMunicipality(options: {
  municipality: string;
  monthStartIso: string;
  nextMonthStartIso: string;
  asOfIso: string;
}) {
  return getCachedMLSMonthlyMarketStatsByMunicipality(options);
}

export async function getListingsNearCoordinate(filters: {
  latitude: number;
  longitude: number;
  radiusKm: number;
  municipality?: string;
  maxCandidates?: number;
}): Promise<Listing[]> {
  const listings = await getCachedMLSListingsNearCoordinate(filters);
  return listings.map(mapMLSListingToUIListing).filter((listing) => listing.isPubliclyAdvertisable);
}

export async function getFeaturedListings(): Promise<Listing[]> {
  const listings = await getCachedFeaturedMLSListings();
  return listings.map(mapMLSListingToUIListing).filter((listing) => listing.isPubliclyAdvertisable);
}

export async function getListingsByAgentKey(agentKey: string, limit = 24): Promise<Listing[]> {
  const listings = await getCachedMLSListingsByAgentKey(agentKey, limit);
  return listings.map(mapMLSListingToUIListing).filter((listing) => listing.isPubliclyAdvertisable);
}

export async function getPublicListingsByIds(listingIds: string[]): Promise<Listing[]> {
  const normalizedIds = Array.from(
    new Set(listingIds.map((listingId) => listingId.trim()).filter((listingId) => listingId.length > 0))
  );

  if (normalizedIds.length === 0) {
    return [];
  }

  return getCachedPublicListingsByIds(normalizedIds);
}

async function getPublicListingsByIdsFromFirestore(listingIds: string[]): Promise<Listing[]> {
  const firestore = getFirebaseAdminFirestore();
  const listingMap = new Map<string, Listing>();
  const snapshots = await Promise.all(
    chunkList(listingIds, 10).map((chunk) =>
      firestore.collection("listings").where("listingId", "in", chunk).get()
    )
  );

  for (const snapshot of snapshots) {
    for (const doc of snapshot.docs) {
      const listing = mapMLSListingToUIListing(doc.data() as MLSListingFirestoreDocument);
      if (
        listing.isPubliclyAdvertisable &&
        allowedMunicipalities.includes(listing.city as (typeof allowedMunicipalities)[number])
      ) {
        listingMap.set(listing.id, listing);
      }
    }
  }

  return listingIds
    .map((listingId) => listingMap.get(listingId))
    .filter((listing): listing is Listing => Boolean(listing));
}

function mapMLSListingToUIListing(raw: MLSListingFirestoreDocument): Listing {
  const listingAddress =
    raw.address.fullAddress ||
    [raw.address.streetNumber, raw.address.streetName, raw.address.unit].filter(Boolean).join(" ").trim() ||
    "Address unavailable";

  const images = filterPhotoUrls(raw.images);

  return {
    id: raw.listingId,
    mlsNumber: raw.mlsNumber || "N/A",
    listAgentNationalAssociationId: raw.listAgentNationalAssociationId || undefined,
    listAgentKey: raw.listAgentKey || undefined,
    title: buildListingTitle(raw),
    price: raw.price ?? 0,
    city: raw.municipality || "Unknown",
    area: raw.area || "GTA",
    address: listingAddress,
    postalCode: raw.address.postalCode || undefined,
    bedrooms: raw.bedrooms ?? 0,
    bathrooms: raw.bathrooms ?? 0,
    squareFootage: formatSquareFootage(raw),
    propertyType: mapOwnershipType(raw),
    transactionType: parseTransactionType(raw),
    description: raw.publicRemarks || "Listing description will be available shortly.",
    images: images.length > 0 ? images : [FALLBACK_IMAGE],
    isPubliclyAdvertisable: raw.isVisible === true,
    status: raw.status === "active" ? "active" : "pending",
    listingUrlSlug: raw.slug,
    badge: raw.badges.includes("Premium") ? "Hot" : raw.badges.includes("Photo Rich") ? "New" : undefined,
    latitude: raw.coordinates.latitude ?? undefined,
    longitude: raw.coordinates.longitude ?? undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt
  };
}

function filterPhotoUrls(urls: string[]): string[] {
  return urls.filter((url) => {
    try {
      const pathname = new URL(url).pathname.toLowerCase();
      return /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(pathname);
    } catch {
      return false;
    }
  });
}

function mapOwnershipType(raw: MLSListingFirestoreDocument): string {
  const displayType = (raw.propertyType || "").trim();
  if (displayType) return displayType;

  const commonInterest = (raw.commonInterest || "").trim().toLowerCase();
  if (commonInterest.includes("condo") || commonInterest.includes("strata")) return "Condo";
  if (commonInterest.includes("freehold")) return "Freehold";

  const propertyClass = (raw.propertyClass || "").trim().toLowerCase();
  if (propertyClass.includes("condo")) return "Condo";
  if (propertyClass.includes("freehold")) return "Freehold";

  const propertyType = (raw.propertyType || "").trim().toLowerCase();
  if (propertyType.includes("condo")) return "Condo";
  if (propertyType.includes("detached") || propertyType.includes("semi") || propertyType.includes("townhouse")) {
    return "Freehold";
  }

  return "Freehold";
}

function buildListingTitle(raw: MLSListingFirestoreDocument): string {
  const bits = [raw.propertyType, raw.area, raw.municipality].filter(Boolean);
  if (bits.length === 0) return "Featured Home";
  return bits.join(" in ");
}

function formatSquareFootage(raw: MLSListingFirestoreDocument): string | undefined {
  const exact = raw.livingArea;
  const minimum = raw.livingAreaMinimum;
  const maximum = raw.livingAreaMaximum;

  if (exact != null && exact > 0) {
    return formatWholeNumber(exact);
  }

  if (minimum != null && maximum != null && minimum > 0 && maximum > 0) {
    return `${formatWholeNumber(minimum)} - ${formatWholeNumber(maximum)}`;
  }

  if (minimum != null && minimum > 0) {
    return `${formatWholeNumber(minimum)}+`;
  }

  if (maximum != null && maximum > 0) {
    return `Up to ${formatWholeNumber(maximum)}`;
  }

  return undefined;
}

function formatWholeNumber(value: number): string {
  return new Intl.NumberFormat("en-CA", { maximumFractionDigits: 0 }).format(value);
}

function parseTransactionType(raw: Pick<MLSListingFirestoreDocument, "transactionType" | "propertyClass" | "status">): Listing["transactionType"] {
  const transactionType = (raw.transactionType || "").trim().toLowerCase();
  const propertyClass = (raw.propertyClass || "").trim().toLowerCase();
  const status = (raw.status || "").trim().toLowerCase();

  if (
    transactionType.includes("lease") ||
    transactionType.includes("rent") ||
    propertyClass.includes("lease") ||
    status.includes("leased")
  ) {
    return "lease";
  }

  return "sale";
}

function chunkList<TItem>(items: TItem[], chunkSize: number): TItem[][] {
  const safeChunkSize = Math.max(1, chunkSize);
  const chunks: TItem[][] = [];

  for (let index = 0; index < items.length; index += safeChunkSize) {
    chunks.push(items.slice(index, index + safeChunkSize));
  }

  return chunks;
}
