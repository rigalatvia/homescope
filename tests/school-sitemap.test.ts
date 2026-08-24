import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const root = process.cwd();
const schoolSitemap = readFileSync(join(root, "app/sitemap-schools.xml/route.ts"), "utf8");
const sitemapIndex = readFileSync(join(root, "app/sitemap.xml/route.ts"), "utf8");
const robots = readFileSync(join(root, "app/robots.ts"), "utf8");

describe("school sitemap generation", () => {
  it("uses the complete public directory instead of a limited ranking query", () => {
    assert.match(schoolSitemap, /await getSchools\(\)/);
    assert.doesNotMatch(schoolSitemap, /getTopRankedYorkRegionSchools|slice\(0,\s*50\)/);
  });
  it("uses clean canonical paths and real update dates", () => {
    assert.match(schoolSitemap, /\/schools\/\$\{school\.slug\}/);
    assert.match(schoolSitemap, /school\.updatedAt \|\| school\.rankingUpdatedAt \|\| school\.geocodedAt/);
  });
  it("stays referenced by the sitemap index and robots discovery", () => {
    assert.match(sitemapIndex, /\/sitemap-schools\.xml/);
    assert.match(robots, /\/sitemap\.xml/);
  });
});
