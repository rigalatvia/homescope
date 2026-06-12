import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/config/site";
import { PRIMARY_MARKET_PAGES } from "@/lib/locations/markets";
import { NEIGHBORHOOD_PAGES } from "@/lib/locations/neighborhoods";
import { CURRENT_MARKET_REPORT } from "@/lib/market/reports";
import { getAllPublicListings } from "@/lib/listings/service";
import { getSchools } from "@/lib/schools/service";

const STATIC_ROUTES = [
  "",
  "/about",
  "/listings",
  "/schools",
  "/guides",
  "/guides/first-time-home-buyer-ontario",
  "/guides/documents-needed-buy-house-toronto",
  "/guides/land-transfer-tax-calculator-ontario",
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
    lastModified: new Date(),
    changeFrequency: route === "" || route === "/listings" || route === "/schools" ? "daily" : "weekly",
    priority: route === "" ? 1 : route === "/listings" || route === "/schools" ? 0.9 : 0.7
  }));

  const locationPages: MetadataRoute.Sitemap = PRIMARY_MARKET_PAGES.map((market) => ({
    url: `${SITE_CONFIG.baseUrl}/locations/${market.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.85
  }));

  const neighborhoodPages: MetadataRoute.Sitemap = NEIGHBORHOOD_PAGES.map((neighborhood) => ({
    url: `${SITE_CONFIG.baseUrl}/locations/${neighborhood.city.toLowerCase().replace(/\s+/g, "-")}/${neighborhood.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.75
  }));

  const marketReportPages: MetadataRoute.Sitemap = PRIMARY_MARKET_PAGES.map((market) => ({
    url: `${SITE_CONFIG.baseUrl}/market-reports/${market.slug}/${CURRENT_MARKET_REPORT.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.75
  }));

  const listings = await getAllPublicListings();
  const listingPages = listings.map((listing) => ({
    url: `${SITE_CONFIG.baseUrl}/listings/${listing.listingUrlSlug}`,
    lastModified: new Date(listing.updatedAt),
    changeFrequency: "daily" as const,
    priority: 0.65
  }));

  const schools = await getSchools();
  const schoolPages: MetadataRoute.Sitemap = schools.map((school) => ({
    url: `${SITE_CONFIG.baseUrl}/schools/${school.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8
  }));

  return [...staticPages, ...locationPages, ...neighborhoodPages, ...marketReportPages, ...schoolPages, ...listingPages];
}
