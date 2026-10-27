import { SITE_CONFIG } from "@/config/site";
import { getListingSitemapRows } from "@/lib/listings/sitemap-data";
import { buildUrlSet, xmlResponse, type XmlSitemapEntry } from "@/lib/seo/xml-sitemap";

export const revalidate = 3600;

export async function GET() {
  const listings = await getListingSitemapRows();
  const entries: XmlSitemapEntry[] = listings.map((listing) => ({
    url: `${SITE_CONFIG.baseUrl}/listings/${listing.listingUrlSlug}`,
    lastModified: listing.updatedAt,
    changeFrequency: "daily",
    priority: 0.65
  }));

  return xmlResponse(buildUrlSet(entries));
}
