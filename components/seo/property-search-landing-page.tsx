import Link from "next/link";
import { ArrowRight, Bell, GraduationCap } from "lucide-react";
import { ListingCard } from "@/components/listings/listing-card";
import { SaveSearchButton } from "@/components/listings/save-search-button";
import { SITE_CONFIG } from "@/config/site";
import { getNeighborhoodsByCity } from "@/lib/locations/neighborhoods";
import { getListingsByMunicipality } from "@/lib/listings/service";
import { getAllPropertySearchLandings, type PropertySearchLanding } from "@/lib/seo/property-search-landings";

export async function PropertySearchLandingPage({ landing }: { landing: PropertySearchLanding }) {
  const cityListings = await getListingsByMunicipality(landing.city, 1000);
  const matchingListings = cityListings.filter((listing) => listing.transactionType === landing.transactionType);
  const listings = matchingListings.slice(0, 12);
  const neighborhoods = getNeighborhoodsByCity(landing.city).slice(0, 6);
  const pagePath = `/${landing.intentSlug}/${landing.citySlug}`;
  const searchPath = `/listings?city=${encodeURIComponent(landing.city)}&transactionType=${landing.transactionType}`;
  const relatedLandings = getAllPropertySearchLandings().filter(
    (item) => item.citySlug !== landing.citySlug && item.intentSlug === landing.intentSlug
  );
  const schema = buildStructuredData(landing, listings, pagePath);

  return (
    <section className="site-container py-10 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-brand-600">
        <Link href="/" className="hover:underline">Home</Link>
        <span aria-hidden="true"> / </span>
        <Link href={`/${landing.intentSlug}/${landing.citySlug}`} aria-current="page" className="font-semibold text-brand-900">
          {landing.displayCity} homes for {landing.transactionType === "lease" ? "rent" : "sale"}
        </Link>
      </nav>

      <header className="border-b border-brand-100 pb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
          {landing.transactionType === "lease" ? "GTA Rentals" : "GTA Homes for Sale"}
        </p>
        <h1 className="mt-3 max-w-4xl font-heading text-4xl text-brand-900 sm:text-5xl">{landing.heading}</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-brand-700 sm:text-lg">{landing.intro}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={searchPath} className="inline-flex items-center gap-2 rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-800">
            View all {landing.displayCity} listings <ArrowRight className="h-4 w-4" />
          </Link>
          <SaveSearchButton
            filters={{ city: landing.city, transactionType: landing.transactionType }}
            resultsTotal={matchingListings.length}
          />
        </div>
      </header>

      <section className="py-10" aria-labelledby="current-listings-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="current-listings-heading" className="font-heading text-3xl text-brand-900">
              Current {landing.displayCity} homes for {landing.transactionType === "lease" ? "rent" : "sale"}
            </h2>
            <p className="mt-2 text-brand-700">{matchingListings.length} active public listing{matchingListings.length === 1 ? "" : "s"} currently match this search.</p>
          </div>
          <Link href={searchPath} className="text-sm font-semibold text-brand-900 underline underline-offset-4">Open full search and filters</Link>
        </div>
        {listings.length > 0 ? (
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => <ListingCard key={listing.id} listing={listing} returnTo={pagePath} />)}
          </div>
        ) : (
          <div className="mt-6 border-y border-brand-100 py-8">
            <h3 className="font-heading text-2xl text-brand-900">No matching public listings right now</h3>
            <p className="mt-2 text-brand-700">Save this search to be notified when matching inventory becomes available.</p>
          </div>
        )}
      </section>

      <section className="grid gap-8 border-t border-brand-100 py-10 lg:grid-cols-2">
        <div>
          <h2 className="font-heading text-3xl text-brand-900">Searching in {landing.displayCity}</h2>
          <p className="mt-4 leading-8 text-brand-700">{landing.localContext}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={`/locations/${landing.citySlug}`} className="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900">Explore {landing.displayCity}</Link>
            <Link href={`/schools?municipality=${encodeURIComponent(landing.city)}`} className="inline-flex items-center gap-2 rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900"><GraduationCap className="h-4 w-4" /> Research schools</Link>
            <Link href={landing.transactionType === "lease" ? "/guides/leasing" : "/guides/first-time-home-buyer-ontario"} className="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900">{landing.transactionType === "lease" ? "Ontario leasing guide" : "First-time buyer guide"}</Link>
          </div>
        </div>
        <div>
          <h2 className="font-heading text-3xl text-brand-900">Popular local areas</h2>
          {neighborhoods.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {neighborhoods.map((area) => <Link key={area.slug} href={`/locations/${landing.citySlug}/${area.slug}`} className="border-b border-brand-100 py-3 font-semibold text-brand-900 hover:underline">{area.name} homes</Link>)}
            </div>
          ) : <p className="mt-4 text-brand-700">Use the full search to compare available areas and property locations.</p>}
        </div>
      </section>

      <section className="border-t border-brand-100 py-10">
        <h2 className="font-heading text-3xl text-brand-900">Browse by property type</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          {["Detached", "Semi-Detached", "Townhouse", "Condo"].map((propertyType) => (
            <Link
              key={propertyType}
              href={`${searchPath}&propertyType=${encodeURIComponent(propertyType)}`}
              className="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
            >
              {propertyType} {landing.transactionType === "lease" ? "rentals" : "homes for sale"}
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-brand-100 py-10">
        <h2 className="font-heading text-3xl text-brand-900">More GTA searches</h2>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
          {relatedLandings.map((item) => <Link key={`${item.intentSlug}-${item.citySlug}`} href={`/${item.intentSlug}/${item.citySlug}`} className="font-semibold text-brand-900 underline underline-offset-4">{item.displayCity} homes for {item.transactionType === "lease" ? "rent" : "sale"}</Link>)}
        </div>
      </section>

      <section className="bg-brand-900 px-6 py-9 text-white sm:px-9">
        <Bell className="h-6 w-6" />
        <h2 className="mt-3 font-heading text-3xl">Find your next home in {landing.displayCity}</h2>
        <p className="mt-3 max-w-2xl text-brand-100">Save matching homes, create an alert, or request a private showing when a property fits your plans.</p>
        <Link href={searchPath} className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-900">Start searching</Link>
      </section>
    </section>
  );
}

function buildStructuredData(landing: PropertySearchLanding, listings: Array<{ title: string; listingUrlSlug: string }>, path: string) {
  const url = `${SITE_CONFIG.baseUrl}${path}`;
  return [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_CONFIG.baseUrl },
      { "@type": "ListItem", position: 2, name: landing.heading, item: url }
    ] },
    { "@context": "https://schema.org", "@type": "CollectionPage", name: landing.heading, description: landing.description, url, about: { "@type": "City", name: landing.displayCity }, isPartOf: { "@type": "WebSite", name: SITE_CONFIG.name, url: SITE_CONFIG.baseUrl } },
    { "@context": "https://schema.org", "@type": "ItemList", numberOfItems: listings.length, itemListElement: listings.map((listing, index) => ({ "@type": "ListItem", position: index + 1, name: listing.title, url: `${SITE_CONFIG.baseUrl}/listings/${listing.listingUrlSlug}` })) }
  ];
}
