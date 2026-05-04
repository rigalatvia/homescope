import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, ClipboardCheck, FolderKanban, KeyRound } from "lucide-react";
import { FeaturedListingsPreview } from "@/components/home/featured-listings-preview";
import { HeroSection } from "@/components/home/hero";
import { ServiceAreasSection } from "@/components/home/service-areas";
import { ValuePointsSection } from "@/components/home/value-points";
import { getFeaturedListings } from "@/lib/listings/service";

const FEATURED_GUIDES = [
  {
    href: "/guides/first-time-home-buyer-ontario",
    title: "First Time Home Buyer Checklist Ontario",
    description: "A step-by-step roadmap for financing, house hunting, offers, and closing.",
    icon: ClipboardCheck
  },
  {
    href: "/guides/documents-needed-buy-house-toronto",
    title: "Documents Needed to Buy a House in Toronto",
    description: "The core mortgage, legal, and purchase paperwork buyers should prepare.",
    icon: BriefcaseBusiness
  },
  {
    href: "/guides/leasing",
    title: "Ontario Leasing Guide",
    description: "A practical leasing flow from showings and applications to signing and move-in.",
    icon: KeyRound
  },
  {
    href: "/guides/lease-documents",
    title: "Lease Documents for Ontario Rentals",
    description: "The supporting documents renters often need before they apply.",
    icon: FolderKanban
  }
] as const;

export const metadata: Metadata = {
  title: "GTA Real Estate Listings",
  description:
    "Search GTA real estate listings across Toronto, Vaughan, Richmond Hill, Aurora, Newmarket, and King. Browse homes for sale and lease with HomeScope GTA."
};

export default async function HomePage() {
  const featuredListings = (await getFeaturedListings()).slice(0, 3);

  return (
    <>
      <HeroSection />
      <ServiceAreasSection />
      <ValuePointsSection />
      <section className="site-container py-8 sm:py-10">
        <div className="rounded-[2rem] border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-6 shadow-soft sm:p-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Buyer Resource</p>
            <h2 className="mt-2 font-heading text-3xl text-brand-900 sm:text-4xl">First Time Buying in Ontario?</h2>
            <p className="mt-3 text-base leading-8 text-brand-700">
              Buying your first home can feel overwhelming, especially when you are trying to understand budget,
              mortgage pre-approval, showings, offers, and closing steps. Start with our simple{" "}
              <Link
                href="/guides/first-time-home-buyer-ontario"
                className="font-semibold text-brand-900 underline underline-offset-4"
              >
                First-Time Buyer Checklist Ontario
              </Link>{" "}
              before you begin touring homes.
            </p>
            <div className="mt-6">
              <Link
                href="/guides/first-time-home-buyer-ontario"
                className="inline-flex items-center gap-2 rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
              >
                Read the First-Time Buyer Checklist
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-4 text-sm leading-7 text-brand-700 sm:text-base">
              Already working on approvals and lender paperwork? Review{" "}
              <Link
                href="/guides/documents-needed-buy-house-toronto"
                className="font-semibold text-brand-900 underline underline-offset-4"
              >
                Documents Needed to Buy a House in Toronto
              </Link>{" "}
              before you start comparing serious options.
            </p>
          </div>
        </div>
      </section>
      <FeaturedListingsPreview listings={featuredListings} />
      <section className="site-container py-8 sm:py-12">
        <div className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Featured Guides</p>
              <h2 className="mt-2 font-heading text-3xl text-brand-900 sm:text-4xl">
                Buyer and renter resources worth reading before your next move
              </h2>
              <p className="mt-3 text-base leading-8 text-brand-700">
                These are some of the most useful pages on HomeScope GTA for preparing documents, understanding the
                process, and moving faster once the right listing appears.
              </p>
            </div>
            <Link
              href="/guides"
              className="inline-flex items-center gap-2 rounded-full border border-brand-200 px-5 py-3 text-sm font-semibold text-brand-900 transition hover:border-brand-300 hover:bg-brand-50"
            >
              View All Guides
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {FEATURED_GUIDES.map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="group rounded-[2rem] border border-brand-100 bg-brand-50/40 p-5 transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-white"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand-900 shadow-soft">
                  <guide.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-heading text-2xl text-brand-900">{guide.title}</h3>
                <p className="mt-3 text-sm leading-7 text-brand-700">{guide.description}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-900">
                  Read guide
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="site-container pb-20 pt-4">
        <div className="rounded-3xl bg-brand-900 px-8 py-12 text-white sm:px-10 sm:py-14">
          <h2 className="font-heading text-3xl">Start Your Search with HomeScope GTA</h2>
          <p className="mt-3 max-w-2xl text-brand-100">
            Browse listings, explore key GTA markets, and request a private showing through a streamlined, modern
            experience.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/listings"
              className="inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-900 transition hover:bg-brand-50"
            >
              Browse Listings
            </Link>
            <Link
              href="/contact"
              className="inline-block rounded-full border border-white/50 px-6 py-3 text-sm font-semibold text-white transition hover:border-white"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
