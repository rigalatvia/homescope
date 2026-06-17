import { SITE_CONFIG } from "@/config/site";
import { getTopRankedYorkRegionSchools } from "@/lib/schools/service";
import { buildUrlSet, xmlResponse, type XmlSitemapEntry } from "@/lib/seo/xml-sitemap";

export const dynamic = "force-dynamic";

export async function GET() {
  const schools = await getTopRankedYorkRegionSchools(50);
  const lastModified = new Date();
  const entries: XmlSitemapEntry[] = [
    {
      url: `${SITE_CONFIG.baseUrl}/schools`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9
    },
    ...schools.map((school) => ({
      url: `${SITE_CONFIG.baseUrl}/schools/${school.slug}`,
      lastModified: school.rankingUpdatedAt || lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.82
    }))
  ];

  return xmlResponse(buildUrlSet(entries));
}
