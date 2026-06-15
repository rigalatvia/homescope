import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildListingMetadata } from "../lib/seo/listing-metadata";

const baseUrl = "https://homescopegta.ca";

describe("buildListingMetadata", () => {
  const samples = [
    {
      address: "58 Lady Loretta Lane",
      city: "Vaughan",
      price: 1320000,
      bedrooms: 4,
      bathrooms: 4,
      propertyType: "Freehold",
      listingUrlSlug: "58-lady-loretta-vaughan-patterson-n13194128"
    },
    {
      address: "1203 - 15 Yonge Street",
      city: "Toronto",
      price: 3200,
      bedrooms: 2,
      bathrooms: 2,
      propertyType: "Condo",
      listingUrlSlug: "1203-15-yonge-street-toronto-c01-c12345678"
    },
    {
      address: "77 Main Street, Aurora",
      city: "Aurora",
      price: 999000,
      bedrooms: 3,
      bathrooms: 2,
      propertyType: "Semi-Detached",
      listingUrlSlug: "77-main-street-aurora-n00000001"
    },
    {
      address: "",
      city: "Newmarket",
      price: 875000,
      bedrooms: null,
      bathrooms: null,
      propertyType: "",
      listingUrlSlug: "newmarket-home-n00000002"
    }
  ];

  for (const sample of samples) {
    it(`uses address-led title fields for ${sample.listingUrlSlug}`, () => {
      const metadata = buildListingMetadata(sample, baseUrl);
      const expectedPrice = sample.price.toLocaleString("en-CA", {
        style: "currency",
        currency: "CAD",
        maximumFractionDigits: 0
      });
      const addressToken = sample.address?.trim() || "GTA Home";
      const streetOnly = addressToken.split(",")[0];
      const cityMatches = metadata.title.match(new RegExp(sample.city, "g")) ?? [];

      assert.match(metadata.title, new RegExp(escapeRegExp(streetOnly)));
      assert.equal(cityMatches.length, 1);
      assert.match(metadata.title, new RegExp(escapeRegExp(expectedPrice)));
      assert.equal(metadata.openGraph.title, metadata.title);
      assert.equal(metadata.twitter.title, metadata.title);
      assert.equal(metadata.openGraph.url, `${baseUrl}/listings/${sample.listingUrlSlug}`);
      assert.equal(metadata.canonicalUrl, `${baseUrl}/listings/${sample.listingUrlSlug}`);
    });
  }
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
