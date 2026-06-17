import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, GraduationCap, Home } from "lucide-react";
import { ListingCard } from "@/components/listings/listing-card";
import { SITE_CONFIG } from "@/config/site";
import { PRIMARY_MARKET_PAGES, getMarketBySlug } from "@/lib/locations/markets";
import { getNeighborhoodsByCity } from "@/lib/locations/neighborhoods";
import { CURRENT_MARKET_REPORT } from "@/lib/market/reports";
import { getListingStatsByMunicipality, getListingsByMunicipality } from "@/lib/listings/service";
import { getSchools } from "@/lib/schools/service";
import type { Listing } from "@/types/listing";
import type { School } from "@/types/school";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { citySlug: string } }): Promise<Metadata> {
  const market = getMarketBySlug(params.citySlug);
  if (!market) return { title: "Market Not Found" };

  const url = `${SITE_CONFIG.baseUrl}/locations/${market.slug}`;

  return {
    title: market.metaTitle,
    description: market.metaDescription,
    alternates: {
      canonical: url
    },
    openGraph: {
      title: market.metaTitle,
      description: market.metaDescription,
      url,
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: market.metaTitle,
      description: market.metaDescription
    }
  };
}

export default async function LocationPage({ params }: { params: { citySlug: string } }) {
  const market = getMarketBySlug(params.citySlug);
  if (!market) notFound();

  const [cityListings, listingStats, citySchools] = await Promise.all([
    getListingsByMunicipality(market.city, 1000),
    getListingStatsByMunicipality(market.city),
    getSchools({ municipality: market.city })
  ]);
  const listings = selectRepresentativeListings(cityListings, 6);
  const topCitySchools = getTopRankedSchools(citySchools, 6);
  const pageUrl = `${SITE_CONFIG.baseUrl}/locations/${market.slug}`;
  const listingSearchUrl = `/listings?city=${encodeURIComponent(market.city)}`;
  const schoolSearchUrl = `/schools?municipality=${encodeURIComponent(market.city)}`;
  const neighborhoods = getNeighborhoodsByCity(market.city);
  const jsonLd = buildLocationJsonLd({
    city: market.city,
    title: market.title,
    description: market.metaDescription,
    url: pageUrl,
    listings
  });

  return (
    <section className="site-container py-10 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">GTA Market</p>
            <h1 className="mt-3 font-heading text-4xl text-brand-900 sm:text-5xl">{market.title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-brand-700 sm:text-lg">{market.intro}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={listingSearchUrl}
                className="inline-flex items-center gap-2 rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
              >
                Browse {market.city} Listings
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/locations/${market.slug}/market`}
                className="inline-flex items-center gap-2 rounded-full border border-brand-200 px-5 py-3 text-sm font-semibold text-brand-900 transition hover:border-brand-300 hover:bg-brand-50"
              >
                {CURRENT_MARKET_REPORT.label} Market Stats
              </Link>
              <Link
                href={schoolSearchUrl}
                className="inline-flex items-center gap-2 rounded-full border border-brand-200 px-5 py-3 text-sm font-semibold text-brand-900 transition hover:border-brand-300 hover:bg-brand-50"
              >
                Search {market.city} Schools
                <GraduationCap className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <aside className="rounded-2xl border border-brand-100 bg-brand-50/70 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">At a Glance</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric label="Active" value={String(listingStats.activeCount)} />
              <Metric label="For Sale" value={String(listingStats.saleCount)} />
              <Metric label="For Lease" value={String(listingStats.leaseCount)} />
              <Metric label="Schools" value={String(citySchools.length)} />
            </div>
          </aside>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {market.highlights.map((highlight) => (
            <div key={highlight} className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
              <CheckCircle2 className="h-5 w-5 text-brand-700" />
              <p className="mt-3 text-sm font-semibold leading-6 text-brand-900">{highlight}</p>
            </div>
          ))}
        </div>
      </div>

      {neighborhoods.length > 0 ? (
        <section className="py-10 sm:py-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-heading text-3xl text-brand-900">Explore {market.city} Neighborhoods</h2>
              <p className="mt-2 max-w-2xl text-brand-700">
                Compare current listings, school research starting points, and price stats in popular local areas.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {neighborhoods.map((neighborhood) => (
              <Link
                key={neighborhood.slug}
                href={`/locations/${market.slug}/${neighborhood.slug}`}
                className="rounded-2xl border border-brand-100 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-300"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                  {market.city} Area
                </p>
                <h3 className="mt-3 font-heading text-2xl text-brand-900">
                  Homes in {neighborhood.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-brand-700">{neighborhood.intro}</p>
                <span className="mt-4 inline-flex text-sm font-semibold text-brand-900">
                  Browse {neighborhood.name} {market.city} homes
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="py-10 sm:py-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-3xl text-brand-900">Featured {market.city} Listings</h2>
            <p className="mt-2 max-w-2xl text-brand-700">
              Start with a representative mix of current public listings, then open the full search for more filters.
            </p>
          </div>
          <Link
            href={listingSearchUrl}
            className="inline-flex items-center gap-2 rounded-full border border-brand-200 px-5 py-3 text-sm font-semibold text-brand-900 transition hover:border-brand-300 hover:bg-white"
          >
            View All {market.city} Listings
            <Home className="h-4 w-4" />
          </Link>
        </div>

        {listings.length > 0 ? (
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} returnTo={`/locations/${market.slug}`} />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-brand-100 bg-white p-8 text-center shadow-soft">
            <h3 className="font-heading text-2xl text-brand-900">No public listings available right now</h3>
            <p className="mt-2 text-brand-700">Use the full listings search to check for newly synced homes.</p>
          </div>
        )}
      </section>

      {topCitySchools.length > 0 ? (
        <section className="pb-10 sm:pb-12">
          <div className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">School Research</p>
                <h2 className="mt-2 font-heading text-3xl text-brand-900">Top {market.city} school pages</h2>
              </div>
              <Link
                href={schoolSearchUrl}
                className="inline-flex items-center gap-2 rounded-full border border-brand-200 px-5 py-3 text-sm font-semibold text-brand-900 transition hover:border-brand-300 hover:bg-white"
              >
                View All {market.city} Schools
                <GraduationCap className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {topCitySchools.map((school) => (
                <Link
                  key={school.slug}
                  href={`/schools/${school.slug}`}
                  className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4 transition hover:border-brand-300 hover:bg-white"
                >
                  <span className="block font-semibold text-brand-900">Homes near {school.name}</span>
                  <span className="mt-1 block text-sm text-brand-700">
                    {school.board} | {school.ranking?.score != null ? formatScore(school.ranking.score) : school.level}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
        <h2 className="font-heading text-3xl text-brand-900">Plan Your {market.city} Search</h2>
        <p className="mt-3 max-w-3xl leading-8 text-brand-700">
          Compare homes, verify school attendance areas directly with the board, and keep your financing or rental
          documents ready before you book showings.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/guides/first-time-home-buyer-ontario" className="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900 transition hover:bg-brand-50">
            First-Time Buyer Checklist
          </Link>
          <Link href="/guides/documents-needed-buy-house-toronto" className="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900 transition hover:bg-brand-50">
            Buyer Documents Guide
          </Link>
          <Link href="/guides/leasing" className="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900 transition hover:bg-brand-50">
            Ontario Leasing Guide
          </Link>
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

function selectRepresentativeListings(listings: Listing[], limit: number): Listing[] {
  const selected: Listing[] = [];
  const seen = new Set<string>();
  const saleListings = listings.filter((listing) => listing.transactionType === "sale");
  const leaseListings = listings.filter((listing) => listing.transactionType === "lease");

  addPriceBandSample(selected, seen, saleListings, Math.min(4, limit));
  addPriceBandSample(selected, seen, leaseListings, Math.min(2, limit - selected.length));

  if (selected.length < limit) {
    addPriceBandSample(selected, seen, listings, limit - selected.length);
  }

  return selected.slice(0, limit);
}

function addPriceBandSample(
  selected: Listing[],
  seen: Set<string>,
  listings: Listing[],
  count: number
) {
  if (count <= 0 || listings.length === 0) return;

  const sorted = [...listings].sort((a, b) => a.price - b.price);
  const candidateIndexes = getPriceBandIndexes(sorted.length);
  const targetLength = selected.length + count;

  for (const index of candidateIndexes) {
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

function getTopRankedSchools(schools: School[], limit: number): School[] {
  return [...schools]
    .sort((a, b) => {
      const scoreDelta = (b.ranking?.score ?? -1) - (a.ranking?.score ?? -1);
      if (scoreDelta !== 0) return scoreDelta;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}

function formatScore(score: number): string {
  return `${Number.isInteger(score) ? score.toFixed(0) : score.toFixed(1)}/10`;
}

function getPriceBandIndexes(length: number): number[] {
  if (length <= 0) return [];
  if (length === 1) return [0];

  return Array.from(
    new Set([
      0,
      Math.floor((length - 1) * 0.33),
      Math.floor((length - 1) * 0.66),
      length - 1
    ])
  );
}

function buildLocationJsonLd(input: {
  city: string;
  title: string;
  description: string;
  url: string;
  listings: Array<{ title: string; listingUrlSlug: string; price: number; city: string }>;
}) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: SITE_CONFIG.baseUrl
        },
        {
          "@type": "ListItem",
          position: 2,
          name: input.city,
          item: input.url
        }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: input.title,
      description: input.description,
      url: input.url,
      about: {
        "@type": "City",
        name: input.city
      },
      isPartOf: {
        "@type": "WebSite",
        name: SITE_CONFIG.name,
        url: SITE_CONFIG.baseUrl
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: input.listings.map((listing, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: listing.title,
        url: `${SITE_CONFIG.baseUrl}/listings/${listing.listingUrlSlug}`,
        item: {
          "@type": "Residence",
          name: listing.title,
          address: {
            "@type": "PostalAddress",
            addressLocality: listing.city,
            addressRegion: "ON",
            addressCountry: "CA"
          }
        }
      }))
    }
  ];
}
