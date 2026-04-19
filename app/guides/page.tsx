import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/guides/breadcrumbs";

const GUIDE_CARDS = [
  {
    href: "/guides/first-time-home-buyer-ontario",
    title: "First Time Home Buyer Checklist Ontario",
    description: "A step-by-step Ontario buying roadmap covering pre-approval, house hunting, offers, and closing."
  },
  {
    href: "/guides/documents-needed-buy-house-toronto",
    title: "Documents Needed to Buy a House in Toronto",
    description: "A buyer-focused document checklist for Toronto purchases, mortgage approvals, and closing."
  },
  {
    href: "/guides/organize-real-estate-documents-canada",
    title: "How to Organize Real Estate Documents in Canada",
    description: "A practical system for keeping buyer, renter, and homeowner paperwork organized in one place."
  },
  {
    href: "/guides/rental-application-ontario",
    title: "Rental Application Ontario - Download Form 410",
    description: "Download the Ontario rental application form and learn which leasing documents to prepare in advance."
  },
  {
    href: "/guides/buying",
    title: "Ontario Home Buying Guide",
    description: "Review the key milestones in a home purchase, from pre-approval to taking possession."
  },
  {
    href: "/guides/leasing",
    title: "Ontario Leasing Guide",
    description: "Understand the rental journey, including showings, applications, approvals, and move-in preparation."
  },
  {
    href: "/guides/lease-documents",
    title: "Lease Documents for Ontario Rentals",
    description: "See the core documents renters often gather before applying for a lease in Ontario."
  }
];

export const metadata: Metadata = {
  title: {
    absolute: "Ontario Real Estate Guides | HomeScope GTA - Real Estate Listings & Document Hub Ontario"
  },
  description:
    "Explore Ontario real estate guides for first-time buyers, Toronto purchase documents, rental applications, and organizing property paperwork."
};

export default function GuidesPage() {
  return (
    <section className="site-container py-12 sm:py-16">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-10">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Guides" }]} />

        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Resource Library</p>
          <h1 className="mt-3 font-heading text-4xl text-brand-900 sm:text-5xl">Ontario Real Estate Guides and Document Resources</h1>
          <p className="mt-4 text-base leading-8 text-brand-700 sm:text-lg">
            Explore buyer and renter guides designed for Ontario clients who want a clearer process, stronger document
            preparation, and easier next steps when browsing homes through HomeScope GTA.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {GUIDE_CARDS.map((guide) => (
            <Link
              key={guide.href}
              href={guide.href}
              className="rounded-3xl border border-brand-100 bg-brand-50/40 p-6 transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-white"
            >
              <h2 className="font-heading text-2xl text-brand-900">{guide.title}</h2>
              <p className="mt-3 text-sm leading-7 text-brand-700">{guide.description}</p>
              <span className="mt-5 inline-flex text-sm font-semibold text-brand-900">Read guide</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
