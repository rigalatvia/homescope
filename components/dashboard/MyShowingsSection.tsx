"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { getUserShowings, type ShowingStatus, type UserShowing } from "@/lib/showings";

interface MyShowingsSectionProps {
  user: User;
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1568605114967-8130f3a36994";

export function MyShowingsSection({ user }: MyShowingsSectionProps) {
  const [showings, setShowings] = useState<UserShowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const results = await getUserShowings(user.uid);
        if (!isActive) return;
        setShowings(results.slice(0, 5));
      } catch (loadError) {
        console.error("[dashboard] Failed to load user showings", loadError);
        if (!isActive) return;
        setShowings([]);
        setError("Something went wrong loading your showing requests. Please try again.");
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [user.uid]);

  return (
    <section id="my-showings" className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-3xl text-brand-900">My Showings</h2>
          <p className="mt-2 text-sm leading-7 text-brand-700 sm:text-base">
            When you book a private showing, you&apos;ll be able to track it here.
          </p>
        </div>
        <Link
          href="/listings"
          className="inline-flex rounded-full border border-accent/40 px-4 py-2 text-sm font-semibold text-accent transition hover:border-accent hover:bg-brand-50"
        >
          Browse Listings
        </Link>
      </div>

      {loading ? (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
              <div className="h-16 w-20 animate-pulse rounded-xl bg-brand-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 animate-pulse rounded-full bg-brand-100" />
                <div className="h-4 w-2/3 animate-pulse rounded-full bg-brand-100" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : showings.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Your showing requests will appear here."
            description="When you book a private showing, you&apos;ll be able to track it here."
            actionHref="/listings"
            actionLabel="Browse Listings"
          />
        </div>
      ) : (
        <>
          <div className="mt-8 hidden overflow-hidden rounded-[1.75rem] border border-brand-100 md:block">
            <table className="min-w-full divide-y divide-brand-100">
              <thead className="bg-brand-50/70">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                  <th className="px-5 py-4">Property</th>
                  <th className="px-5 py-4">Date &amp; Time</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100 bg-white">
                {showings.map((showing) => (
                  <tr key={showing.id}>
                    <td className="px-5 py-4 align-top">
                      <ShowingPropertyCell showing={showing} />
                    </td>
                    <td className="px-5 py-4 align-top text-sm text-brand-700">{formatPreferredDateTime(showing.preferredDateTime)}</td>
                    <td className="px-5 py-4 align-top">
                      <StatusBadge status={showing.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 space-y-4 md:hidden">
            {showings.map((showing) => (
              <article key={showing.id} className="rounded-[1.75rem] border border-brand-100 bg-brand-50/50 p-4">
                <ShowingPropertyCell showing={showing} />
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-sm text-brand-700">{formatPreferredDateTime(showing.preferredDateTime)}</p>
                  <StatusBadge status={showing.status} />
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function ShowingPropertyCell({ showing }: { showing: UserShowing }) {
  const content = (
    <div className="flex items-center gap-4">
      <Image
        src={`${showing.listingImageUrl || FALLBACK_IMAGE}?auto=format&fit=crop&w=300&q=80`}
        alt={`Showing request for ${showing.listingAddress}`}
        width={300}
        height={200}
        className="h-16 w-20 rounded-xl object-cover"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-brand-900">{showing.listingAddress}</p>
        <p className="mt-1 text-sm text-brand-700">{showing.listingCity}</p>
      </div>
    </div>
  );

  if (!showing.listingUrl) {
    return content;
  }

  return (
    <Link href={safePathname(showing.listingUrl)} className="block transition hover:opacity-90">
      {content}
    </Link>
  );
}

function StatusBadge({ status }: { status: ShowingStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        status === "confirmed" ? "bg-emerald-100 text-emerald-800" : "bg-brand-100 text-brand-700"
      }`}
    >
      {status === "confirmed" ? "Confirmed" : "Pending"}
    </span>
  );
}

function formatPreferredDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function safePathname(value: string): string {
  try {
    return new URL(value).pathname;
  } catch {
    return value;
  }
}
