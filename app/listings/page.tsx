import type { Metadata } from "next";
import Link from "next/link";
import { MapPinned } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import { ListingFilters } from "@/components/listings/listing-filters";
import { ListingCard } from "@/components/listings/listing-card";
import { ListingsPagination } from "@/components/listings/listings-pagination";
import { ListingReturnMemory } from "@/components/listings/listing-return-memory";
import { SaveSearchButton } from "@/components/listings/save-search-button";
import { SearchTracker } from "@/components/listings/search-tracker";
import { parseListingFilters } from "@/lib/listings/filters";
import { getPublicListings } from "@/lib/listings/service";
import { getSchools } from "@/lib/schools/service";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  const hasSearchFilters = hasActiveSearchParams(searchParams);
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
    description: `Browse ${descriptionTransaction} in ${descriptionCity}. Filter by price, beds, baths, property type, and school area on HomeScope GTA.`,
    alternates: {
      canonical: `${SITE_CONFIG.baseUrl}/listings`
    },
    openGraph: {
      title,
      description: `Browse ${descriptionTransaction} in ${descriptionCity}. Filter by price, beds, baths, property type, and school area on HomeScope GTA.`,
      url: `${SITE_CONFIG.baseUrl}/listings`,
      siteName: SITE_CONFIG.name,
      type: "website",
      images: ["/og-image.png"]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: `Browse ${descriptionTransaction} in ${descriptionCity}. Filter by price, beds, baths, property type, and school area on HomeScope GTA.`,
      images: ["/og-image.png"]
    },
    robots: hasSearchFilters
      ? {
          index: false,
          follow: true,
          googleBot: {
            index: false,
            follow: true
          }
        }
      : undefined
  };
}

export default async function ListingsPage({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const currentListingsUrl = buildCurrentListingsUrl(searchParams);
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

  const [results, schools] = await Promise.all([
    getPublicListings(filters),
    getSchools().then((schools) => schools.filter((school) => school.latitude != null && school.longitude != null))
  ]);

  return (
    <section className="site-container py-12">
      <ListingReturnMemory currentUrl={currentListingsUrl} />
      <SearchTracker filters={filters} resultsTotal={results.total} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-4xl text-brand-900">Find Your Next Home in the GTA</h1>
          <p className="mt-2 text-brand-700">
            Browse available homes in Vaughan, Richmond Hill, Aurora, Newmarket, King, and Toronto.
          </p>
        </div>
        <Link
          href={buildMapSearchUrl(searchParams)}
          className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-5 py-2 text-sm font-semibold text-brand-900 shadow-sm transition hover:border-brand-400 hover:bg-brand-50"
        >
          <MapPinned className="h-4 w-4" />
          Open Map Search
        </Link>
      </div>

      <div className="mt-6">
        <ListingFilters filters={filters} schools={schools} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-brand-700">{results.total} listing(s) found</p>
        <SaveSearchButton filters={filters} resultsTotal={results.total} />
      </div>

      {results.items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-brand-100 bg-white p-10 text-center shadow-soft">
          <h2 className="font-heading text-3xl text-brand-900">No matching listings</h2>
          <p className="mt-2 text-brand-700">Try broadening your filters to see more homes.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {results.items.map((listing) => (
            <ListingCard key={listing.id} listing={listing} returnTo={currentListingsUrl} />
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

function hasActiveSearchParams(searchParams: { [key: string]: string | string[] | undefined }): boolean {
  return Object.values(searchParams).some((value) => {
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.some((item) => item.trim().length > 0);
    return false;
  });
}

function buildCurrentListingsUrl(searchParams: { [key: string]: string | string[] | undefined }): string {
  return buildUrlWithSearchParams("/listings", searchParams);
}

function buildMapSearchUrl(searchParams: { [key: string]: string | string[] | undefined }): string {
  return buildUrlWithSearchParams("/map-search", searchParams);
}

function buildUrlWithSearchParams(basePath: string, searchParams: { [key: string]: string | string[] | undefined }): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      params.set(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    }
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
