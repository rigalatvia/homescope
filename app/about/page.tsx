import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenText, GraduationCap, Home, MapPinned, ShieldCheck } from "lucide-react";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "About HomeScope GTA | GTA Real Estate Search & School-Area Research",
  description:
    "Learn about HomeScope GTA, a real estate search and education platform for GTA listings, school-area research, and Ontario buyer and renter guides.",
  path: "/about"
});

const HELP_AREAS = [
  {
    title: "Search homes for sale and lease",
    description: "Browse public listing details across Toronto, Vaughan, Richmond Hill, Aurora, Newmarket, and King.",
    icon: Home
  },
  {
    title: "Compare school-area context",
    description: "Use school profiles and nearby listing matches as a starting point for more focused research.",
    icon: GraduationCap
  },
  {
    title: "Explore local market pages",
    description: "Review city pages that connect current inventory, schools, and practical next steps.",
    icon: MapPinned
  },
  {
    title: "Prepare with Ontario guides",
    description: "Read buyer, leasing, rental application, and document checklists before important decisions.",
    icon: BookOpenText
  }
] as const;

export default function AboutPage() {
  return (
    <section className="site-container py-12 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">About HomeScope GTA</p>
          <h1 className="mt-3 max-w-4xl font-heading text-4xl text-brand-900 sm:text-5xl">
            A clearer way to explore GTA homes, schools, and next steps.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-brand-700 sm:text-lg">
            HomeScope GTA is a real estate search and education platform for people exploring homes across Toronto,
            Vaughan, Richmond Hill, Aurora, Newmarket, and King. The HomeScope GTA team built this site to make the
            search process easier to compare: listings, nearby school information, local market pages, and practical
            Ontario real estate guides in one place.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {HELP_AREAS.map((item) => (
              <div key={item.title} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-soft">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-900">
                  <item.icon className="h-5 w-5" />
                </span>
                <h2 className="mt-4 font-heading text-2xl text-brand-900">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-brand-700">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-2xl border border-brand-100 bg-brand-50/70 p-6 shadow-soft">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white text-brand-900">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-heading text-2xl text-brand-900">Transparency Notes</h2>
          <div className="mt-4 space-y-4 text-sm leading-6 text-brand-700">
            <p>
              HomeScope GTA is not a brokerage and does not represent itself as a school board, government body, or
              official school boundary authority.
            </p>
            <p>
              Listing availability, pricing, photos, and property details can change and should be confirmed before
              making decisions.
            </p>
            <p>
              School information is provided as a research aid. Boundaries, programs, holding areas, and eligibility
              should be verified directly with the relevant school board.
            </p>
          </div>
        </aside>
      </div>

      <section className="mt-12 rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">How To Use HomeScope GTA</p>
        <h2 className="mt-3 font-heading text-3xl text-brand-900">Start broad, then narrow with better context.</h2>
        <p className="mt-3 max-w-3xl leading-8 text-brand-700">
          Many people begin with a city, price range, or school name. HomeScope GTA is designed to help you move from
          that first search into more specific comparisons, whether you are browsing listings, checking nearby schools,
          or preparing buyer and renter documents.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            Browse Listings
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/schools"
            className="inline-flex items-center gap-2 rounded-full border border-brand-200 px-5 py-3 text-sm font-semibold text-brand-900 transition hover:border-brand-300 hover:bg-brand-50"
          >
            Search Schools
          </Link>
          <Link
            href="/guides"
            className="inline-flex items-center gap-2 rounded-full border border-brand-200 px-5 py-3 text-sm font-semibold text-brand-900 transition hover:border-brand-300 hover:bg-brand-50"
          >
            Read Guides
          </Link>
        </div>
      </section>
    </section>
  );
}
