import type { Listing } from "@/types/listing";

export interface ListingDataProvider {
  getListings(): Promise<Listing[]>;
  getListingBySlug(slug: string): Promise<Listing | null>;
}
