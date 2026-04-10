import Link from "next/link";
import { SITE_CONFIG } from "@/config/site";
import { formatPrice } from "@/lib/utils/format";
import type { ListingFilters, PropertyType } from "@/types/listing";

const PROPERTY_TYPES: PropertyType[] = ["Detached", "Semi-Detached", "Townhouse", "Condo", "Condo Townhouse"];

interface ListingFiltersProps {
  filters: ListingFilters;
}

export function ListingFilters({ filters }: ListingFiltersProps) {
  const chips = buildFilterChips(filters);

  return (
    <div className="space-y-4 rounded-2xl border border-brand-100 bg-white p-4 shadow-soft">
      <form className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        <FilterLabel label="City">
          <select name="city" defaultValue={filters.city || ""} className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm">
            <option value="">All Cities</option>
            {SITE_CONFIG.primaryMarkets.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </FilterLabel>

        <FilterLabel label="Min Price">
          <input
            type="number"
            name="minPrice"
            defaultValue={filters.minPrice || ""}
            placeholder="500000"
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
          />
        </FilterLabel>

        <FilterLabel label="Max Price">
          <input
            type="number"
            name="maxPrice"
            defaultValue={filters.maxPrice || ""}
            placeholder="2000000"
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
          />
        </FilterLabel>

        <FilterLabel label="Bedrooms">
          <input
            type="number"
            name="bedrooms"
            min={1}
            defaultValue={filters.bedrooms || ""}
            placeholder="2"
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
          />
        </FilterLabel>

        <FilterLabel label="Bathrooms">
          <input
            type="number"
            name="bathrooms"
            min={1}
            defaultValue={filters.bathrooms || ""}
            placeholder="2"
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
          />
        </FilterLabel>

        <FilterLabel label="Property Type">
          <select
            name="propertyType"
            defaultValue={filters.propertyType || ""}
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </FilterLabel>

        <div className="flex items-end gap-2 md:col-span-3 lg:col-span-6">
          <button
            type="submit"
            className="rounded-full bg-brand-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Apply Filters
          </button>
          <Link
            href="/listings"
            className="rounded-full border border-brand-200 px-5 py-2 text-sm font-semibold text-brand-800 transition hover:border-brand-400"
          >
            Clear filters
          </Link>
        </div>
      </form>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-brand-100 pt-3">
          {chips.map((chip) => (
            <span key={chip.label} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
              {chip.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

function buildFilterChips(filters: ListingFilters): { label: string }[] {
  const chips: { label: string }[] = [];

  if (filters.city) chips.push({ label: `City: ${filters.city}` });
  if (filters.minPrice) chips.push({ label: `Min: ${formatPrice(filters.minPrice)}` });
  if (filters.maxPrice) chips.push({ label: `Max: ${formatPrice(filters.maxPrice)}` });
  if (filters.bedrooms) chips.push({ label: `${filters.bedrooms}+ Beds` });
  if (filters.bathrooms) chips.push({ label: `${filters.bathrooms}+ Baths` });
  if (filters.propertyType) chips.push({ label: `Type: ${filters.propertyType}` });

  return chips;
}
