import Link from "next/link";
import { ArrowRight, Search, Star } from "lucide-react";
import { DesktopDashboardPreview } from "@/components/home/desktop-dashboard-preview";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-hero-gradient py-6 sm:py-10 lg:py-16">
      <div className="site-container relative">
        <div className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.8fr)] lg:items-center lg:gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700 sm:text-sm sm:tracking-[0.24em]">
              ONTARIO REAL ESTATE
            </p>
            <h1 className="mt-2 max-w-3xl font-heading text-4xl leading-tight text-brand-900 sm:mt-3 sm:text-5xl">
              Find Your Next Home in the GTA
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-brand-800 sm:mt-5 sm:text-lg">
              Browse curated public listings across Vaughan, Richmond Hill, Aurora, Newmarket, King, and Toronto through a
              clean, modern home search experience.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-8 sm:flex sm:flex-wrap">
              <Link
                href="/listings"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-800 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-700 sm:rounded-full sm:px-6"
              >
                Browse Listings
              </Link>
              <Link
                href="/contact"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-300 bg-white/70 px-4 py-3 text-center text-sm font-semibold text-brand-900 transition hover:bg-white sm:rounded-full sm:px-6"
              >
                Contact Us
              </Link>
            </div>
          </div>
          <div className="hidden lg:block">
            <DesktopDashboardPreview />
          </div>
        </div>
        <div className="mt-5 max-w-4xl rounded-2xl border border-brand-100 bg-white/80 p-4 shadow-soft backdrop-blur sm:mt-6 sm:rounded-3xl sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">
                <Star className="h-3.5 w-3.5" />
                New Feature Announcement
              </p>
              <p className="mt-2 text-sm leading-6 text-brand-700 sm:text-base">
                <span className="font-semibold text-brand-900">Search homes by school.</span> Filter 1,007 school
                records, then see nearby homes and ranking details.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <div className="inline-flex min-w-0 items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700">
                <Search className="h-4 w-4 shrink-0 text-brand-500" />
                <span className="truncate">Moraine Hills, Bayview, IB...</span>
              </div>
              <Link
                href="/schools"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
              >
                Try School Search
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
