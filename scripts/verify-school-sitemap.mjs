const baseUrl = (process.argv[2] || process.env.SITEMAP_VERIFY_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const canonicalOrigin = "https://homescopegta.ca";

const sitemapResponse = await fetch(`${baseUrl}/sitemap-schools.xml`);
if (!sitemapResponse.ok) throw new Error(`School sitemap returned ${sitemapResponse.status}.`);
const sitemapXml = await sitemapResponse.text();
const sitemapUrls = new Set(
  [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => decodeXml(match[1]))
    .filter((url) => url.startsWith(`${canonicalOrigin}/schools/`))
);
const invalidSitemapUrls = [...sitemapUrls].filter((url) => {
  const parsed = new URL(url);
  return parsed.origin !== canonicalOrigin || parsed.search || parsed.hash || !/^\/schools\/[^/]+$/.test(parsed.pathname);
});

const directoryUrls = new Set();
let page = 1;
let pagesCrawled = 0;
while (page <= 100) {
  const directoryUrl = page === 1 ? `${baseUrl}/schools` : `${baseUrl}/schools?schoolPage=${page}`;
  const response = await fetch(directoryUrl);
  if (!response.ok) throw new Error(`School directory page ${page} returned ${response.status}.`);
  const html = await response.text();
  const beforeCount = directoryUrls.size;
  for (const match of html.matchAll(/href="(\/schools\/[^"?#]+)(?:\?[^"#]*)?"/g)) {
    directoryUrls.add(`${canonicalOrigin}${decodeXml(match[1])}`);
  }
  if (directoryUrls.size === beforeCount) break;
  pagesCrawled += 1;
  page += 1;
}
if (page > 100) throw new Error("Directory crawl exceeded the 100-page safety limit.");

const missingFromSitemap = [...directoryUrls].filter((url) => !sitemapUrls.has(url)).sort();
const notInDirectory = [...sitemapUrls].filter((url) => !directoryUrls.has(url)).sort();

console.log(`Directory pages crawled: ${pagesCrawled}`);
console.log(`School detail URLs in directory: ${directoryUrls.size}`);
console.log(`School detail URLs in sitemap: ${sitemapUrls.size}`);
console.log(`Missing from sitemap: ${missingFromSitemap.length}`);
for (const url of missingFromSitemap) console.log(`  MISSING ${url}`);
console.log(`Sitemap URLs not found in directory crawl: ${notInDirectory.length}`);
for (const url of notInDirectory) console.log(`  EXTRA ${url}`);
console.log(`Invalid or parameterized sitemap URLs: ${invalidSitemapUrls.length}`);
for (const url of invalidSitemapUrls) console.log(`  INVALID ${url}`);

if (!sitemapXml.includes(`<loc>${canonicalOrigin}/schools</loc>`)) throw new Error("The /schools URL is missing.");
if (sitemapUrls.size >= 50_000) throw new Error("School sitemap exceeds Google's 50,000 URL limit.");
if (missingFromSitemap.length || notInDirectory.length || invalidSitemapUrls.length) process.exitCode = 1;

function decodeXml(value) {
  return value.replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&apos;", "'");
}
