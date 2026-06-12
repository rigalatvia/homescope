"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { SITE_CONFIG } from "@/config/site";
import { DEFAULT_MAX_PRICE, DEFAULT_MIN_PRICE, DEFAULT_TRANSACTION_TYPE } from "@/lib/listings/filters";
import { formatPrice } from "@/lib/utils/format";
import type { ListingFilters, ListingSort, PropertyType } from "@/types/listing";
import type { School } from "@/types/school";

const PROPERTY_TYPES: PropertyType[] = ["Condo", "Freehold"];
const COUNT_FILTER_OPTIONS = ["1", "1+", "2", "2+", "3", "3+", "4", "4+", "5", "5+"] as const;
const LEASE_MIN_PRICE = 500;
const LEASE_MAX_PRICE = 4000;
const SORT_OPTIONS: { value: ListingSort; label: string }[] = [
  { value: "distance", label: "Distance to School" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" }
];

interface ListingFiltersProps {
  filters: ListingFilters;
  schools?: School[];
}

export function ListingFilters({ filters, schools = [] }: ListingFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [cityValue, setCityValue] = useState(filters.city || "");
  const [transactionType, setTransactionType] = useState<string>(filters.transactionType || DEFAULT_TRANSACTION_TYPE);
  const [sortValue, setSortValue] = useState<ListingSort>(filters.sort || "price_asc");
  const [sortTouched, setSortTouched] = useState(false);
  const [minPrice, setMinPrice] = useState(String(filters.minPrice ?? DEFAULT_MIN_PRICE));
  const [maxPrice, setMaxPrice] = useState(String(filters.maxPrice ?? DEFAULT_MAX_PRICE));
  const citySchools = useMemo(() => filterSchoolsByCity(schools, cityValue), [cityValue, schools]);
  const schoolOptions = useMemo(
    () => citySchools.map((school) => ({ school, label: formatSchoolOptionLabel(school) })),
    [citySchools]
  );
  const selectedSchool = useMemo(
    () => schools.find((school) => school.slug === filters.schoolSlug),
    [filters.schoolSlug, schools]
  );
  const [schoolSearch, setSchoolSearch] = useState(selectedSchool ? formatSchoolOptionLabel(selectedSchool) : "");
  const [schoolSlug, setSchoolSlug] = useState(filters.schoolSlug || "");
  const chips = buildFilterChips(filters, selectedSchool);
  const formResetKey = [
    filters.city || "",
    filters.transactionType || "",
    filters.sort || "price_asc",
    filters.addressContains || "",
    filters.mlsNumber || "",
    filters.minPrice ?? "",
    filters.maxPrice ?? "",
    filters.bedrooms ? formatCountSelection(filters.bedrooms, filters.bedroomsMatch) : "",
    filters.bathrooms ? formatCountSelection(filters.bathrooms, filters.bathroomsMatch) : "",
    filters.propertyType || "",
    filters.minLatitude ?? "",
    filters.maxLatitude ?? "",
    filters.minLongitude ?? "",
    filters.maxLongitude ?? "",
    filters.schoolSlug || "",
    filters.schoolRadiusKm ?? ""
  ].join("|");
  const clearFiltersUrl = `${pathname}?transactionType=${DEFAULT_TRANSACTION_TYPE}&minPrice=${DEFAULT_MIN_PRICE}&maxPrice=${DEFAULT_MAX_PRICE}`;

  useEffect(() => {
    setCityValue(filters.city || "");
    setTransactionType(filters.transactionType || DEFAULT_TRANSACTION_TYPE);
    setSortValue(filters.sort || "price_asc");
    setSortTouched(false);
    setMinPrice(String(filters.minPrice ?? DEFAULT_MIN_PRICE));
    setMaxPrice(String(filters.maxPrice ?? DEFAULT_MAX_PRICE));
  }, [filters.city, filters.maxPrice, filters.minPrice, filters.sort, filters.transactionType]);

  useEffect(() => {
    const selectedSchool = schools.find((school) => school.slug === filters.schoolSlug);
    setSchoolSearch(selectedSchool ? formatSchoolOptionLabel(selectedSchool) : "");
    setSchoolSlug(filters.schoolSlug || "");
  }, [filters.schoolSlug, schools]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    const city = readFormValue(formData, "city");
    const transactionType = readFormValue(formData, "transactionType") || DEFAULT_TRANSACTION_TYPE;
    const rawSort = readFormValue(formData, "sort");
    const addressContains = readFormValue(formData, "addressContains");
    const mlsNumber = readFormValue(formData, "mlsNumber");
    const minPrice = readFormValue(formData, "minPrice") || String(DEFAULT_MIN_PRICE);
    const maxPrice = readFormValue(formData, "maxPrice") || String(DEFAULT_MAX_PRICE);
    const bedrooms = readFormValue(formData, "bedrooms");
    const bathrooms = readFormValue(formData, "bathrooms");
    const propertyType = readFormValue(formData, "propertyType");
    const minLatitude = readFormValue(formData, "minLatitude");
    const maxLatitude = readFormValue(formData, "maxLatitude");
    const minLongitude = readFormValue(formData, "minLongitude");
    const maxLongitude = readFormValue(formData, "maxLongitude");
    const schoolSearch = readFormValue(formData, "schoolSearch");
    const schoolSlug = resolveSubmittedSchoolSlug({
      city,
      schoolSearch,
      schoolSlug: readFormValue(formData, "schoolSlug"),
      schools
    });
    const schoolRadiusKm = readFormValue(formData, "schoolRadiusKm") || "3";
    const sort = resolveSubmittedSort(rawSort, {
      hasCurrentSchool: Boolean(filters.schoolSlug),
      hasSubmittedSchool: Boolean(schoolSlug),
      sortTouched
    });

    if (city) params.set("city", city);
    if (transactionType) params.set("transactionType", transactionType);
    if (schoolSlug) {
      params.set("sort", sort);
    } else if (sort !== "price_asc") {
      params.set("sort", sort);
    }
    if (addressContains) params.set("addressContains", addressContains);
    if (mlsNumber) params.set("mlsNumber", mlsNumber);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (bedrooms) params.set("bedrooms", bedrooms);
    if (bathrooms) params.set("bathrooms", bathrooms);
    if (propertyType) params.set("propertyType", propertyType);
    if (minLatitude) params.set("minLatitude", minLatitude);
    if (maxLatitude) params.set("maxLatitude", maxLatitude);
    if (minLongitude) params.set("minLongitude", minLongitude);
    if (maxLongitude) params.set("maxLongitude", maxLongitude);
    if (schoolSlug) {
      params.set("schoolSlug", schoolSlug);
      params.set("schoolRadiusKm", schoolRadiusKm);
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleTransactionTypeChange = (value: string) => {
    setTransactionType(value);

    if (value === "lease") {
      setMinPrice(String(LEASE_MIN_PRICE));
      setMaxPrice(String(LEASE_MAX_PRICE));
      return;
    }

    if (
      value === "sale" &&
      (minPrice === String(LEASE_MIN_PRICE) || maxPrice === String(LEASE_MAX_PRICE))
    ) {
      setMinPrice(String(DEFAULT_MIN_PRICE));
      setMaxPrice(String(DEFAULT_MAX_PRICE));
    }
  };

  const handleCityChange = (value: string) => {
    setCityValue(value);

    const selectedSchool = schools.find((school) => school.slug === schoolSlug);
    if (selectedSchool && !schoolMatchesCity(selectedSchool, value)) {
      clearSchool();
    }
  };

  const handleSchoolSearchChange = (value: string) => {
    const nextSchoolSlug = resolveSchoolSlug(citySchools, value) || "";

    setSchoolSearch(value);
    setSchoolSlug(nextSchoolSlug);

    if (nextSchoolSlug && !filters.schoolSlug && !sortTouched && sortValue === "price_asc") {
      setSortValue("distance");
    }

    if (!nextSchoolSlug && !value.trim() && sortValue === "distance") {
      setSortValue("price_asc");
      setSortTouched(true);
    }
  };

  const clearSchool = () => {
    setSchoolSearch("");
    setSchoolSlug("");
    if (sortValue === "distance") {
      setSortValue("price_asc");
      setSortTouched(true);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-brand-100 bg-white p-4 shadow-soft">
      <form key={formResetKey} onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <FilterLabel label="Address contains">
            <input
              type="text"
              name="addressContains"
              defaultValue={filters.addressContains || ""}
              placeholder="e.g. Baby Point"
              className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
            />
          </FilterLabel>

          <FilterLabel label="MLS #">
            <input
              type="text"
              name="mlsNumber"
              defaultValue={filters.mlsNumber || ""}
              placeholder="e.g. N12709208"
              className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
            />
          </FilterLabel>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <FilterLabel label="City">
          <select
            name="city"
            value={cityValue}
            onChange={(event) => handleCityChange(event.target.value)}
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
          >
            <option value="">All Cities</option>
            {SITE_CONFIG.primaryMarkets.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </FilterLabel>

        <FilterLabel label="Listing Type">
          <select
            name="transactionType"
            value={transactionType}
            onChange={(event) => handleTransactionTypeChange(event.target.value)}
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
          >
            <option value="">Sale + Lease</option>
            <option value="sale">For Sale</option>
            <option value="lease">For Lease</option>
          </select>
        </FilterLabel>

        <FilterLabel label="Sort">
          <select
            name="sort"
            value={sortValue}
            onChange={(event) => {
              setSortValue(event.target.value as ListingSort);
              setSortTouched(true);
            }}
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FilterLabel>

        <FilterLabel label="Min Price">
          <input
            type="number"
            name="minPrice"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            placeholder="500000"
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
          />
        </FilterLabel>

        <FilterLabel label="Max Price">
          <input
            type="number"
            name="maxPrice"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder="2000000"
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
          />
        </FilterLabel>

        <FilterLabel label="Bedrooms">
          <select
            name="bedrooms"
            defaultValue={formatCountSelection(filters.bedrooms, filters.bedroomsMatch)}
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
          >
            <option value="">Any</option>
            {COUNT_FILTER_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </FilterLabel>

        <FilterLabel label="Bathrooms">
          <select
            name="bathrooms"
            defaultValue={formatCountSelection(filters.bathrooms, filters.bathroomsMatch)}
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
          >
            <option value="">Any</option>
            {COUNT_FILTER_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
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
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
          <div className="space-y-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
            <span>School</span>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input
              type="text"
              name="schoolSearch"
              list="school-filter-options"
              value={schoolSearch}
              onChange={(event) => handleSchoolSearchChange(event.target.value)}
              placeholder="Type a school name, board, or city"
              className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
            />
              {(schoolSearch || schoolSlug) && (
                <button
                  type="button"
                  onClick={clearSchool}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-brand-800 transition hover:border-brand-300 hover:bg-brand-50"
                  aria-label="Clear selected school"
                  title="Clear selected school"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </div>
            <input type="hidden" name="schoolSlug" value={schoolSlug} />
            <datalist id="school-filter-options">
              {schoolOptions.map(({ school, label }) => (
                <option key={school.id} value={label} />
              ))}
            </datalist>
          </div>

          <FilterLabel label="School Radius">
            <select
              name="schoolRadiusKm"
              defaultValue={String(filters.schoolRadiusKm ?? 3)}
              className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
            >
              <option value="1">1 km</option>
              <option value="3">3 km</option>
              <option value="5">5 km</option>
              <option value="10">10 km</option>
            </select>
          </FilterLabel>
        </div>

        <input type="hidden" name="minLatitude" defaultValue={filters.minLatitude ?? ""} />
        <input type="hidden" name="maxLatitude" defaultValue={filters.maxLatitude ?? ""} />
        <input type="hidden" name="minLongitude" defaultValue={filters.minLongitude ?? ""} />
        <input type="hidden" name="maxLongitude" defaultValue={filters.maxLongitude ?? ""} />

        <div className="flex flex-wrap items-end gap-2 border-t border-brand-100 pt-3">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-full bg-brand-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-80"
          >
            {isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Searching...
              </>
            ) : (
              "Apply Filters"
            )}
          </button>
          <Link
            href={clearFiltersUrl}
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

function buildFilterChips(filters: ListingFilters, selectedSchool?: School): { label: string }[] {
  const chips: { label: string }[] = [];

  if (filters.city) chips.push({ label: `City: ${filters.city}` });
  if (filters.transactionType && filters.transactionType !== DEFAULT_TRANSACTION_TYPE) {
    chips.push({ label: filters.transactionType === "sale" ? "For Sale" : "For Lease" });
  }
  if (filters.addressContains) chips.push({ label: `Address: ${filters.addressContains}` });
  if (filters.mlsNumber) chips.push({ label: `MLS: ${filters.mlsNumber}` });
  if (filters.sort && filters.sort !== "price_asc") {
    chips.push({
      label:
        filters.sort === "distance"
          ? "Sort: Distance to School"
          : filters.sort === "price_desc"
          ? "Sort: Price High to Low"
          : filters.sort === "newest"
            ? "Sort: Newest First"
            : "Sort: Price Low to High"
    });
  }
  if (filters.minPrice && filters.minPrice !== DEFAULT_MIN_PRICE) chips.push({ label: `Min: ${formatPrice(filters.minPrice)}` });
  if (filters.maxPrice && filters.maxPrice !== DEFAULT_MAX_PRICE) chips.push({ label: `Max: ${formatPrice(filters.maxPrice)}` });
  if (filters.bedrooms) {
    chips.push({
      label: filters.bedroomsMatch === "exact" ? `${filters.bedrooms} Beds` : `${filters.bedrooms}+ Beds`
    });
  }
  if (filters.bathrooms) {
    chips.push({
      label: filters.bathroomsMatch === "exact" ? `${filters.bathrooms} Baths` : `${filters.bathrooms}+ Baths`
    });
  }
  if (filters.propertyType) chips.push({ label: `Type: ${filters.propertyType}` });
  if (filters.schoolSlug) {
    chips.push({ label: `School: ${selectedSchool?.name || formatSchoolSlug(filters.schoolSlug)}` });
    chips.push({ label: `School radius: ${filters.schoolRadiusKm ?? 3} km` });
  }
  if (hasMapBounds(filters)) chips.push({ label: "Map Area Applied" });

  return chips;
}

function formatSchoolOptionLabel(school: School): string {
  return `${school.name} - ${school.municipality} - ${school.board} (${school.level})`;
}

function resolveSubmittedSort(
  value: string,
  options: {
    hasCurrentSchool: boolean;
    hasSubmittedSchool: boolean;
    sortTouched: boolean;
  }
): ListingSort {
  const sort = parseSubmittedSort(value);

  if (!options.hasSubmittedSchool) {
    return sort === "distance" ? "price_asc" : sort;
  }

  if (!options.hasCurrentSchool && !options.sortTouched && sort === "price_asc") {
    return "distance";
  }

  return sort;
}

function parseSubmittedSort(value: string): ListingSort {
  if (value === "distance" || value === "price_desc" || value === "newest") return value;
  return "price_asc";
}

function resolveSubmittedSchoolSlug({
  city,
  schoolSearch,
  schoolSlug,
  schools
}: {
  city: string;
  schoolSearch: string;
  schoolSlug: string;
  schools: School[];
}): string {
  const selectedSchool = schools.find((school) => school.slug === schoolSlug);
  if (selectedSchool && schoolMatchesCity(selectedSchool, city)) return selectedSchool.slug;

  return resolveSchoolSlug(filterSchoolsByCity(schools, city), schoolSearch);
}

function filterSchoolsByCity(schools: School[], city: string): School[] {
  const normalizedCity = normalizeCity(city);
  if (!normalizedCity) return schools;

  return schools.filter((school) => normalizeCity(school.municipality) === normalizedCity);
}

function schoolMatchesCity(school: School, city: string): boolean {
  const normalizedCity = normalizeCity(city);
  if (!normalizedCity) return true;
  return normalizeCity(school.municipality) === normalizedCity;
}

function resolveSchoolSlug(schools: School[], value: string): string {
  const query = value.trim().toLowerCase();
  if (!query) return "";

  const exactLabelMatch = schools.find((school) => formatSchoolOptionLabel(school).toLowerCase() === query);
  if (exactLabelMatch) return exactLabelMatch.slug;

  const exactNameMatches = schools.filter((school) => school.name.trim().toLowerCase() === query);
  if (exactNameMatches.length === 1) return exactNameMatches[0]!.slug;

  const startsWithNameMatches = schools.filter((school) => school.name.trim().toLowerCase().startsWith(query));
  if (startsWithNameMatches.length === 1) return startsWithNameMatches[0]!.slug;

  const includesNameMatches = schools.filter((school) => school.name.trim().toLowerCase().includes(query));
  if (includesNameMatches.length === 1) return includesNameMatches[0]!.slug;

  return "";
}

function formatSchoolSlug(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.toUpperCase() === "PS" || part.toUpperCase() === "SS" ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCountSelection(value?: number, mode?: "exact" | "atLeast"): string {
  if (!value) return "";
  return mode === "exact" ? String(value) : `${value}+`;
}

function hasMapBounds(filters: ListingFilters): boolean {
  return (
    filters.minLatitude != null ||
    filters.maxLatitude != null ||
    filters.minLongitude != null ||
    filters.maxLongitude != null
  );
}

function readFormValue(formData: FormData, key: string): string {
  const raw = formData.get(key);
  if (typeof raw !== "string") return "";
  return raw.trim();
}

function normalizeCity(value: string): string {
  return value.trim().toLowerCase();
}
