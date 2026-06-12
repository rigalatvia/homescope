import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BarChart3, GraduationCap, Home, School } from "lucide-react";
import { ListingCard } from "@/components/listings/listing-card";
import { SITE_CONFIG } from "@/config/site";
import { getMarketBySlug } from "@/lib/locations/markets";
import { NEIGHBORHOOD_PAGES, getNeighborhoodBySlug } from "@/lib/locations/neighborhoods";
import { getListingsByMunicipality } from "@/lib/listings/service";
import { getSchools } from "@/lib/schools/service";
import { formatPrice } from "@/lib/utils/format";
import type { Listing } from "@/types/listing";
import type { School as SchoolType } from "@/types/school";

export const revalidate = 3600;

export function generateStaticParams() {
  return NEIGHBORHOOD_PAGES.map((neighborhood) => ({
    citySlug: neighborhood.city.toLowerCase().replace(/\s+/g, "-"),
    neighborhoodSlug: neighborhood.slug
  }));
}

export async function generateMetadata({
  params
}: {
  params: { citySlug: string; neighborhoodSlug: string };
}): Promise<Metadata> {
  const market = getMarketBySlug(params.citySlug);
  const neighborhood = market ? getNeighborhoodBySlug(market.city, params.neighborhoodSlug) : undefined;
  if (!market || !neighborhood) return { title: "Neighborhood Not Found" };

  const url = `${SITE_CONFIG.baseUrl}/locations/${market.slug}/${neighborhood.slug}`;

  return {
    title: {
      absolute: neighborhood.metaTitle
    },
    description: neighborhood.metaDescription,
    alternates: {
      canonical: url
    },
    openGraph: {
      title: neighborhood.metaTitle,
      description: neighborhood.metaDescription,
      url,
      siteName: SITE_CONFIG.name,
      type: "website",
      images: ["/og-image.png"]
    },
    twitter: {
      card: "summary_large_image",
      title: neighborhood.metaTitle,
      description: neighborhood.metaDescription,
      images: ["/og-image.png"]
    }
  };
}

