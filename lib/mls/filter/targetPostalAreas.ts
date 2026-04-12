import type { RawMLSFeedListing } from "@/lib/mls/types";

const TARGET_POSTAL_PREFIXES = {
  Toronto: ["M"],
  Vaughan: ["L4H", "L4J", "L4K", "L4L", "L4B"],
  "Richmond Hill": ["L4C", "L4E", "L4S", "L4B"],
  King: ["L7B", "L0G"],
  Aurora: ["L4G"],
  Newmarket: ["L3X", "L3Y"]
} as const;

function normalizePostalCode(input: string | null | undefined): string {
  return (input || "").trim().toUpperCase().replace(/\s+/g, "");
}

export function getTargetAreaByPostalCode(postalCode: string | null | undefined): string | null {
  const normalized = normalizePostalCode(postalCode);
  if (!normalized) return null;

  for (const [area, prefixes] of Object.entries(TARGET_POSTAL_PREFIXES)) {
    if (prefixes.some((prefix) => normalized.startsWith(prefix))) {
      return area;
    }
  }

  return null;
}

export function isTargetPostalCode(postalCode: string | null | undefined): boolean {
  return getTargetAreaByPostalCode(postalCode) !== null;
}

export function filterRawListingsByTargetPostalAreas(rawListings: RawMLSFeedListing[]): {
  included: RawMLSFeedListing[];
  excludedCount: number;
} {
  const included = rawListings.filter((listing) => isTargetPostalCode(listing.address?.postalCode));
  return { included, excludedCount: rawListings.length - included.length };
}
