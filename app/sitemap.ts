import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/config/site";
import { getAllPublicListings } from "@/lib/listings/service";

const STATIC_ROUTES = [
  "",
  "/listings",
  "/schools",
  "/guides",
  "/guides/first-time-home-buyer-ontario",
  "/guides/documents-needed-buy-house-toronto",
  "/guides/organize-real-estate-documents-canada",
  "/guides/rental-application-ontario",
  "/guides/buying",
  "/guides/leasing",
  "/guides/lease-documents",
  "/contact"
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_CONFIG.baseUrl}${route}`,
    lastModified: new Date()
  }));

  const listings = await getAllPublicListings();
  const listingPages = listings.map((listing) => ({
    url: `${SITE_CONFIG.baseUrl}/listings/${listing.listingUrlSlug}`,
    lastModified: new Date(listing.updatedAt)
  }));

  return [...staticPages, ...listingPages];
}
