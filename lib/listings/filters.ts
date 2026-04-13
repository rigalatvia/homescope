import type { Listing, ListingFilters, ListingSort, PaginatedListings, PropertyType } from "@/types/listing";
import { DEFAULT_LISTINGS_PAGE_SIZE } from "@/config/listings";

export function parseListingFilters(params: {
  city?: string;
  transactionType?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  bathrooms?: string;
  propertyType?: string;
  page?: string;
  pageSize?: string;
}): ListingFilters {
  const bedrooms = parseCountFilter(params.bedrooms);
  const bathrooms = parseCountFilter(params.bathrooms);

  return {
    city: params.city || undefined,
    transactionType: parseTransactionType(params.transactionType),
    sort: parseSort(params.sort),
    minPrice: parseNumber(params.minPrice),
    maxPrice: parseNumber(params.maxPrice),
    bedrooms: bedrooms.value,
    bedroomsMatch: bedrooms.match,
    bathrooms: bathrooms.value,
    bathroomsMatch: bathrooms.match,
    propertyType: (params.propertyType as PropertyType) || undefined,
    page: parseNumber(params.page) || 1,
    pageSize: parseNumber(params.pageSize) || DEFAULT_LISTINGS_PAGE_SIZE
  };
}

export function applyListingFilters(listings: Listing[], filters: ListingFilters): Listing[] {
  return listings.filter((listing) => {
    if (filters.city && listing.city !== filters.city) return false;
    if (filters.transactionType && listing.transactionType !== filters.transactionType) return false;
    if (filters.minPrice && listing.price < filters.minPrice) return false;
    if (filters.maxPrice && listing.price > filters.maxPrice) return false;
    if (filters.bedrooms) {
      if (filters.bedroomsMatch === "exact" && listing.bedrooms !== filters.bedrooms) return false;
      if (filters.bedroomsMatch !== "exact" && listing.bedrooms < filters.bedrooms) return false;
    }
    if (filters.bathrooms) {
      if (filters.bathroomsMatch === "exact" && listing.bathrooms !== filters.bathrooms) return false;
      if (filters.bathroomsMatch !== "exact" && listing.bathrooms < filters.bathrooms) return false;
    }
    if (
      filters.propertyType &&
      listing.propertyType.trim().toLowerCase() !== filters.propertyType.trim().toLowerCase()
    ) {
      return false;
    }
    return true;
  });
}

function parseTransactionType(value?: string): ListingFilters["transactionType"] | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "sale" || normalized === "lease") return normalized;
  return undefined;
}

function parseSort(value?: string): ListingSort {
  if (!value) return "price_asc";
  const normalized = value.trim().toLowerCase();
  if (normalized === "price_desc") return "price_desc";
  if (normalized === "newest") return "newest";
  return "price_asc";
}

export function paginateListings(listings: Listing[], filters: ListingFilters): PaginatedListings {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : DEFAULT_LISTINGS_PAGE_SIZE;
  const total = listings.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const items = listings.slice(start, start + pageSize);

  return {
    items,
    total,
    page: safePage,
    pageSize,
    totalPages
  };
}

function parseNumber(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseCountFilter(value?: string): {
  value?: number;
  match?: "exact" | "atLeast";
} {
  if (!value) return {};
  const normalized = value.trim();
  if (!normalized) return {};

  const isAtLeast = normalized.endsWith("+");
  const numeric = isAtLeast ? normalized.slice(0, -1) : normalized;
  const parsed = Number(numeric);
  if (!Number.isFinite(parsed) || parsed <= 0) return {};

  return {
    value: parsed,
    match: isAtLeast ? "atLeast" : "exact"
  };
}
