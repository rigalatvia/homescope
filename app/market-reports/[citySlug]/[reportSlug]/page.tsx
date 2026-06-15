import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BarChart3, Clock, Home, TrendingUp } from "lucide-react";
import { ListingCard } from "@/components/listings/listing-card";
import { SITE_CONFIG } from "@/config/site";
import { getMarketBySlug } from "@/lib/locations/markets";
import { CURRENT_MARKET_REPORT, getMarketReportParams, isCurrentReportSlug } from "@/lib/market/reports";
import { getMarketReportContent } from "@/lib/market/report-content";
import { getListingsByMunicipality, getMonthlyMarketStatsByMunicipality } from "@/lib/listings/service";
import { formatPrice } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: { citySlug: string; reportSlug: string };
}): Promise<Metadata> {
  const market = getMarketBySlug(params.citySlug);
  if (!market || !isCurrentReportSlug(params.reportSlug)) return { title: "Market Report Not Found" };

  const content = await getMarketReportContent({
    city: market.city,
    citySlug: market.slug,
    reportSlug: CURRENT_MARKET_REPORT.slug,
    reportLabel: CURRENT_MARKET_REPORT.label
  });
  const title = `${content.title} | HomeScope GTA`;
  const description = `Review ${market.city} housing market stats for ${CURRENT_MARKET_REPORT.label}, including average price, active listings, new listings, lease inventory, and current homes.`;
  const url = `${SITE_CONFIG.baseUrl}/market-reports/${market.slug}/${CURRENT_MARKET_REPORT.slug}`;

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

export default async function MarketReportPage({
  params
}: {
  params: { citySlug: string; reportSlug: string };
}) {
  const market = getMarketBySlug(params.citySlug);
  if (!market || !isCurrentReportSlug(params.reportSlug)) notFound();

  const asOfIso = new Date().toISOString();
  const [stats, listings, content] = await Promise.all([
    getMonthlyMarketStatsByMunicipality({
      municipality: market.city,
      monthStartIso: CURRENT_MARKET_REPORT.monthStartIso,
      nextMonthStartIso: CURRENT_MARKET_REPORT.nextMonthStartIso,
      asOfIso
    }),
    getListingsByMunicipality(market.city, 1000),
    getMarketReportContent({
      city: market.city,
      citySlug: market.slug,
      reportSlug: CURRENT_MARKET_REPORT.slug,
      reportLabel: CURRENT_MARKET_REPORT.label
    })
  ]);
  const featuredListings = listings.slice(0, 6);
  const reportUrl = `${SITE_CONFIG.baseUrl}/market-reports/${market.slug}/${CURRENT_MARKET_REPORT.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: content.title,
    description: content.intro,
    url: reportUrl,
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
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Monthly Market Report</p>
        <h1 className="mt-3 max-w-4xl font-heading text-4xl text-brand-900 sm:text-5xl">
          {content.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-brand-700 sm:text-lg">
          {content.intro}
        </p>

        <div className="mt-8 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Metric label="Active" value={formatNumber(stats.activeCount)} icon={Home} />
          <Metric label="For Sale" value={formatNumber(stats.saleCount)} icon={BarChart3} />
          <Metric label="For Lease" value={formatNumber(stats.leaseCount)} icon={BarChart3} />
          <Metric label="Avg Sale Price" value={formatOptionalPrice(stats.averageSalePrice)} icon={TrendingUp} />
          <Metric label="New This Month" value={formatNumber(stats.newListingsCount)} icon={Clock} />
          <Metric
            label="Avg Days Live"
            value={stats.averageDaysOnMarket == null ? "N/A" : `${stats.averageDaysOnMarket} days`}
            icon={Clock}
          />
        </div>
      </div>

      <section className="mt-10 rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
        <h2 className="font-heading text-3xl text-brand-900">Market Commentary</h2>
        <p className="mt-3 max-w-4xl leading-8 text-brand-700">{content.marketSummary}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <InfoBlock title="Buyer takeaway" description={content.buyerTakeaway} />
          <InfoBlock title="Seller takeaway" description={content.sellerTakeaway} />
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
        <h2 className="font-heading text-3xl text-brand-900">What These Numbers Mean</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <InfoBlock
            title="Average listed price"
            description="Average price is calculated from visible listings currently available on HomeScope GTA. It is a listing-price snapshot, not a final sold-price statistic."
          />
          <InfoBlock
            title="New listings"
            description={`New listings are counted from records created during ${CURRENT_MARKET_REPORT.label}.`}
          />
          <InfoBlock
            title="Days live"
            description="Days live is an approximation based on the listing record creation date because the public feed does not provide an official days-on-market field."
          />
          <InfoBlock
            title="Use with local context"
            description="Compare these numbers with property type, school area, condition, and exact location before making pricing decisions."
          />
        </div>
        <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
          <h3 className="font-semibold text-brand-900">Report notes</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-brand-700">
            {content.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-10 sm:py-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-3xl text-brand-900">Current {market.city} Listings</h2>
            <p className="mt-2 max-w-2xl text-brand-700">
              Review active listings behind this market snapshot, then open the full search for more filters.
            </p>
          </div>
          <Link
            href={`/listings?city=${encodeURIComponent(market.city)}`}
            className="inline-flex items-center gap-2 rounded-full border border-brand-200 px-5 py-3 text-sm font-semibold text-brand-900 transition hover:border-brand-300 hover:bg-white"
          >
            View All {market.city} Listings
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featuredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              returnTo={`/market-reports/${market.slug}/${CURRENT_MARKET_REPORT.slug}`}
            />
          ))}
        </div>
      </section>
    </section>
  );
}

function Metric({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: string;
  icon: typeof Home;
}) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
      <Icon className="h-5 w-5 text-brand-700" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-brand-900">{value}</p>
    </div>
  );
}

function InfoBlock({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-5">
      <h3 className="font-semibold text-brand-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-brand-700">{description}</p>
    </div>
  );
}

function formatOptionalPrice(value: number | null): string {
  return value == null ? "N/A" : formatPrice(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-CA", { maximumFractionDigits: 0 }).format(value);
}
