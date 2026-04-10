import { paginateListings } from "@/lib/listings/filters";
import {
  getFeaturedListings as getFeaturedListingsFromFirestore,
  getListingsByMunicipality as getListingsByMunicipalityFromFirestore,
  getPublicListingBySlug as getPublicListingBySlugFromFirestore,
  getPublicListings as getPublicListingsFromFirestore
} from "@/lib/listings/firestore-data";
import type { Listing, ListingFilters, PaginatedListings } from "@/types/listing";

export async function getPublicListings(filters: ListingFilters): Promise<PaginatedListings> {
  const filtered = await getPublicListingsFromFirestore(filters);
  const sorted = filtered.sort((a, b) => b.price - a.price);
  return paginateListings(sorted, filters);
}

export async function getPublicListingBySlug(slug: string): Promise<Listing | null> {
  return getPublicListingBySlugFromFirestore(slug);
}

export async function getAllPublicListings(): Promise<Listing[]> {
  const listings = await getPublicListingsFromFirestore();
  return listings.sort((a, b) => b.price - a.price);
}

export async function getFeaturedListings(): Promise<Listing[]> {
  const listings = await getFeaturedListingsFromFirestore();
  return listings.sort((a, b) => b.price - a.price);
}

export async function getListingsByMunicipality(city: string): Promise<Listing[]> {
  const listings = await getListingsByMunicipalityFromFirestore(city);
  return listings.sort((a, b) => b.price - a.price);
}
