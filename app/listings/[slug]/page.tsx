import type { Metadata } from "next";
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

  const title = `${listing.title} - ${listing.city}`;
  const description = `${listing.bedrooms} bed, ${listing.bathrooms} bath ${listing.propertyType} in ${listing.city}. View details and request a showing.`;
  const url = `${SITE_CONFIG.baseUrl}/listings/${listing.listingUrlSlug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images: [{ url: `${listing.images[0]}?auto=format&fit=crop&w=1200&q=80` }]
    }
  };
}

export default async function ListingDetailPage({ params }: { params: { slug: string } }) {
  const listing = await getPublicListingBySlug(params.slug);
  if (!listing) notFound();

  const listingUrl = `${SITE_CONFIG.baseUrl}/listings/${listing.listingUrlSlug}`;
  const fullAddress = formatListingAddress(listing.address, listing.city, listing.postalCode);

  return (
    <section className="site-container py-10">
      <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr]">
        <ListingGallery images={listing.images} address={listing.address} />
        <div className="space-y-6">
          <div>
            <p className="text-sm uppercase tracking-wide text-brand-600">{listing.city}</p>
            <h1 className="mt-2 font-heading text-4xl text-brand-900">{listing.title}</h1>
            <p className="mt-2 text-2xl font-semibold text-brand-900">{formatPrice(listing.price)}</p>
            <p className="mt-1 text-brand-700">{fullAddress}</p>
            <p className="mt-1 text-sm text-brand-600">MLS {listing.mlsNumber}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-brand-100 bg-white p-4 shadow-soft sm:grid-cols-5">
            <Stat label="Beds" value={listing.bedrooms} />
            <Stat label="Baths" value={listing.bathrooms} />
            <Stat label="Square Feet" value={listing.squareFootage || "N/A"} />
            <Stat label="Type" value={listing.propertyType} />
            <Stat label="Listing" value={listing.transactionType === "lease" ? "For Lease" : "For Sale"} />
          </div>

          <p className="leading-relaxed text-brand-800">{listing.description}</p>

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
    <div className="rounded-xl bg-brand-50 p-3 text-center">
      <p className="text-xs uppercase tracking-wide text-brand-600">{label}</p>
      <p className="mt-1 font-semibold text-brand-900">{value}</p>
    </div>
  );
}

function formatListingAddress(address: string, city: string, postalCode?: string): string {
  const parts = [address, city, postalCode].filter((part): part is string => Boolean(part && part.trim()));
  return parts.join(", ");
}
