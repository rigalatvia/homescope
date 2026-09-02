import { SITE_CONFIG } from "@/config/site";
import { getSchools } from "@/lib/schools/service";
import { buildUrlSet, xmlResponse, type XmlSitemapEntry } from "@/lib/seo/xml-sitemap";

export const revalidate = 3600;

export async function GET() {
  const schools = await getSchools();
  const lastModified = new Date();
  const uniqueSchools = Array.from(new Map(schools.map((school) => [school.slug, school])).values());
  const entries: XmlSitemapEntry[] = [
    {
      url: `${SITE_CONFIG.baseUrl}/schools`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9
    },
    ...uniqueSchools.map((school) => ({
      url: `${SITE_CONFIG.baseUrl}/schools/${school.slug}`,
      lastModified: school.updatedAt || school.rankingUpdatedAt || school.geocodedAt || lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.82
    }))
  ];

  return xmlResponse(buildUrlSet(entries));
}
