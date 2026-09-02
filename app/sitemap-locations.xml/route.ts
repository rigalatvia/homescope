import { SITE_CONFIG } from "@/config/site";
import { PRIMARY_MARKET_PAGES } from "@/lib/locations/markets";
import { NEIGHBORHOOD_PAGES } from "@/lib/locations/neighborhoods";
import { CURRENT_MARKET_REPORT } from "@/lib/market/reports";
import { buildUrlSet, xmlResponse, type XmlSitemapEntry } from "@/lib/seo/xml-sitemap";

export const revalidate = 3600;

export async function GET() {
  const lastModified = new Date();
  const cityEntries: XmlSitemapEntry[] = PRIMARY_MARKET_PAGES.flatMap((market) => [
    {
      url: `${SITE_CONFIG.baseUrl}/locations/${market.slug}`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.85
    },
    {
      url: `${SITE_CONFIG.baseUrl}/locations/${market.slug}/market`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.78
    },
    {
      url: `${SITE_CONFIG.baseUrl}/market-reports/${market.slug}/${CURRENT_MARKET_REPORT.slug}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.72
    }
  ]);

  const neighborhoodEntries: XmlSitemapEntry[] = NEIGHBORHOOD_PAGES.map((neighborhood) => ({
    url: `${SITE_CONFIG.baseUrl}/locations/${slugify(neighborhood.city)}/${neighborhood.slug}`,
    lastModified,
    changeFrequency: "daily",
    priority: 0.75
  }));

  return xmlResponse(buildUrlSet([...cityEntries, ...neighborhoodEntries]));
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
