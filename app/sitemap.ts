import type { MetadataRoute } from "next";
import { getAllPublicListings } from "@/lib/listings/service";

const SITEMAP_BASE_URL = "https://homescopegta.ca";
const STATIC_ROUTES = [
  "",
  "/listings",
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
    url: `${SITEMAP_BASE_URL}${route}`,
    lastModified: new Date()
  }));

  const listings = await getAllPublicListings();
  const listingPages = listings.map((listing) => ({
    url: `${SITEMAP_BASE_URL}/listings/${listing.listingUrlSlug}`,
    lastModified: new Date(listing.updatedAt)
  }));

  return [...staticPages, ...listingPages];
}
