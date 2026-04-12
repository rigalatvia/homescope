import { unstable_cache } from "next/cache";
import type { Listing, ListingFilters } from "@/types/listing";
import type { MLSListingFirestoreDocument } from "@/lib/mls/types";
import {
  getFeaturedListings as getFeaturedMLSListings,
  getFilteredListings as getFilteredMLSListings,
  getListingsByMunicipality as getMLSListingsByMunicipality,
  getPublicListingBySlug as getMLSListingBySlug,
  getPublicListings as getPublicMLSListings
} from "@/lib/mls/sync/publicQueries";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1568605114967-8130f3a36994";

const getCachedPublicMLSListings = unstable_cache(
  async () => getPublicMLSListings(500),
  ["public-mls-listings"],
  { revalidate: 60 }
);

const getCachedFeaturedMLSListings = unstable_cache(
  async () => getFeaturedMLSListings(6),
  ["featured-mls-listings"],
  { revalidate: 60 }
);

export async function getPublicListings(filters?: ListingFilters): Promise<Listing[]> {
  const listings = filters
    ? await getFilteredMLSListings({
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
    return mappedListings.filter((listing) => listing.propertyType === filters.propertyType);
  }

  return mappedListings;
}

export async function getPublicListingBySlug(slug: string): Promise<Listing | null> {
  const listing = await getMLSListingBySlug(slug);
  if (!listing) return null;
  const mapped = mapMLSListingToUIListing(listing);
  return mapped.isPubliclyAdvertisable ? mapped : null;
}

export async function getListingsByMunicipality(city: string): Promise<Listing[]> {
  const listings = await getMLSListingsByMunicipality(city, 200);
  return listings.map(mapMLSListingToUIListing).filter((listing) => listing.isPubliclyAdvertisable);
}

export async function getFeaturedListings(): Promise<Listing[]> {
  const listings = await getCachedFeaturedMLSListings();
  return listings.map(mapMLSListingToUIListing).filter((listing) => listing.isPubliclyAdvertisable);
}

function mapMLSListingToUIListing(raw: MLSListingFirestoreDocument): Listing {
  const listingAddress =
    raw.address.fullAddress ||
    [raw.address.streetNumber, raw.address.streetName, raw.address.unit].filter(Boolean).join(" ").trim() ||
    "Address unavailable";

  return {
    id: raw.listingId,
    mlsNumber: raw.mlsNumber || "N/A",
    title: buildListingTitle(raw),
    price: raw.price ?? 0,
    city: raw.municipality || "Unknown",
    area: raw.area || "GTA",
    address: listingAddress,
    postalCode: raw.address.postalCode || undefined,
    bedrooms: raw.bedrooms ?? 0,
    bathrooms: raw.bathrooms ?? 0,
    propertyType: raw.propertyType || "Residential",
    transactionType: parseTransactionType(raw),
    description: raw.publicRemarks || "Listing description will be available shortly.",
    images: raw.images.length > 0 ? raw.images : [FALLBACK_IMAGE],
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

function buildListingTitle(raw: MLSListingFirestoreDocument): string {
  const bits = [raw.propertyType, raw.area, raw.municipality].filter(Boolean);
  if (bits.length === 0) return "Featured Home";
  return bits.join(" in ");
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
