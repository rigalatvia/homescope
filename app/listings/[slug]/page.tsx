import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadCaptureModal } from "@/components/leads/lead-capture-modal";
import { ListingGallery } from "@/components/listings/gallery";
import { formatPrice } from "@/lib/utils/format";
import { getPublicListingBySlug } from "@/lib/listings/service";
import { SITE_CONFIG } from "@/config/site";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const listing = await getPublicListingBySlug(params.slug);
  if (!listing) {
    return { title: "Listing Not Found" };
  }

  const title = `${listing.title} in ${listing.city}`;
  const description = `${formatPrice(listing.price)} • ${listing.bedrooms} bed, ${listing.bathrooms} bath ${listing.propertyType} in ${listing.city}. View photos, listing details, and request a private showing.`;
  const url = `${SITE_CONFIG.baseUrl}/listings/${listing.listingUrlSlug}`;
  const primaryImage = listing.images[0];

  return {
    title,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      images: primaryImage ? [{ url: `${primaryImage}?auto=format&fit=crop&w=1200&q=80` }] : undefined
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: primaryImage ? [`${primaryImage}?auto=format&fit=crop&w=1200&q=80`] : undefined
    }
  };
}

export default async function ListingDetailPage({ params }: { params: { slug: string } }) {
  const listing = await getPublicListingBySlug(params.slug);
  if (!listing) notFound();

  const listingUrl = `${SITE_CONFIG.baseUrl}/listings/${listing.listingUrlSlug}`;
  const fullAddress = formatListingAddress(listing.address, listing.city, listing.postalCode);
  const relatedGuideLinks =
    listing.transactionType === "lease"
      ? [
          { href: "/guides/leasing", label: "Ontario Leasing Guide" },
          { href: "/guides/lease-documents", label: "Lease Documents Checklist" },
          { href: "/guides/rental-application-ontario", label: "Rental Application Form 410" }
        ]
      : [
          { href: "/guides/first-time-home-buyer-ontario", label: "First-Time Buyer Checklist" },
          { href: "/guides/documents-needed-buy-house-toronto", label: "Buyer Documents Guide" },
          { href: "/guides/organize-real-estate-documents-canada", label: "Organize Real Estate Documents" }
        ];

  return (
    <section className="site-container py-10">
      <div className="grid gap-10 lg:grid-cols-[1.05fr,0.95fr]">
        <ListingGallery images={listing.images} address={listing.address} />
        <div className="space-y-6">
          <div>
            <p className="text-sm uppercase tracking-wide text-brand-600">{listing.city}</p>
            <h1 className="mt-2 font-heading text-4xl text-brand-900">{listing.title}</h1>
            <p className="mt-2 text-2xl font-semibold text-brand-900">{formatPrice(listing.price)}</p>
            <p className="mt-1 text-brand-700">{fullAddress}</p>
            <p className="mt-1 text-sm text-brand-600">MLS Number: {listing.mlsNumber}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-brand-100 bg-white p-4 shadow-soft sm:grid-cols-[0.9fr_0.9fr_1fr_1fr_1.45fr] lg:gap-2 xl:gap-3">
            <Stat label="Beds" value={listing.bedrooms} />
            <Stat label="Baths" value={listing.bathrooms} />
            <Stat label="Listing" value={listing.transactionType === "lease" ? "For Lease" : "For Sale"} />
            <Stat label="Type" value={listing.propertyType} />
            <Stat label="Square Feet" value={listing.squareFootage || "N/A"} />
          </div>

          <p className="leading-relaxed text-brand-800">{listing.description}</p>

          <section className="rounded-2xl border border-brand-100 bg-brand-50/50 p-5 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Helpful Guide</p>
            <h2 className="mt-2 font-heading text-2xl text-brand-900">
              {listing.transactionType === "lease"
                ? "Leasing advice and rental document help"
                : "Buying advice and document help"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-brand-700">
              {listing.transactionType === "lease"
                ? "Before you apply for a rental, it helps to understand the leasing process and have your supporting documents organized."
                : "If you are planning a purchase, it helps to understand the buyer process and keep your financing and closing documents organized."}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {relatedGuideLinks.map((guide, index) => (
                <Link
                  key={guide.href}
                  href={guide.href}
                  className={
                    index === 0
                      ? "inline-flex rounded-full bg-brand-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
                      : "inline-flex rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900 transition hover:border-brand-300 hover:bg-white"
                  }
                >
                  {guide.label}
                </Link>
              ))}
            </div>
          </section>

          <LeadCaptureModal
            listingId={listing.id}
            listingMlsNumber={listing.mlsNumber}
            listingTitle={listing.title}
            listingAddress={fullAddress}
            listingCity={listing.city}
            listingUrl={listingUrl}
            listingTransactionType={listing.transactionType}
          />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-brand-50 px-2 py-3 text-center sm:px-3">
      <p className="whitespace-nowrap text-[11px] uppercase tracking-wide text-brand-600">{label}</p>
      <p className="mt-1 font-semibold text-brand-900 whitespace-nowrap">{value}</p>
    </div>
  );
}

function formatListingAddress(address: string, city: string, postalCode?: string): string {
  const parts = [address, city, postalCode].filter((part): part is string => Boolean(part && part.trim()));
  return parts.join(", ");
}
