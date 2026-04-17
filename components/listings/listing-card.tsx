import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
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
        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-brand-100 bg-brand-50/50 px-3 py-3">
          <ListingStat icon={<BedStatIcon />} value={String(listing.bedrooms)} label="Bedrooms" />
          <ListingStat icon={<BathStatIcon />} value={String(listing.bathrooms)} label="Bathrooms" />
          <ListingStat icon={<AreaStatIcon />} value={listing.squareFootage ?? "N/A"} label="Square Feet" />
        </div>
        <p className="text-sm text-brand-700">{listing.propertyType}</p>
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

function ListingStat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center justify-center gap-1 text-center">
      <div className="flex items-center justify-center gap-2 text-brand-800">
        <span className="shrink-0 text-brand-500">{icon}</span>
        <span className="truncate text-base font-semibold text-brand-900">{value}</span>
      </div>
      <span className="text-xs text-brand-600">{label}</span>
    </div>
  );
}

function BedStatIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 11.5h17v5h-17z" />
      <path d="M5 11.5V8.8a1.8 1.8 0 0 1 1.8-1.8h2.4A1.8 1.8 0 0 1 11 8.8v2.7" />
      <path d="M11 11.5V9.4A2.4 2.4 0 0 1 13.4 7h3.2A2.4 2.4 0 0 1 19 9.4v2.1" />
      <path d="M3.5 16.5v2" />
      <path d="M20.5 16.5v2" />
    </svg>
  );
}

function BathStatIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 13.5h10a1.5 1.5 0 0 1 1.5 1.5 5.5 5.5 0 0 1-11 0 1.5 1.5 0 0 1 1.5-1.5z" />
      <path d="M9 13.5v-5a3 3 0 1 1 6 0v1" />
      <path d="M15 9.5h2.5" />
      <path d="M6.5 18.5h11" />
    </svg>
  );
}

function AreaStatIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8.5 12 5l7 3.5-7 3.5z" />
      <path d="M5 8.5V15.5L12 19l7-3.5v-7" />
      <path d="M12 12v7" />
    </svg>
  );
}
