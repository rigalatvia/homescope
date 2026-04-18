import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { ListingFilters } from "@/components/listings/listing-filters";
import { ListingCard } from "@/components/listings/listing-card";
import { ListingsPagination } from "@/components/listings/listings-pagination";
import { parseListingFilters } from "@/lib/listings/filters";
import { getPublicListings } from "@/lib/listings/service";

const ListingsMapSearch = dynamic(
  () => import("@/components/listings/listings-map-search").then((module) => module.ListingsMapSearch),
  { ssr: false }
);

export const metadata: Metadata = {
  title: "Listings",
  description:
    "Browse publicly advertisable listings in Vaughan, Richmond Hill, Aurora, Newmarket, King, and Toronto."
};

export const revalidate = 60;

export default async function ListingsPage({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
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
    page: toString(searchParams.page),
    pageSize: toString(searchParams.pageSize)
  });

  const results = await getPublicListings(filters);
  const mapQueryString = buildMapQueryString(searchParams);

  return (
    <section className="site-container py-12">
      <h1 className="font-heading text-4xl text-brand-900">Find Your Next Home in the GTA</h1>
      <p className="mt-2 text-brand-700">
        Browse available homes in Vaughan, Richmond Hill, Aurora, Newmarket, King, and Toronto.
      </p>

      <div className="mt-6">
        <ListingFilters filters={filters} />
      </div>
      <div className="mt-4">
        <ListingsMapSearch
          mapQueryString={mapQueryString}
          initialListings={results.items}
          hasMoreListings={results.total > results.items.length}
          initialBounds={{
            minLatitude: filters.minLatitude,
            maxLatitude: filters.maxLatitude,
            minLongitude: filters.minLongitude,
            maxLongitude: filters.maxLongitude
          }}
        />
      </div>

      <p className="mt-6 text-sm text-brand-700">{results.total} listing(s) found</p>

      {results.items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-brand-100 bg-white p-10 text-center shadow-soft">
          <h2 className="font-heading text-3xl text-brand-900">No matching listings</h2>
          <p className="mt-2 text-brand-700">Try broadening your filters to see more homes.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {results.items.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      <ListingsPagination page={results.page} totalPages={results.totalPages} filters={filters} />
    </section>
  );
}

function toString(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  return undefined;
}

function buildMapQueryString(searchParams: { [key: string]: string | string[] | undefined }): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page" || key === "pageSize") continue;
    if (typeof value === "string" && value.trim()) {
      params.set(key, value);
    }
  }

  return params.toString();
}
