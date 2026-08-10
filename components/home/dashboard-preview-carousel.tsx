"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  CalendarClock,
  CheckSquare,
  Heart,
  LayoutDashboard,
  NotebookPen
} from "lucide-react";

const SLIDES = [
  {
    eyebrow: "Saved homes",
    title: "Build a private shortlist",
    description: "Keep favourite listings, compare the strongest options, and return when you are ready.",
    icon: Heart,
    preview: "homes"
  },
  {
    eyebrow: "Saved searches",
    title: "Watch the market for matches",
    description: "Save high-intent searches and choose alerts for new homes that fit your criteria.",
    icon: Bell,
    preview: "searches"
  },
  {
    eyebrow: "Private notes",
    title: "Remember every detail",
    description: "Track pros, cons, questions, and next steps after each listing or showing.",
    icon: NotebookPen,
    preview: "notes"
  },
  {
    eyebrow: "My showings",
    title: "Keep tours organized",
    description: "See requested private showings in one calm place as your search gets serious.",
    icon: CalendarClock,
    preview: "showings"
  }
] as const;

const AUTO_ROTATE_MS = 5200;

export function DashboardPreviewCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = SLIDES[activeIndex];
  const ActiveIcon = activeSlide.icon;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % SLIDES.length);
    }, AUTO_ROTATE_MS);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="rounded-[2rem] border border-brand-100 bg-white/90 p-4 shadow-soft backdrop-blur sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-700">
          <LayoutDashboard className="h-3.5 w-3.5" />
          Dashboard Preview
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-500">
          <span className="relative h-2 w-2 rounded-full bg-emerald-500">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-60" />
          </span>
          Live preview
        </div>
      </div>

      <div className="mt-5 min-h-[360px] overflow-hidden rounded-[1.5rem] border border-brand-100 bg-brand-50/50 p-4">
        <div
          key={activeSlide.eyebrow}
          className="animate-[dashboardPreview_5200ms_ease-in-out]"
          aria-live="polite"
        >
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-900 shadow-sm">
            <ActiveIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{activeSlide.eyebrow}</p>
            <h2 className="mt-1 font-heading text-2xl leading-tight text-brand-900 sm:text-3xl">
              {activeSlide.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-brand-700">{activeSlide.description}</p>
            <Link
              href="/dashboard"
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
            >
              Create My Buyer Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-5">
          <DashboardMockup preview={activeSlide.preview} />
        </div>
        </div>
      </div>
    </div>
  );
}

function DashboardMockup({ preview }: { preview: (typeof SLIDES)[number]["preview"] }) {
  if (preview === "homes") return <SavedHomesMockup />;
  if (preview === "searches") return <SavedSearchesMockup />;
  if (preview === "notes") return <PrivateNotesMockup />;
  return <ShowingsMockup />;
}

function SavedHomesMockup() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[
        {
          price: "$1.79M",
          address: "Richmond Hill",
          image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994"
        },
        {
          price: "$2.18M",
          address: "Vaughan",
          image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6"
        }
      ].map((home) => (
        <div key={home.address} className="overflow-hidden rounded-[1.25rem] border border-brand-100 bg-white shadow-sm">
          <Image
            src={`${home.image}?auto=format&fit=crop&w=600&q=80`}
            alt=""
            width={600}
            height={380}
            className="h-20 w-full object-cover"
            sizes="(min-width: 1024px) 220px, 45vw"
          />
          <div className="p-3">
            <p className="text-base font-semibold text-brand-900">{home.price}</p>
            <p className="text-xs uppercase tracking-[0.12em] text-brand-600">{home.address}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SavedSearchesMockup() {
  return (
    <div className="space-y-3">
      {[
        ["Vaughan freehold, 4+ bed", "Instant alerts", "5 matches"],
        ["Richmond Hill near schools", "Daily alerts", "8 matches"]
      ].map(([label, frequency, matches]) => (
        <div key={label} className="rounded-[1.25rem] border border-brand-100 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-heading text-xl leading-tight text-brand-900">{label}</p>
              <p className="mt-2 text-sm text-brand-700">{matches} since saved</p>
            </div>
            <span className="rounded-full bg-brand-900 px-3 py-1.5 text-xs font-semibold text-white">Open</span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-800">
            <span className="inline-flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Email alerts
            </span>
            <span className="font-semibold">{frequency}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PrivateNotesMockup() {
  return (
    <div className="rounded-[1.25rem] border border-brand-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="font-heading text-xl text-brand-900">166 Tower Hill Road</p>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">Private</span>
      </div>
      <div className="mt-4 space-y-3">
        {["Great kitchen layout", "Ask about roof age", "Compare school distance"].map((note) => (
          <div key={note} className="flex items-center gap-3 rounded-2xl bg-brand-50 px-3 py-3 text-sm text-brand-800">
            <CheckSquare className="h-4 w-4 shrink-0 text-brand-600" />
            <span>{note}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-dashed border-brand-200 bg-brand-50/70 px-3 py-4 text-sm text-brand-600">
        Add questions, pros, cons, or next steps...
      </div>
    </div>
  );
}

function ShowingsMockup() {
  return (
    <div className="rounded-[1.25rem] border border-brand-100 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-3 border-b border-brand-100 pb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">
        <span>Property</span>
        <span>Date</span>
        <span>Status</span>
      </div>
      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-3 py-4 text-sm text-brand-800">
        <div className="min-w-0">
          <p className="truncate font-semibold text-brand-900">Bayview family home</p>
          <p className="mt-1 text-xs text-brand-600">Richmond Hill</p>
        </div>
        <div>
          <p className="font-semibold">Aug 3</p>
          <p className="mt-1 text-xs text-brand-600">12:00 p.m.</p>
        </div>
        <span className="self-start rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
          Pending
        </span>
      </div>
      <div className="rounded-2xl bg-brand-50 px-3 py-3 text-sm text-brand-700">
        Showing requests appear here after a private tour is booked.
      </div>
    </div>
  );
}
