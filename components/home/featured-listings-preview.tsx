import Link from "next/link";
import Image from "next/image";
import { formatPrice, truncate } from "@/lib/utils/format";
import type { Listing } from "@/types/listing";

interface FeaturedListingsPreviewProps {
  listings: Listing[];
}

export function FeaturedListingsPreview({ listings }: FeaturedListingsPreviewProps) {
  return (
    <section className="site-container py-10 sm:py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-3xl text-brand-900">Featured Listings</h2>
          <p className="mt-2 max-w-2xl text-brand-700">
            Explore a selection of available homes currently featured on HomeScope GTA.
          </p>
        </div>
        <Link
          href="/listings"
          className="hidden rounded-full border border-brand-200 px-5 py-2 text-sm font-semibold text-brand-900 hover:border-brand-400 sm:inline-flex"
        >
          View All Listings
        </Link>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {listings.map((listing) => (
          <article key={listing.id} className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-soft">
            <Link href={`/listings/${listing.listingUrlSlug}`} className="block">
              <Image
                src={`${listing.images[0]}?auto=format&fit=crop&w=1200&q=80`}
                alt={`Featured listing at ${listing.address}`}
                width={1200}
                height={800}
                className="h-44 w-full object-cover"
              />
            </Link>
            <div className="p-5">
              <p className="text-xl font-semibold text-brand-900">{formatPrice(listing.price)}</p>
              <p className="mt-1 text-sm text-brand-700">
                {listing.address}, {listing.city}
              </p>
              <p className="mt-3 text-sm text-brand-700">{truncate(listing.description, 90)}</p>
              <Link
                href={`/listings/${listing.listingUrlSlug}`}
                className="mt-4 inline-flex rounded-full bg-brand-800 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
              >
                View Details
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 sm:hidden">
        <Link
          href="/listings"
          className="inline-flex rounded-full border border-brand-200 px-5 py-2 text-sm font-semibold text-brand-900 hover:border-brand-400"
        >
          View All Listings
        </Link>
      </div>
    </section>
  );
}
