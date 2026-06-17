import { SITE_CONFIG } from "@/config/site";
import { getAllPublicListings } from "@/lib/listings/service";
import { buildUrlSet, xmlResponse, type XmlSitemapEntry } from "@/lib/seo/xml-sitemap";

export const dynamic = "force-dynamic";

export async function GET() {
  const listings = await getAllPublicListings();
  const entries: XmlSitemapEntry[] = listings.map((listing) => ({
    url: `${SITE_CONFIG.baseUrl}/listings/${listing.listingUrlSlug}`,
    lastModified: listing.updatedAt,
    changeFrequency: "daily",
    priority: 0.65
  }));

  return xmlResponse(buildUrlSet(entries));
}
