"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowRight, CheckSquare, Save } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { AreaStatIcon, BathStatIcon, BedStatIcon } from "@/components/listings/property-stat-icons";
import { formatPrice } from "@/lib/utils/format";
import type { SavedHomeListing } from "@/lib/savedHomes";

interface SavedHomesSectionProps {
  savedListings: SavedHomeListing[];
  loading: boolean;
  error: string | null;
  onRemove: (listingId: string) => Promise<void>;
  onUpdateNotes: (listingId: string, notes: string) => Promise<void>;
  isPending: (listingId: string) => boolean;
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1568605114967-8130f3a36994";
const MAX_COMPARE_LISTINGS = 4;

export function SavedHomesSection({
  savedListings,
  loading,
  error,
  onRemove,
  onUpdateNotes,
  isPending
}: SavedHomesSectionProps) {
  const comparableListings = useMemo(() => savedListings.filter((savedHome) => savedHome.listing), [savedListings]);
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const selectedCompareListings = comparableListings.filter((savedHome) => selectedCompareIds.includes(savedHome.listingId));

  const toggleCompare = (listingId: string) => {
    setSelectedCompareIds((current) => {
      if (current.includes(listingId)) return current.filter((id) => id !== listingId);
      return [...current, listingId].slice(-MAX_COMPARE_LISTINGS);
    });
  };

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
          <SavedHomesComparison
            selectedListings={selectedCompareListings}
            onClear={() => setSelectedCompareIds([])}
          />
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {savedListings.map((savedHome) => (
              <SavedHomeCard
                key={savedHome.listingId}
                savedHome={savedHome}
                compareSelected={selectedCompareIds.includes(savedHome.listingId)}
                compareDisabled={!selectedCompareIds.includes(savedHome.listingId) && selectedCompareIds.length >= MAX_COMPARE_LISTINGS}
                pending={isPending(savedHome.listingId)}
                onToggleCompare={toggleCompare}
                onRemove={onRemove}
                onUpdateNotes={onUpdateNotes}
              />
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
  compareSelected,
  compareDisabled,
  pending,
  onToggleCompare,
  onRemove,
  onUpdateNotes
}: {
  savedHome: SavedHomeListing;
  compareSelected: boolean;
  compareDisabled: boolean;
  pending: boolean;
  onToggleCompare: (listingId: string) => void;
  onRemove: (listingId: string) => Promise<void>;
  onUpdateNotes: (listingId: string, notes: string) => Promise<void>;
}) {
  const [notesDraft, setNotesDraft] = useState(savedHome.notes);
  const [notesStatus, setNotesStatus] = useState("");
  const [notesError, setNotesError] = useState("");

  useEffect(() => {
    setNotesDraft(savedHome.notes);
  }, [savedHome.notes]);

  const saveNotes = async () => {
    try {
      await onUpdateNotes(savedHome.listingId, notesDraft);
      setNotesError("");
      setNotesStatus("Notes saved.");
    } catch (error) {
      console.error("[savedHomes] Failed to save private notes", error);
      setNotesStatus("");
      setNotesError("Could not save notes. Please try again.");
    }
  };

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
      <div className="relative">
        <Link href={`/listings/${listing.listingUrlSlug}`} className="block">
          <Image
            src={`${listing.images[0] || FALLBACK_IMAGE}?auto=format&fit=crop&w=1200&q=80`}
            alt={`Saved home at ${listing.address}`}
            width={1200}
            height={800}
            className="h-52 w-full object-cover"
          />
        </Link>
        <label className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-brand-900 shadow">
          <input
            type="checkbox"
            checked={compareSelected}
            disabled={compareDisabled}
            onChange={() => onToggleCompare(savedHome.listingId)}
            className="h-4 w-4 rounded border-brand-300"
          />
          Compare
        </label>
      </div>
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

        <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Private Notes</span>
            <textarea
              value={notesDraft}
              onChange={(event) => {
                setNotesDraft(event.target.value);
                setNotesStatus("");
                setNotesError("");
              }}
              rows={4}
              maxLength={3000}
              placeholder="Add showing notes, pros/cons, questions, or next steps..."
              className="mt-2 w-full resize-none rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm leading-6 text-brand-900 outline-none transition focus:border-brand-400"
            />
          </label>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              disabled={pending || notesDraft === savedHome.notes}
              onClick={() => {
                void saveNotes();
              }}
              className="inline-flex items-center gap-2 rounded-full bg-brand-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-3.5 w-3.5" />
              Save Notes
            </button>
            <span className="text-xs text-brand-600">{notesDraft.length}/3000</span>
          </div>
          {notesStatus ? <p className="mt-2 text-xs font-semibold text-emerald-700">{notesStatus}</p> : null}
          {notesError ? <p className="mt-2 text-xs font-semibold text-red-700">{notesError}</p> : null}
        </div>
      </div>
    </article>
  );
}

function SavedHomesComparison({
  selectedListings,
  onClear
}: {
  selectedListings: SavedHomeListing[];
  onClear: () => void;
}) {
  if (selectedListings.length === 0) {
    return (
      <div className="mt-8 rounded-[1.75rem] border border-brand-100 bg-brand-50/50 p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-900 shadow-sm">
            <CheckSquare className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-heading text-2xl text-brand-900">Compare saved homes</h3>
            <p className="mt-2 text-sm leading-7 text-brand-700">
              Select up to {MAX_COMPARE_LISTINGS} saved homes to compare price, size, monthly estimate, school distance,
              and private notes side by side.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-[1.75rem] border border-brand-100 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-2xl text-brand-900">Listing Comparison</h3>
          <p className="mt-1 text-sm text-brand-700">
            Comparing {selectedListings.length} of {MAX_COMPARE_LISTINGS} saved homes.
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-800 transition hover:border-brand-400"
        >
          Clear Comparison
        </button>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-[760px] w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 rounded-tl-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-xs uppercase tracking-wide text-brand-600">
                Detail
              </th>
              {selectedListings.map((savedHome) => (
                <th key={savedHome.listingId} className="border-y border-r border-brand-100 bg-brand-50 px-4 py-3 text-brand-900">
                  {savedHome.listing ? (
                    <Link href={`/listings/${savedHome.listing.listingUrlSlug}`} className="font-semibold underline-offset-4 hover:underline">
                      {savedHome.listing.address}
                    </Link>
                  ) : (
                    "Unavailable"
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.label}>
                <th className="sticky left-0 z-10 border-x border-b border-brand-100 bg-white px-4 py-3 text-xs uppercase tracking-wide text-brand-600">
                  {row.label}
                </th>
                {selectedListings.map((savedHome) => (
                  <td key={`${savedHome.listingId}-${row.label}`} className="border-b border-r border-brand-100 bg-white px-4 py-3 text-brand-800">
                    {row.value(savedHome)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const COMPARISON_ROWS: Array<{ label: string; value: (savedHome: SavedHomeListing) => string }> = [
  { label: "Price", value: ({ listing }) => (listing ? formatPrice(listing.price) : "N/A") },
  { label: "Beds", value: ({ listing }) => (listing ? String(listing.bedrooms) : "N/A") },
  { label: "Baths", value: ({ listing }) => (listing ? String(listing.bathrooms) : "N/A") },
  { label: "Square Feet", value: ({ listing }) => listing?.squareFootage || "N/A" },
  { label: "Type", value: ({ listing }) => listing?.propertyType || "N/A" },
  { label: "City", value: ({ listing }) => listing?.city || "N/A" },
  { label: "Neighbourhood", value: ({ listing }) => listing?.area || "N/A" },
  { label: "Taxes / Fees", value: () => "Not in current feed" },
  {
    label: "School Proximity",
    value: ({ listing }) =>
      listing?.distanceKmFromSchool != null ? `${listing.distanceKmFromSchool.toFixed(1)} km` : "Open from school search"
  },
  {
    label: "Monthly Estimate",
    value: ({ listing }) => (listing ? `${formatPrice(estimateMonthlyPayment(listing.price))} / mo` : "N/A")
  },
  { label: "Private Notes", value: ({ notes }) => notes.trim() || "No notes yet" }
];

function estimateMonthlyPayment(price: number): number {
  const downPayment = price * 0.2;
  const mortgageAmount = Math.max(0, price - downPayment);
  const monthlyRate = 0.0489 / 12;
  const months = 25 * 12;
  const principalAndInterest =
    mortgageAmount *
    ((monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1));

  return Math.round(principalAndInterest);
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
