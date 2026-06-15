export interface ListingMetadataInput {
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  price?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  propertyType?: string | null;
  listingUrlSlug: string;
  primaryImage?: string | null;
  description?: string | null;
}

const BRAND_SUFFIX = " | HomeScope GTA";
const MAX_UNIQUE_TITLE_LENGTH = 60;

export function buildListingMetadata(input: ListingMetadataInput, baseUrl: string) {
  const address = formatListingAddress(input.address, input.city);
  const fullAddress = formatListingAddress(input.address, input.city, input.postalCode);
  const price = formatCurrency(input.price);
  const beds = formatBedrooms(input.bedrooms);
  const baths = formatBathrooms(input.bathrooms);
  const propertyType = cleanText(input.propertyType) || "Home";
  const titleBase = `${address} – ${price} | ${beds} Bed ${propertyType}`;
  const title = titleBase.length <= MAX_UNIQUE_TITLE_LENGTH ? `${titleBase}${BRAND_SUFFIX}` : titleBase;
  const description = `${fullAddress}. ${price}, ${beds} bed, ${baths} bath ${propertyType}. View photos, listing details, and request a private showing.`;
  const url = `${baseUrl}/listings/${input.listingUrlSlug}`;
  const image = input.primaryImage ? `${input.primaryImage}?auto=format&fit=crop&w=1200&q=80` : undefined;

  return {
    title,
    description,
    canonicalUrl: url,
    openGraph: {
      title,
      description,
      url,
      image
    },
    twitter: {
      title,
      description,
      image
    }
  };
}

export function formatListingAddress(address?: string | null, city?: string | null, postalCode?: string | null): string {
  const streetAddress = cleanText(address) || "GTA Home";
  const cleanedCity = cleanText(city);
  const cleanedPostalCode = cleanText(postalCode);
  const parts = [streetAddress];

  if (cleanedCity && !containsWholePhrase(streetAddress, cleanedCity)) {
    parts.push(cleanedCity);
  }

  if (cleanedPostalCode) {
    parts.push(cleanedPostalCode);
  }

  return parts.join(", ");
}

function formatCurrency(value?: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "Price available";

  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatBedrooms(value?: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return "0";
  return String(value);
}

function formatBathrooms(value?: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return "0";
  return String(value);
}

function cleanText(value?: string | null): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function containsWholePhrase(value: string, phrase: string): boolean {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(value);
}