export default async function NeighborhoodPage({
  params
}: {
  params: { citySlug: string; neighborhoodSlug: string };
}) {
  const market = getMarketBySlug(params.citySlug);
  const neighborhood = market ? getNeighborhoodBySlug(market.city, params.neighborhoodSlug) : undefined;
  if (!market || !neighborhood) notFound();

  const cityListings = await getListingsByMunicipality(market.city, 1000);
  const neighborhoodListings = cityListings.filter((listing) => listingMatchesNeighborhood(listing, neighborhood.searchAliases));
  const featuredListings = selectRepresentativeListings(neighborhoodListings, 6);
  const priceStats = getPriceStats(neighborhoodListings);
  const topSchools = getTopSchools(await getSchools({ municipality: market.city }), 5);
  const pageUrl = `${SITE_CONFIG.baseUrl}/locations/${market.slug}/${neighborhood.slug}`;
  const listingSearchUrl = `/listings?city=${encodeURIComponent(market.city)}`;
  const jsonLd = buildNeighborhoodJsonLd({
    title: `${neighborhood.name} ${market.city} Homes`,
    description: neighborhood.metaDescription,
    url: pageUrl,
    city: market.city,
    neighborhood: neighborhood.name,
    listings: featuredListings
  });

  return (
    <section className="site-container py-10 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
              {market.city} Neighborhood
            </p>
            <h1 className="mt-3 font-heading text-4xl text-brand-900 sm:text-5xl">
              {neighborhood.name} {market.city} Homes for Sale and Lease
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-brand-700 sm:text-lg">{neighborhood.intro}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={listingSearchUrl}
                className="inline-flex items-center gap-2 rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
              >
                Browse {market.city} Listings
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/locations/${market.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-brand-200 px-5 py-3 text-sm font-semibold text-brand-900 transition hover:border-brand-300 hover:bg-brand-50"
              >
                View {market.city}
              </Link>
            </div>
          </div>

          <aside className="rounded-2xl border border-brand-100 bg-brand-50/70 p-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-brand-700" />
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Price Snapshot</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric label="Active" value={String(neighborhoodListings.length)} />
              <Metric label="For Sale" value={String(priceStats.saleCount)} />
              <Metric label="For Lease" value={String(priceStats.leaseCount)} />
              <Metric label="Median Sale" value={priceStats.medianSalePrice ? formatPrice(priceStats.medianSalePrice) : "N/A"} />
            </div>
          </aside>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {neighborhood.highlights.map((highlight) => (
            <div key={highlight} className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
              <Home className="h-5 w-5 text-brand-700" />
              <p className="mt-3 text-sm font-semibold leading-6 text-brand-900">{highlight}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="py-10 sm:py-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-3xl text-brand-900">Current {neighborhood.name} Listings</h2>
            <p className="mt-2 max-w-2xl text-brand-700">
              A representative sample of active public listings matched to this neighborhood from current listing data.
            </p>
          </div>
          <Link
            href={listingSearchUrl}
            className="inline-flex items-center gap-2 rounded-full border border-brand-200 px-5 py-3 text-sm font-semibold text-brand-900 transition hover:border-brand-300 hover:bg-white"
          >
            View More Listings
            <Home className="h-4 w-4" />
          </Link>
        </div>

        {featuredListings.length > 0 ? (
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featuredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                returnTo={`/locations/${market.slug}/${neighborhood.slug}`}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-brand-100 bg-white p-8 text-center shadow-soft">
            <h3 className="font-heading text-2xl text-brand-900">No matched listings available right now</h3>
            <p className="mt-2 text-brand-700">
              Use the full {market.city} search to check for newly synced homes near {neighborhood.name}.
            </p>
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
          <h2 className="font-heading text-3xl text-brand-900">Market Stats</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Metric label="Average Sale" value={priceStats.averageSalePrice ? formatPrice(priceStats.averageSalePrice) : "N/A"} />
            <Metric label="Lowest Sale" value={priceStats.lowestSalePrice ? formatPrice(priceStats.lowestSalePrice) : "N/A"} />
            <Metric label="Highest Sale" value={priceStats.highestSalePrice ? formatPrice(priceStats.highestSalePrice) : "N/A"} />
            <Metric label="Average Lease" value={priceStats.averageLeasePrice ? formatPrice(priceStats.averageLeasePrice) : "N/A"} />
          </div>
          <p className="mt-4 text-sm leading-6 text-brand-700">
            Stats are calculated from currently visible public listings on HomeScope GTA and can shift as listing data is
            updated.
          </p>
        </div>

        <div className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-brand-700" />
            <h2 className="font-heading text-3xl text-brand-900">Schools To Research</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-brand-700">
            Start with these ranked {market.city} schools, then verify boundaries and eligibility directly with the
            school board before relying on any address.
          </p>
          <div className="mt-5 grid gap-3">
            {topSchools.map((school) => (
              <Link
                key={school.slug}
                href={`/schools/${school.slug}`}
                className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4 transition hover:border-brand-300 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-brand-900">{school.name}</h3>
                    <p className="mt-1 text-sm text-brand-700">{school.board}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-800">
                    <School className="h-3.5 w-3.5" />
                    {school.ranking?.score != null ? `${formatScore(school.ranking.score)}/10` : school.level}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-brand-100 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-brand-900">{value}</p>
    </div>
  );
}

function listingMatchesNeighborhood(listing: Listing, aliases: string[]): boolean {
  const haystack = normalize([listing.area, listing.title, listing.address, listing.description].join(" "));
  return aliases.some((alias) => haystack.includes(normalize(alias)));
}

function selectRepresentativeListings(listings: Listing[], limit: number): Listing[] {
  const selected: Listing[] = [];
  const seen = new Set<string>();
  addPriceBandSample(selected, seen, listings.filter((listing) => listing.transactionType === "sale"), Math.min(4, limit));
  addPriceBandSample(selected, seen, listings.filter((listing) => listing.transactionType === "lease"), Math.min(2, limit - selected.length));
  if (selected.length < limit) addPriceBandSample(selected, seen, listings, limit - selected.length);
  return selected.slice(0, limit);
}

function addPriceBandSample(selected: Listing[], seen: Set<string>, listings: Listing[], count: number) {
  if (count <= 0 || listings.length === 0) return;
  const sorted = [...listings].sort((a, b) => a.price - b.price);
  const targetLength = selected.length + count;
  const indexes = Array.from(new Set([0, Math.floor((sorted.length - 1) * 0.33), Math.floor((sorted.length - 1) * 0.66), sorted.length - 1]));

  for (const index of indexes) {
    if (selected.length >= targetLength) return;
    const listing = sorted[index];
    if (!listing || seen.has(listing.id)) continue;
    seen.add(listing.id);
    selected.push(listing);
  }

  for (const listing of sorted) {
    if (selected.length >= targetLength) return;
    if (seen.has(listing.id)) continue;
    seen.add(listing.id);
    selected.push(listing);
  }
}

function getPriceStats(listings: Listing[]) {
  const salePrices = listings.filter((listing) => listing.transactionType === "sale").map((listing) => listing.price);
  const leasePrices = listings.filter((listing) => listing.transactionType === "lease").map((listing) => listing.price);

  return {
    saleCount: salePrices.length,
    leaseCount: leasePrices.length,
    averageSalePrice: average(salePrices),
    medianSalePrice: median(salePrices),
    lowestSalePrice: salePrices.length ? Math.min(...salePrices) : undefined,
    highestSalePrice: salePrices.length ? Math.max(...salePrices) : undefined,
    averageLeasePrice: average(leasePrices)
  };
}

function average(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function median(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle];
  return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function getTopSchools(schools: SchoolType[], limit: number): SchoolType[] {
  return [...schools]
    .sort((a, b) => {
      const scoreDelta = (b.ranking?.score ?? -1) - (a.ranking?.score ?? -1);
      if (scoreDelta !== 0) return scoreDelta;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}

function formatScore(score: number): string {
  return Number.isInteger(score) ? score.toFixed(0) : score.toFixed(1);
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
}

function buildNeighborhoodJsonLd(input: {
  title: string;
  description: string;
  url: string;
  city: string;
  neighborhood: string;
  listings: Listing[];
}) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: input.title,
      description: input.description,
      url: input.url,
      about: {
        "@type": "Place",
        name: `${input.neighborhood}, ${input.city}`
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: input.listings.map((listing, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: listing.title,
        url: `${SITE_CONFIG.baseUrl}/listings/${listing.listingUrlSlug}`
      }))
    }
  ];
}
