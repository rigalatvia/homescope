import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/config/site";
import { getAllPublicListings } from "@/lib/listings/service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = await getAllPublicListings();
  const listingPages = listings.map((listing) => ({
    url: `${SITE_CONFIG.baseUrl}/listings/${listing.listingUrlSlug}`,
    lastModified: new Date(listing.updatedAt)
  }));

  return [
    { url: SITE_CONFIG.baseUrl, lastModified: new Date() },
    { url: `${SITE_CONFIG.baseUrl}/listings`, lastModified: new Date() },
    { url: `${SITE_CONFIG.baseUrl}/contact`, lastModified: new Date() },
    ...listingPages
  ];
}
