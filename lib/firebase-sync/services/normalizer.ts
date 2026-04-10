import { computeVisibility } from "@/lib/firebase-sync/services/eligibility";
import { computeRawSourceHash } from "@/lib/firebase-sync/services/hash";
import { mapPublicImages } from "@/lib/firebase-sync/services/media";
import { generateListingSlug } from "@/lib/firebase-sync/services/slug";
import type { ListingStatus, NormalizedListing, RawFeedListingPayload } from "@/types/firebase-sync";

export function normalizeRawListing(raw: RawFeedListingPayload, nowIso: string): NormalizedListing {
  const base: NormalizedListing = {
    listingId: `${raw.sourceSystem}:${raw.sourceListingKey}`,
    mlsNumber: raw.mlsNumber?.trim() || null,
    sourceSystem: raw.sourceSystem,
    sourceListingKey: raw.sourceListingKey,
    propertyClass: (raw.propertyClass?.trim() as NormalizedListing["propertyClass"]) || null,
    transactionType: raw.transactionType?.trim() || null,
    permToAdvertise: parsePermToAdvertise(raw.permToAdvertise),
    municipality: (raw.municipality?.trim() as NormalizedListing["municipality"]) || null,
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
    images: mapPublicImages(raw),
    coordinates: {
      latitude: raw.coordinates?.latitude ?? null,
      longitude: raw.coordinates?.longitude ?? null
    },
    brokerageName: raw.brokerageName?.trim() || null,
    status: parseStatus(raw.status),
    sourceUpdatedAt: raw.sourceUpdatedAt || null,
    syncedAt: nowIso,
    isVisible: false,
    hiddenReason: null,
    slug: generateListingSlug({
      streetNumber: raw.address?.streetNumber,
      streetName: raw.address?.streetName,
      municipality: raw.municipality,
      mlsNumber: raw.mlsNumber
    }),
    badges: [],
    rawSourceHash: computeRawSourceHash(raw)
  };

  const visibility = computeVisibility(base);
  base.isVisible = visibility.isVisible;
  base.hiddenReason = visibility.hiddenReason;
  base.badges = computeBadges(base);

  return base;
}

function parsePermToAdvertise(value: RawFeedListingPayload["permToAdvertise"]): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.trim().toLowerCase() === "yes";
  return false;
}

function parseStatus(value: string | null | undefined): ListingStatus {
  const normalized = (value || "").trim().toLowerCase();
  if (normalized.includes("active")) return "active";
  if (normalized.includes("sold")) return "sold";
  if (normalized.includes("leased")) return "leased";
  if (normalized.includes("suspend")) return "suspended";
  if (normalized.includes("expire")) return "expired";
  if (normalized.includes("terminat")) return "terminated";
  return "draft";
}

function parseNullableNumber(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function computeBadges(listing: NormalizedListing): string[] {
  const badges: string[] = [];
  if (listing.status === "active" && listing.price != null && listing.price > 1500000) badges.push("Premium");
  if (listing.images.length >= 5) badges.push("Photo Rich");
  return badges;
}
