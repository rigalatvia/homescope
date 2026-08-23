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
        setError("Your showing requests are not available just yet. If you've already booked a showing, please check back shortly.");
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
        <p className="mt-8 rounded-2xl border border-brand-100 bg-brand-50/70 px-4 py-3 text-sm text-brand-700">{error}</p>
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
                    <td className="px-5 py-4 align-top text-sm text-brand-700">
                      <ShowingDateCell showing={showing} />
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="space-y-3">
                        <StatusBadge status={showing.status} />
                        <ShowingCalendarActions showing={showing} />
                      </div>
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
                <div className="mt-4 flex items-start justify-between gap-3">
                  <ShowingDateCell showing={showing} />
                  <StatusBadge status={showing.status} />
                </div>
                <ShowingCalendarActions showing={showing} className="mt-4" />
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function ShowingDateCell({ showing }: { showing: UserShowing }) {
  const confirmedDateTime = showing.actualShowingDateTime?.trim();
  const preferredDateTime = showing.preferredDateTime?.trim();

  if (showing.status === "confirmed" && confirmedDateTime) {
    return (
      <div className="space-y-1">
        <p className="text-sm font-semibold text-brand-900">Confirmed showing</p>
        <p className="text-sm text-brand-700">{formatPreferredDateTime(confirmedDateTime)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-sm font-semibold text-brand-900">{preferredDateTime ? "Requested time" : "Pending confirmation"}</p>
      <p className="text-sm text-brand-700">
        {preferredDateTime ? formatPreferredDateTime(preferredDateTime) : "We will follow up to schedule."}
      </p>
    </div>
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

function ShowingCalendarActions({
  showing,
  className = ""
}: {
  showing: UserShowing;
  className?: string;
}) {
  if (showing.status !== "confirmed" || !showing.actualShowingDateTime) {
    return null;
  }

  const googleUrl = buildGoogleCalendarUrl(showing);

  return (
    <div className={`flex flex-wrap gap-2 ${className}`.trim()}>
      <a
        href={googleUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex rounded-full bg-brand-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-800"
      >
        Add to Google Calendar
      </a>
      <button
        type="button"
        onClick={() => downloadShowingIcs(showing)}
        className="inline-flex rounded-full border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-900 transition hover:border-brand-300 hover:bg-white"
      >
        Download .ics
      </button>
    </div>
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

function buildGoogleCalendarUrl(showing: UserShowing): string {
  const start = new Date(showing.actualShowingDateTime as string);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const title = showing.listingTitle
    ? `Private showing: ${showing.listingTitle}`
    : `Private showing: ${showing.listingAddress}`;
  const location = [showing.listingAddress, showing.listingCity].filter(Boolean).join(", ");
  const details = [showing.listingUrl, "Booked through HomeScope GTA"].filter(Boolean).join("\n\n");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatCalendarUtc(start)}/${formatCalendarUtc(end)}`,
    details,
    location
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function downloadShowingIcs(showing: UserShowing) {
  const start = new Date(showing.actualShowingDateTime as string);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const title = escapeIcsText(
    showing.listingTitle ? `Private showing: ${showing.listingTitle}` : `Private showing: ${showing.listingAddress}`
  );
  const location = escapeIcsText([showing.listingAddress, showing.listingCity].filter(Boolean).join(", "));
  const description = escapeIcsText([showing.listingUrl, "Booked through HomeScope GTA"].filter(Boolean).join("\n"));
  const uid = `${showing.id}@homescopegta.ca`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HomeScope GTA//Showing Calendar//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatCalendarUtc(new Date())}`,
    `DTSTART:${formatCalendarUtc(start)}`,
    `DTEND:${formatCalendarUtc(end)}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slugify(showing.listingAddress || showing.listingTitle || "showing")}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatCalendarUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
