import Link from "next/link";
import Image from "next/image";
import { FavoriteButton } from "@/components/listings/favorite-button";
import { formatPrice, truncate } from "@/lib/utils/format";
import type { Listing } from "@/types/listing";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const transactionLabel = listing.transactionType === "lease" ? "For Lease" : "For Sale";

  return (
    <article className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-soft transition hover:-translate-y-1">
      <div className="relative">
        <Link href={`/listings/${listing.listingUrlSlug}`} className="block">
          <Image
            src={`${listing.images[0]}?auto=format&fit=crop&w=1200&q=80`}
            alt={`Photo of ${listing.address}`}
            width={1200}
            height={800}
            className="h-52 w-full object-cover"
          />
        </Link>
        {listing.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-900 shadow">
            {listing.badge}
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-brand-900/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow">
          {transactionLabel}
        </span>
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xl font-semibold text-brand-900">{formatPrice(listing.price)}</p>
            <p className="text-sm text-brand-700">{listing.address}</p>
            <p className="text-xs uppercase tracking-wide text-brand-500">{listing.city}</p>
          </div>
          <FavoriteButton listingId={listing.id} />
        </div>
        <div className="text-sm text-brand-700">
          <span>{listing.bedrooms} Beds</span>
          <span className="mx-2 text-brand-300">|</span>
          <span>{listing.bathrooms} Baths</span>
          <span className="mx-2 text-brand-300">|</span>
          <span>{listing.propertyType}</span>
        </div>
        <p className="text-sm text-brand-700">{truncate(listing.description, 120)}</p>
        <Link
          href={`/listings/${listing.listingUrlSlug}`}
          className="inline-flex rounded-full bg-brand-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
        >
          View Details
        </Link>
      </div>
    </article>
  );
}
