import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyListingFilters } from "@/lib/listings/filters";
import type { Listing } from "@/types/listing";

const baseListing: Listing = {
  id: "base",
  mlsNumber: "N00000000",
  title: "Detached in Vaughan",
  price: 1200000,
  city: "Vaughan",
  area: "Vaughan",
  address: "1 Test Street",
  bedrooms: 4,
  bathrooms: 3,
  propertyType: "Detached",
  transactionType: "sale",
  description: "Test listing",
  images: ["https://example.com/photo.jpg"],
  isPubliclyAdvertisable: true,
  status: "active",
  listingUrlSlug: "test-listing",
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z"
};

describe("neighbourhood listing filter", () => {
  it("matches listings by the configured Vaughan neighbourhood aliases", () => {
    const listings: Listing[] = [
      {
        ...baseListing,
        id: "patterson",
        area: "Patterson",
        address: "58 Lady Loretta Lane"
      },
      {
        ...baseListing,
        id: "woodbridge",
        area: "East Woodbridge",
        address: "10 Market Lane"
      }
    ];

    const filtered = applyListingFilters(listings, {
      city: "Vaughan",
      transactionType: "sale",
      neighborhoodSlug: "patterson"
    });

    assert.deepEqual(
      filtered.map((listing) => listing.id),
      ["patterson"]
    );
  });
});
