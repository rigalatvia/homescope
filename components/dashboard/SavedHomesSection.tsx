import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { AreaStatIcon, BathStatIcon, BedStatIcon } from "@/components/listings/property-stat-icons";
import { formatPrice } from "@/lib/utils/format";
import type { SavedHomeListing } from "@/lib/savedHomes";

interface SavedHomesSectionProps {
  savedListings: SavedHomeListing[];
  loading: boolean;
  error: string | null;
  onRemove: (listingId: string) => Promise<void>;
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1568605114967-8130f3a36994";

export function SavedHomesSection({ savedListings, loading, error, onRemove }: SavedHomesSectionProps) {
  return (
    <section id="saved-homes" className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-3xl text-brand-900">Saved Homes</h2>
          <p className="mt-2 text-sm leading-7 text-brand-700 sm:text-base">
            Keep track of the homes you love and jump back into your search whenever you&apos;re ready.
          </p>
        </div>
        <Link
          href="/listings"
          className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:text-brand-900"
        >
          Browse More Listings
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-[1.75rem] border border-brand-100 bg-brand-50/60 p-4">
              <div className="h-48 animate-pulse rounded-2xl bg-brand-100" />
              <div className="mt-4 h-6 animate-pulse rounded-full bg-brand-100" />
              <div className="mt-3 h-4 animate-pulse rounded-full bg-brand-100" />
              <div className="mt-2 h-4 w-2/3 animate-pulse rounded-full bg-brand-100" />
            </div>
          ))}
        </div>
      ) : savedListings.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="You haven&apos;t saved any homes yet."
            description="Start exploring listings and save the ones you love."
            actionHref="/listings"
            actionLabel="Browse Listings"
          />
        </div>
      ) : (
        <>
          {error ? (
            <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : null}
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {savedListings.map((savedHome) => (
              <SavedHomeCard key={savedHome.listingId} savedHome={savedHome} onRemove={onRemove} />
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Link
              href="/listings"
              className="inline-flex rounded-full border border-accent/40 px-6 py-3 text-sm font-semibold text-accent transition hover:border-accent hover:bg-brand-50"
            >
              Browse More Listings
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

function SavedHomeCard({
  savedHome,
  onRemove
}: {
  savedHome: SavedHomeListing;
  onRemove: (listingId: string) => Promise<void>;
}) {
  if (!savedHome.listing) {
    return (
      <article className="flex h-full flex-col rounded-[1.75rem] border border-brand-100 bg-brand-50/50 p-5">
        <div className="rounded-[1.5rem] border border-dashed border-brand-200 bg-white px-5 py-10 text-center">
          <p className="font-heading text-2xl text-brand-900">This listing is no longer available.</p>
          <p className="mt-3 text-sm leading-7 text-brand-700">
            It may have sold, been terminated, or been removed from the current active feed.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void onRemove(savedHome.listingId);
          }}
          className="mt-6 text-sm font-semibold text-brand-700 underline underline-offset-4 transition hover:text-brand-900"
        >
          Remove
        </button>
      </article>
    );
  }

  const { listing } = savedHome;

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-brand-100 bg-white shadow-soft">
      <Link href={`/listings/${listing.listingUrlSlug}`} className="block">
        <Image
          src={`${listing.images[0] || FALLBACK_IMAGE}?auto=format&fit=crop&w=1200&q=80`}
          alt={`Saved home at ${listing.address}`}
          width={1200}
          height={800}
          className="h-52 w-full object-cover"
        />
      </Link>
      <div className="space-y-4 p-5">
        <div>
          <p className="text-xl font-semibold text-brand-900">{formatPrice(listing.price)}</p>
          <p className="mt-1 text-sm text-brand-700">{listing.address}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-brand-500">{listing.city}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-brand-100 bg-brand-50/50 px-3 py-3">
          <SavedHomeStat icon={<BedStatIcon />} value={String(listing.bedrooms)} label="Beds" />
          <SavedHomeStat icon={<BathStatIcon />} value={String(listing.bathrooms)} label="Baths" />
          <SavedHomeStat icon={<AreaStatIcon />} value={listing.squareFootage || "N/A"} label="Sq. Ft." />
        </div>

        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/listings/${listing.listingUrlSlug}`}
            className="inline-flex rounded-full bg-brand-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            View Details
          </Link>
          <button
            type="button"
            onClick={() => {
              void onRemove(savedHome.listingId);
            }}
            className="text-sm font-semibold text-brand-700 underline underline-offset-4 transition hover:text-brand-900"
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}

function SavedHomeStat({
  icon,
  value,
  label
}: {
  icon: ReactNode;
  value: string;
  label: string;
}) {
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
