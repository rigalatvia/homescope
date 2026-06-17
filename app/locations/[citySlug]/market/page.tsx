import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BarChart3, Clock, Home, TrendingUp } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import { getMarketBySlug } from "@/lib/locations/markets";
import { CURRENT_MARKET_REPORT } from "@/lib/market/reports";
import { getListingsByMunicipality, getMonthlyMarketStatsByMunicipality } from "@/lib/listings/service";
import { formatPrice } from "@/lib/utils/format";
import type { Listing } from "@/types/listing";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { citySlug: string } }): Promise<Metadata> {
  const market = getMarketBySlug(params.citySlug);
  if (!market) return { title: "Market Stats Not Found" };

  const title = `${market.city} Housing Market Stats - ${CURRENT_MARKET_REPORT.label} | HomeScope GTA`;
  const description = `Review ${market.city} market stats for ${CURRENT_MARKET_REPORT.label}, including average listed price, active listings, and property type breakdowns.`;
  const url = `${SITE_CONFIG.baseUrl}/locations/${market.slug}/market`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_CONFIG.name,
      type: "article",
      images: ["/og-image.png"]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"]
    }
  };
}

export default async function LocationMarketPage({ params }: { params: { citySlug: string } }) {
  const market = getMarketBySlug(params.citySlug);
  if (!market) notFound();

  const asOfIso = new Date().toISOString();
  const [stats, listings] = await Promise.all([
    getMonthlyMarketStatsByMunicipality({
      municipality: market.city,
      monthStartIso: CURRENT_MARKET_REPORT.monthStartIso,
      nextMonthStartIso: CURRENT_MARKET_REPORT.nextMonthStartIso,
      asOfIso
    }),
    getListingsByMunicipality(market.city, 1000)
  ]);
  const propertyTypeStats = getPropertyTypeStats(listings);
  const pageUrl = `${SITE_CONFIG.baseUrl}/locations/${market.slug}/market`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${market.city} Housing Market Stats - ${CURRENT_MARKET_REPORT.label}`,
    description: `Monthly ${market.city} listing-data snapshot on ${SITE_CONFIG.name}.`,
    url: pageUrl,
    datePublished: CURRENT_MARKET_REPORT.monthStartIso,
    dateModified: asOfIso,
    publisher: {
      "@type": "Organization",
      name: SITE_CONFIG.name
    }
  };

  return (
    <section className="site-container py-10 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">City Market Stats</p>
        <h1 className="mt-3 max-w-4xl font-heading text-4xl text-brand-900 sm:text-5xl">
          {market.city} Housing Market Stats - {CURRENT_MARKET_REPORT.label}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-brand-700 sm:text-lg">
          A server-rendered snapshot of visible {market.city} listings on HomeScope GTA, including active inventory,
          listed-price averages, new listing activity, and property type mix.
        </p>
        <div className="mt-8 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Metric label="Active" value={formatNumber(stats.activeCount)} icon={Home} />
          <Metric label="For Sale" value={formatNumber(stats.saleCount)} icon={BarChart3} />
          <Metric label="For Lease" value={formatNumber(stats.leaseCount)} icon={BarChart3} />
          <Metric label="Avg Sale Price" value={stats.averageSalePrice == null ? "N/A" : formatPrice(stats.averageSalePrice)} icon={TrendingUp} />
          <Metric label="New This Month" value={formatNumber(stats.newListingsCount)} icon={Clock} />
          <Metric label="Avg Days Live" value={stats.averageDaysOnMarket == null ? "N/A" : `${stats.averageDaysOnMarket} days`} icon={Clock} />
        </div>
      </div>

      <section className="mt-10 rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
        <h2 className="font-heading text-3xl text-brand-900">By Property Type</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {propertyTypeStats.map((item) => (
            <div key={item.propertyType} className="rounded-2xl border border-brand-100 bg-brand-50/50 p-5">
              <h3 className="font-semibold text-brand-900">{item.propertyType}</h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <StatTerm label="Active" value={formatNumber(item.count)} />
                <StatTerm label="Avg Price" value={item.averagePrice == null ? "N/A" : formatPrice(item.averagePrice)} />
                <StatTerm label="For Sale" value={formatNumber(item.saleCount)} />
                <StatTerm label="For Lease" value={formatNumber(item.leaseCount)} />
              </dl>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
        <h2 className="font-heading text-3xl text-brand-900">Use This With Local Context</h2>
        <p className="mt-3 max-w-4xl leading-8 text-brand-700">
          These numbers are based on currently visible listing prices, not sold prices. Compare property type, school
          area, condition, exact location, and listing age before making pricing decisions.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/locations/${market.slug}`}
            className="inline-flex items-center gap-2 rounded-full border border-brand-200 px-5 py-3 text-sm font-semibold text-brand-900 transition hover:border-brand-300 hover:bg-white"
          >
            View {market.city} Listings
            <Home className="h-4 w-4" />
          </Link>
          <Link
            href={`/market-reports/${market.slug}/${CURRENT_MARKET_REPORT.slug}`}
            className="inline-flex items-center gap-2 rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            Read Monthly Report
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </section>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Home }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
      <Icon className="h-5 w-5 text-brand-700" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-brand-900">{value}</p>
    </div>
  );
}

function StatTerm({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-brand-500">{label}</dt>
      <dd className="mt-1 font-semibold text-brand-900">{value}</dd>
    </div>
  );
}

function getPropertyTypeStats(listings: Listing[]) {
  const grouped = new Map<string, Listing[]>();

  for (const listing of listings) {
    const propertyType = listing.propertyType || "Other";
    grouped.set(propertyType, [...(grouped.get(propertyType) || []), listing]);
  }

  return Array.from(grouped.entries())
    .map(([propertyType, group]) => {
      const saleListings = group.filter((listing) => listing.transactionType === "sale");
      const prices = saleListings.length ? saleListings.map((listing) => listing.price) : group.map((listing) => listing.price);

      return {
        propertyType,
        count: group.length,
        saleCount: saleListings.length,
        leaseCount: group.length - saleListings.length,
        averagePrice: prices.length ? Math.round(prices.reduce((total, price) => total + price, 0) / prices.length) : null
      };
    })
    .sort((a, b) => b.count - a.count || a.propertyType.localeCompare(b.propertyType))
    .slice(0, 9);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-CA", { maximumFractionDigits: 0 }).format(value);
}
