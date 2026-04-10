import { computeVisibility } from "@/lib/mls/filter/visibility";
import type { MLSListingStatus, NormalizedMLSListing, RawMLSFeedListing } from "@/lib/mls/types";
import { computeRawListingHash } from "@/lib/mls/utils/hash";
import { createListingSlug } from "@/lib/mls/utils/slug";

export function normalizeListing(raw: RawMLSFeedListing, syncedAt: string): NormalizedMLSListing {
  const normalized: NormalizedMLSListing = {
    listingId: `${raw.sourceSystem}:${raw.sourceListingKey}`,
    mlsNumber: raw.mlsNumber?.trim() || null,
    sourceSystem: raw.sourceSystem,
    sourceListingKey: raw.sourceListingKey,
    propertyClass: (raw.propertyClass?.trim() as NormalizedMLSListing["propertyClass"]) || null,
    transactionType: raw.transactionType?.trim() || null,
    permToAdvertise: parsePermToAdvertise(raw.permToAdvertise),
    municipality: (raw.municipality?.trim() as NormalizedMLSListing["municipality"]) || null,
    area: raw.area?.trim() || null,
    address: {
      streetNumber: raw.address?.streetNumber?.trim() || null,
      streetName: raw.address?.streetName?.trim() || null,
      unit: raw.address?.unit?.trim() || null,
      fullAddress: raw.address?.fullAddress?.trim() || null,
      postalCode: raw.address?.postalCode?.trim() || null
    },
    price: parseNullableNumber(raw.listPrice),
    bedrooms: parseNullableNumber(raw.bedrooms),
    bathrooms: parseNullableNumber(raw.bathrooms),
    propertyType: raw.propertyType?.trim() || null,
    style: raw.style?.trim() || null,
    publicRemarks: raw.publicRemarks?.trim() || null,
    images: mapImageUrls(raw),
    coordinates: {
      latitude: raw.coordinates?.latitude ?? null,
      longitude: raw.coordinates?.longitude ?? null
    },
    brokerageName: raw.brokerageName?.trim() || null,
    status: parseListingStatus(raw.status),
    sourceUpdatedAt: raw.sourceUpdatedAt || null,
    syncedAt,
    isVisible: false,
    hiddenReason: null,
    slug: createListingSlug({
      streetNumber: raw.address?.streetNumber,
      streetName: raw.address?.streetName,
      municipality: raw.municipality,
      mlsNumber: raw.mlsNumber
    }),
    badges: [],
    rawSourceHash: computeRawListingHash(raw)
  };

  const visibility = computeVisibility(normalized);
  normalized.isVisible = visibility.isVisible;
  normalized.hiddenReason = visibility.hiddenReason;
  normalized.badges = computeBadges(normalized);

  return normalized;
}

function parsePermToAdvertise(value: RawMLSFeedListing["permToAdvertise"]): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.trim().toLowerCase() === "yes";
  return false;
}

function parseNullableNumber(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseListingStatus(value: string | null | undefined): MLSListingStatus {
  const normalized = (value || "").trim().toLowerCase();
  if (normalized.includes("active")) return "active";
  if (normalized.includes("sold")) return "sold";
  if (normalized.includes("leased")) return "leased";
  if (normalized.includes("suspend")) return "suspended";
  if (normalized.includes("expire")) return "expired";
  if (normalized.includes("terminat")) return "terminated";
  return "draft";
}

function mapImageUrls(raw: RawMLSFeedListing): string[] {
  return (raw.images ?? [])
    .filter((item) => item.type === "photo" && !!item.url)
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
    .map((item) => item.url.trim())
    .filter((url, index, list) => list.indexOf(url) === index);
}

function computeBadges(listing: NormalizedMLSListing): string[] {
  const badges: string[] = [];
  if (listing.price != null && listing.price >= 1500000) badges.push("Premium");
  if (listing.images.length >= 5) badges.push("Photo Rich");
  return badges;
}
