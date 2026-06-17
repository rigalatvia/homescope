import { SITE_CONFIG } from "@/config/site";

export interface XmlSitemapEntry {
  url: string;
  lastModified: Date | string;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

export function buildSitemapIndex(paths: string[]): string {
  const now = new Date().toISOString();
  const entries = paths
    .map(
      (path) => `<sitemap><loc>${escapeXml(`${SITE_CONFIG.baseUrl}${path}`)}</loc><lastmod>${now}</lastmod></sitemap>`
    )
    .join("");

  return xmlResponseBody(`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</sitemapindex>`);
}

export function buildUrlSet(entries: XmlSitemapEntry[]): string {
  const body = entries
    .map((entry) => {
      const lastmod = toIsoDate(entry.lastModified);
      const changefreq = entry.changeFrequency ? `<changefreq>${entry.changeFrequency}</changefreq>` : "";
      const priority = typeof entry.priority === "number" ? `<priority>${entry.priority.toFixed(2)}</priority>` : "";

      return `<url><loc>${escapeXml(entry.url)}</loc><lastmod>${lastmod}</lastmod>${changefreq}${priority}</url>`;
    })
    .join("");

  return xmlResponseBody(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`);
}

export function xmlResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600"
    }
  });
}

function xmlResponseBody(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>${body}`;
}

function toIsoDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
