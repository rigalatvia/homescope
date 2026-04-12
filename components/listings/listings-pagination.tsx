import Link from "next/link";
import type { ListingFilters } from "@/types/listing";

interface ListingsPaginationProps {
  page: number;
  totalPages: number;
  filters: ListingFilters;
}

export function ListingsPagination({ page, totalPages, filters }: ListingsPaginationProps) {
  if (totalPages <= 1) return null;

  const prev = page > 1 ? buildUrl(page - 1, filters) : null;
  const next = page < totalPages ? buildUrl(page + 1, filters) : null;

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3">
      {prev ? (
        <Link href={prev} className="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900 hover:border-brand-400">
          Previous
        </Link>
      ) : (
        <span className="rounded-full border border-brand-100 px-4 py-2 text-sm text-brand-400">Previous</span>
      )}
      <span className="text-sm font-semibold text-brand-700">
        Page {page} of {totalPages}
      </span>
      {next ? (
        <Link href={next} className="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900 hover:border-brand-400">
          Next
        </Link>
      ) : (
        <span className="rounded-full border border-brand-100 px-4 py-2 text-sm text-brand-400">Next</span>
      )}
    </nav>
  );
}

function buildUrl(page: number, filters: ListingFilters): string {
  const params = new URLSearchParams();
  if (filters.city) params.set("city", filters.city);
  if (filters.transactionType) params.set("transactionType", filters.transactionType);
  if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  if (filters.bedrooms) params.set("bedrooms", String(filters.bedrooms));
  if (filters.bathrooms) params.set("bathrooms", String(filters.bathrooms));
  if (filters.propertyType) params.set("propertyType", filters.propertyType);
  params.set("page", String(page));
  return `/listings?${params.toString()}`;
}
