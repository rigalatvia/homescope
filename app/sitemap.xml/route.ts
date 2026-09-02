import { buildSitemapIndex, xmlResponse } from "@/lib/seo/xml-sitemap";

export const revalidate = 3600;

const SITEMAP_PATHS = [
  "/sitemap-listings.xml",
  "/sitemap-guides.xml",
  "/sitemap-locations.xml",
  "/sitemap-schools.xml"
];

export async function GET() {
  return xmlResponse(buildSitemapIndex(SITEMAP_PATHS));
}
