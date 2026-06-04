import Link from "next/link";
import { ArrowRight, GraduationCap, Megaphone, Search, Star } from "lucide-react";

export function SchoolSearchAd() {
  return (
    <section className="site-container py-6 sm:py-8">
      <div className="rounded-3xl border border-brand-100 bg-white p-4 shadow-soft sm:p-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex min-w-0 gap-4">
            <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-900 text-white sm:inline-flex">
              <Megaphone className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">
                <Star className="h-3.5 w-3.5" />
                New Feature Announcement
              </p>
              <h2 className="mt-3 font-heading text-2xl leading-tight text-brand-900 sm:text-3xl">
                Search homes by school.
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-brand-700 sm:text-base">
                Filter 1,007 school records by name, city, board, or level, then select a school to see nearby homes and
                ranking details.
              </p>
            </div>
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
    </section>
  );
}
