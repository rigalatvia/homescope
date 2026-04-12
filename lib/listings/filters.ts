import type { Listing, ListingFilters, PaginatedListings, PropertyType } from "@/types/listing";
import { DEFAULT_LISTINGS_PAGE_SIZE } from "@/config/listings";

export function parseListingFilters(params: {
  city?: string;
  transactionType?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  bathrooms?: string;
  propertyType?: string;
  page?: string;
  pageSize?: string;
}): ListingFilters {
  return {
    city: params.city || undefined,
    transactionType: parseTransactionType(params.transactionType),
    minPrice: parseNumber(params.minPrice),
    maxPrice: parseNumber(params.maxPrice),
    bedrooms: parseNumber(params.bedrooms),
    bathrooms: parseNumber(params.bathrooms),
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
    if (filters.bedrooms && listing.bedrooms < filters.bedrooms) return false;
    if (filters.bathrooms && listing.bathrooms < filters.bathrooms) return false;
    if (filters.propertyType && listing.propertyType !== filters.propertyType) return false;
    return true;
  });
}

function parseTransactionType(value?: string): ListingFilters["transactionType"] | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "sale" || normalized === "lease") return normalized;
  return undefined;
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
