import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { FavoriteButton } from "@/components/listings/favorite-button";
import { AreaStatIcon, BathStatIcon, BedStatIcon } from "@/components/listings/property-stat-icons";
import { formatPrice, truncate } from "@/lib/utils/format";
import type { Listing } from "@/types/listing";

interface ListingCardProps {
  listing: Listing;
  returnTo?: string;
}

export function ListingCard({ listing, returnTo }: ListingCardProps) {
  const transactionLabel = listing.transactionType === "lease" ? "For Lease" : "For Sale";
  const detailHref = buildListingDetailHref(listing.listingUrlSlug, returnTo);

  return (
    <article className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-soft transition hover:-translate-y-1">
      <div className="relative">
        <Link href={detailHref} className="block">
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
            {listing.distanceKmFromSchool != null && (
              <p className="mt-1 text-xs font-semibold text-brand-700">
                {formatSchoolDistance(listing.distanceKmFromSchool)} from selected school
              </p>
            )}
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
          href={detailHref}
          className="inline-flex rounded-full bg-brand-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
        >
          View Details
        </Link>
      </div>
    </article>
  );
}

function formatSchoolDistance(distanceKm: number): string {
  return `${distanceKm < 1 ? distanceKm.toFixed(2) : distanceKm.toFixed(1)} km`;
}

function buildListingDetailHref(slug: string, returnTo?: string): string {
  const detailPath = `/listings/${slug}`;
  if (!returnTo) return detailPath;
  return `${detailPath}?returnTo=${encodeURIComponent(returnTo)}`;
}

function ListingStat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center justify-start gap-2 text-center">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-100 bg-white text-brand-500 shadow-sm">
        {icon}
      </span>
      <span className="max-w-full truncate text-base font-semibold leading-none text-brand-900">{value}</span>
      <span className="text-[11px] uppercase tracking-[0.14em] text-brand-600">{label}</span>
    </div>
  );
}
