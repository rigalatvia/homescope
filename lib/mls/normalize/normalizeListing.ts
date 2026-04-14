import { computeVisibility } from "@/lib/mls/filter/visibility";
import type { MLSListingStatus, NormalizedMLSListing, RawMLSFeedListing } from "@/lib/mls/types";
import { computeRawListingHash } from "@/lib/mls/utils/hash";
import { createListingSlug } from "@/lib/mls/utils/slug";

export function normalizeListing(raw: RawMLSFeedListing, syncedAt: string): NormalizedMLSListing {
  const transactionType = raw.transactionType?.trim() || null;
  const propertyType = deriveOwnershipType(raw.commonInterest, raw.propertyClass, raw.propertyType);
  const commonInterest = raw.commonInterest?.trim() || null;
  const style = raw.style?.trim() || null;
  const publicRemarks = raw.publicRemarks?.trim() || null;
  const propertyClass = derivePropertyClass(raw.propertyClass, transactionType, propertyType, style, publicRemarks);

  const normalized: NormalizedMLSListing = {
    listingId: `${raw.sourceSystem}:${raw.sourceListingKey}`,
    mlsNumber: raw.mlsNumber?.trim() || null,
    listAgentNationalAssociationId: raw.listAgentNationalAssociationId?.trim() || null,
    sourceSystem: raw.sourceSystem,
    sourceListingKey: raw.sourceListingKey,
    propertyClass,
    transactionType,
    permToAdvertise: parsePermToAdvertise(raw.permToAdvertise),
    municipality: parseMunicipality(raw.municipality),
    area: raw.area?.trim() || null,
    address: {
      streetNumber: raw.address?.streetNumber?.trim() || null,
      streetName: raw.address?.streetName?.trim() || null,
      unit: raw.address?.unit?.trim() || null,
      fullAddress: raw.address?.fullAddress?.trim() || null,
      postalCode: normalizePostalCode(raw.address?.postalCode)
    },
    price: parseDisplayPrice(raw, transactionType),
    bedrooms: parseNullableNumber(raw.bedrooms),
    bathrooms: parseNullableNumber(raw.bathrooms),
    propertyType,
    commonInterest,
    style,
    publicRemarks,
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

function derivePropertyClass(
  rawPropertyClass: string | null | undefined,
  transactionType: string | null,
  propertyType: string | null,
  style: string | null,
  publicRemarks: string | null
): NormalizedMLSListing["propertyClass"] {
  const normalizedRaw = (rawPropertyClass || "").trim().toLowerCase();
  if (containsCommercialKeywords(normalizedRaw)) return null;

  if (normalizedRaw.includes("residential freehold lease")) return "Residential Freehold Lease";
  if (normalizedRaw.includes("residential freehold")) return "Residential Freehold";
  if (normalizedRaw.includes("residential condo")) {
    if (normalizedRaw.includes("lease")) return "Residential Condo & Other Lease";
    return "Residential Condo & Other";
  }
  if (normalizedRaw.includes("condo")) {
    if (normalizedRaw.includes("lease")) return "Residential Condo & Other Lease";
    return "Residential Condo & Other";
  }
  if (normalizedRaw.includes("freehold")) {
    if (normalizedRaw.includes("lease")) return "Residential Freehold Lease";
    return "Residential Freehold";
  }
  if (/\bsingle[-\s]family\b/.test(normalizedRaw)) {
    if (normalizedRaw.includes("lease")) return "Residential Freehold Lease";
    return "Residential Freehold";
  }
  if (/\bmulti[-\s]family\b/.test(normalizedRaw)) {
    if (normalizedRaw.includes("lease")) return "Residential Freehold Lease";
    return "Residential Freehold";
  }

  const text = [rawPropertyClass, transactionType, propertyType, style, publicRemarks].filter(Boolean).join(" ").toLowerCase();
  if (containsCommercialKeywords(text)) return null;

  const isLease = /\blease\b|\brent\b|\bfor rent\b|\bleased\b/.test(text);
  const looksCondo = /\bcondo\b|\bapartment\b|\bcondominium\b|\bapt\b|\bco-op\b/.test(text);
  const looksFreehold =
    /\bdetached\b|\bsemi-detached\b|\btownhouse\b|\btownhome\b|\blink\b|\bfreehold\b|\btriplex\b|\bduplex\b|\bfourplex\b|\bsingle[-\s]family\b|\bhouse\b|\bmulti[-\s]family\b/.test(
      text
    );
  const looksResidential = /\bresidential\b|\bsingle family\b/.test(text) || looksCondo || looksFreehold;

  if (!looksResidential) return null;

  if (looksCondo) return isLease ? "Residential Condo & Other Lease" : "Residential Condo & Other";
  if (looksFreehold) return isLease ? "Residential Freehold Lease" : "Residential Freehold";
  return null;
}

function containsCommercialKeywords(input: string): boolean {
  if (!input.trim()) return false;
  return (
    /\bcommercial\b|\bindustrial\b|\boffice\b|\bretail\b|\bplaza\b|\bstorefront\b|\bwarehouse\b|\bbusiness\b|\bagricultural\b|\binvestment\b/.test(
      input
    ) && !/\bresidential\b/.test(input)
  );
}

function parsePermToAdvertise(value: RawMLSFeedListing["permToAdvertise"]): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.trim().toLowerCase() === "yes";
  return false;
}

function parseMunicipality(value: string | null | undefined): NormalizedMLSListing["municipality"] {
  const normalized = normalizeMunicipalityInput(value);
  if (!normalized) return null;
  if (normalized.startsWith("toronto")) return "Toronto";
  if (normalized.startsWith("vaughan")) return "Vaughan";
  if (normalized.startsWith("richmond hill")) return "Richmond Hill";
  if (normalized.startsWith("newmarket")) return "Newmarket";
  if (normalized.startsWith("aurora")) return "Aurora";
  if (normalized.startsWith("king")) return "King";
  return null;
}

function normalizeMunicipalityInput(value: string | null | undefined): string {
  const base = (value || "").trim().toLowerCase();
  if (!base) return "";
  const withoutParens = base.split("(")[0]?.trim() || base;
  return withoutParens.replace(/^city of\s+/, "").trim();
}

function normalizePostalCode(value: string | null | undefined): string | null {
  const normalized = (value || "").trim().toUpperCase().replace(/\s+/g, "");
  return normalized || null;
}

function parseNullableNumber(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDisplayPrice(raw: RawMLSFeedListing, transactionType: string | null): number | null {
  const listPrice = parseNullableNumber(raw.listPrice);
  const totalActualRent = parseNullableNumber(raw.totalActualRent);

  if (transactionType === "lease") {
    if (totalActualRent != null) return totalActualRent;
    if (listPrice != null) return listPrice;
    return null;
  }

  if (transactionType === "sale") {
    if (listPrice != null) return listPrice;
    if (totalActualRent != null) return totalActualRent;
    return null;
  }

  if (listPrice != null) return listPrice;
  if (totalActualRent != null) return totalActualRent;
  return null;
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

function deriveOwnershipType(
  commonInterest: string | null | undefined,
  rawPropertyClass: string | null | undefined,
  rawPropertyType: string | null | undefined
): string | null {
  const common = (commonInterest || "").trim().toLowerCase();
  if (common.includes("condo") || common.includes("strata")) return "Condo";
  if (common.includes("freehold")) return "Freehold";

  const propertyClass = (rawPropertyClass || "").trim().toLowerCase();
  if (propertyClass.includes("condo")) return "Condo";
  if (propertyClass.includes("freehold")) return "Freehold";

  const propertyType = (rawPropertyType || "").trim().toLowerCase();
  if (propertyType.includes("condo")) return "Condo";
  if (propertyType.includes("detached") || propertyType.includes("semi") || propertyType.includes("townhouse")) {
    return "Freehold";
  }

  return null;
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
