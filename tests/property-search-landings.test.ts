import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getAllPropertySearchLandings, getPropertySearchLanding } from "../lib/seo/property-search-landings";

describe("property search SEO landings", () => {
  it("creates one sale and one rental page for every primary market", () => {
    const pages = getAllPropertySearchLandings();
    assert.equal(pages.length, 12);
    assert.equal(new Set(pages.map((page) => `${page.intentSlug}/${page.citySlug}`)).size, 12);
  });

  it("uses the correct listing transaction type", () => {
    assert.equal(getPropertySearchLanding("homes-for-sale", "richmond-hill")?.transactionType, "sale");
    assert.equal(getPropertySearchLanding("homes-for-rent", "newmarket")?.transactionType, "lease");
  });

  it("rejects unsupported and duplicate-generating routes", () => {
    assert.equal(getPropertySearchLanding("rentals", "richmond-hill"), undefined);
    assert.equal(getPropertySearchLanding("homes-for-sale", "mississauga"), undefined);
  });
});
