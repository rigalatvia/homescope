import type { Listing } from "@/types/listing";
import type { ListingDataProvider } from "@/lib/listings/provider";

/**
 * Disabled legacy provider.
 * Keep class for backward compatibility, but do not use in production path.
 */
export class MockListingProvider implements ListingDataProvider {
  async getListings(): Promise<Listing[]> {
    return [];
  }

  async getListingBySlug(slug: string): Promise<Listing | null> {
    void slug;
    return null;
  }
}
