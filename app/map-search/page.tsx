import type { Metadata } from "next";
import Link from "next/link";
import { ListFilter } from "lucide-react";
import { ListingFilters } from "@/components/listings/listing-filters";
import { ListingCard } from "@/components/listings/listing-card";
import { ListingReturnMemory } from "@/components/listings/listing-return-memory";
import { ListingsMapSearch } from "@/components/listings/listings-map-search";
import { ListingsPagination } from "@/components/listings/listings-pagination";
import { SaveSearchButton } from "@/components/listings/save-search-button";
import { SearchTracker } from "@/components/listings/search-tracker";
import { parseListingFilters } from "@/lib/listings/filters";
import { getPublicListings } from "@/lib/listings/service";
import { getSchools } from "@/lib/schools/service";

const MAP_SEARCH_PAGE_SIZE = 500;

export const revalidate = 60;

export const metadata: Metadata = {
  title: "GTA Map Search",
  description: "Search GTA homes for sale and lease with an interactive map on HomeScope GTA.",
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true
    }
  }
};

export default async function MapSearchPage({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const currentMapSearchUrl = buildCurrentMapSearchUrl(searchParams);
  const filters = parseListingFilters({
    city: toString(searchParams.city),
    transactionType: toString(searchParams.transactionType),
    sort: toString(searchParams.sort),
    addressContains: toString(searchParams.addressContains),
    mlsNumber: toString(searchParams.mlsNumber),
    minPrice: toString(searchParams.minPrice),
    maxPrice: toString(searchParams.maxPrice),
    bedrooms: toString(searchParams.bedrooms),
    bathrooms: toString(searchParams.bathrooms),
    propertyType: toString(searchParams.propertyType),
    minLatitude: toString(searchParams.minLatitude),
    maxLatitude: toString(searchParams.maxLatitude),
    minLongitude: toString(searchParams.minLongitude),
    maxLongitude: toString(searchParams.maxLongitude),
    schoolSlug: toString(searchParams.schoolSlug),
    schoolRadiusKm: toString(searchParams.schoolRadiusKm),
    page: toString(searchParams.page),
    pageSize: String(MAP_SEARCH_PAGE_SIZE)
  });

  const [results, schools] = await Promise.all([
    getPublicListings(filters),
    getSchools().then((schools) => schools.filter((school) => school.latitude != null && school.longitude != null))
  ]);

  return (
    <section className="site-container py-12">
      <ListingReturnMemory currentUrl={currentMapSearchUrl} />
      <SearchTracker filters={filters} resultsTotal={results.total} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Interactive Search</p>
          <h1 className="mt-2 font-heading text-4xl text-brand-900">GTA Map Search</h1>
          <p className="mt-2 max-w-3xl text-brand-700">
            Load the heavier map tools only when you need them. Use filters first, then move the map and search the
            visible area.
          </p>
        </div>
        <Link
          href={buildListingsUrl(searchParams)}
          className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-5 py-2 text-sm font-semibold text-brand-900 shadow-sm transition hover:border-brand-400 hover:bg-brand-50"
        >
          <ListFilter className="h-4 w-4" />
          Back to List Search
        </Link>
      </div>

      <div className="mt-6">
        <ListingFilters filters={filters} schools={schools} />
      </div>

      <div className="mt-4">
        <ListingsMapSearch
          initialListings={results.items}
          initialBounds={{
            minLatitude: filters.minLatitude,
            maxLatitude: filters.maxLatitude,
            minLongitude: filters.minLongitude,
            maxLongitude: filters.maxLongitude
          }}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-brand-700">
          {results.total} listing(s) found. Showing up to {results.items.length} on this map page.
        </p>
        <SaveSearchButton filters={filters} resultsTotal={results.total} />
      </div>

      {results.items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-brand-100 bg-white p-10 text-center shadow-soft">
          <h2 className="font-heading text-3xl text-brand-900">No matching listings</h2>
          <p className="mt-2 text-brand-700">Try broadening your filters or clearing the map area.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {results.items.slice(0, 24).map((listing) => (
            <ListingCard key={listing.id} listing={listing} returnTo={currentMapSearchUrl} />
          ))}
        </div>
      )}

      <ListingsPagination page={results.page} totalPages={results.totalPages} filters={filters} basePath="/map-search" />
    </section>
  );
}

function toString(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  return undefined;
}

function buildCurrentMapSearchUrl(searchParams: { [key: string]: string | string[] | undefined }): string {
  return buildUrlWithSearchParams("/map-search", searchParams);
}

function buildListingsUrl(searchParams: { [key: string]: string | string[] | undefined }): string {
  return buildUrlWithSearchParams("/listings", searchParams);
}

function buildUrlWithSearchParams(basePath: string, searchParams: { [key: string]: string | string[] | undefined }): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "pageSize") continue;
    if (typeof value === "string") {
      params.set(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    }
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
