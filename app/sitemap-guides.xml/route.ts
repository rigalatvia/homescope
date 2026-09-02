import { SITE_CONFIG } from "@/config/site";
import { buildUrlSet, xmlResponse, type XmlSitemapEntry } from "@/lib/seo/xml-sitemap";

export const revalidate = 3600;

const GUIDE_PATHS = [
  "/guides",
  "/guides/first-time-home-buyer-ontario",
  "/guides/documents-needed-buy-house-toronto",
  "/guides/land-transfer-tax-calculator-ontario",
  "/guides/mortgage-payment-calculator-ontario",
  "/guides/organize-real-estate-documents-canada",
  "/guides/rental-application-ontario",
  "/guides/buying",
  "/guides/leasing",
  "/guides/lease-documents",
  "/tools",
  "/tools/mortgage-calculator",
  "/tools/land-transfer-tax-calculator",
  "/privacy",
  "/terms"
] as const;

export async function GET() {
  const lastModified = new Date();
  const entries: XmlSitemapEntry[] = GUIDE_PATHS.map((path) => ({
    url: `${SITE_CONFIG.baseUrl}${path}`,
    lastModified,
    changeFrequency: "weekly",
    priority: path === "/guides" ? 0.8 : 0.7
  }));

  return xmlResponse(buildUrlSet(entries));
}
