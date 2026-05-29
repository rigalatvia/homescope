import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { SITE_CONFIG } from "@/config/site";
import { ListingFilters } from "@/components/listings/listing-filters";
import { ListingCard } from "@/components/listings/listing-card";
import { ListingsPagination } from "@/components/listings/listings-pagination";
import { SearchTracker } from "@/components/listings/search-tracker";
import { parseListingFilters } from "@/lib/listings/filters";
import { getPublicListings } from "@/lib/listings/service";
import { getSchools } from "@/lib/schools/service";

const ListingsMapSearch = dynamic(
  () => import("@/components/listings/listings-map-search").then((module) => module.ListingsMapSearch),
  { ssr: false }
);

export const revalidate = 60;

export async function generateMetadata({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  const city = toString(searchParams.city);
  const transactionType = toString(searchParams.transactionType);
  const propertyType = toString(searchParams.propertyType);
  const titleParts = [
    city ? `${city} Listings` : "GTA Listings",
    transactionType === "lease" ? "For Lease" : transactionType === "sale" ? "For Sale" : undefined,
    propertyType && propertyType !== "all" && propertyType !== "Any" ? propertyType : undefined
  ].filter(Boolean);
  const title = titleParts.join(" - ");

  const descriptionCity = city || "Toronto, Vaughan, Richmond Hill, Aurora, Newmarket, and King";
  const descriptionTransaction =
    transactionType === "lease"
      ? "rental homes and condos"
      : transactionType === "sale"
        ? "homes and condos for sale"
        : "homes, condos, and rentals";

  return {
    title,
    description: `Browse ${descriptionTransaction} in ${descriptionCity}. Filter by price, beds, baths, property type, and map area on HomeScope GTA.`,
    alternates: {
      canonical: `${SITE_CONFIG.baseUrl}/listings`
    }
  };
}

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
    schoolSlug: toString(searchParams.schoolSlug),
    schoolRadiusKm: toString(searchParams.schoolRadiusKm),
    page: toString(searchParams.page),
    pageSize: toString(searchParams.pageSize)
  });

  const [results, schools] = await Promise.all([getPublicListings(filters), Promise.resolve(getSchools())]);

  return (
    <section className="site-container py-12">
      <SearchTracker filters={filters} resultsTotal={results.total} />
      <h1 className="font-heading text-4xl text-brand-900">Find Your Next Home in the GTA</h1>
      <p className="mt-2 text-brand-700">
        Browse available homes in Vaughan, Richmond Hill, Aurora, Newmarket, King, and Toronto.
      </p>

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
