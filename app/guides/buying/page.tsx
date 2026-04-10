import type { Metadata } from "next";
import Link from "next/link";

const BUYING_STEPS = [
  { title: "Get Pre-Approved", description: "Confirm your budget early so your search stays focused and realistic." },
  { title: "Define Your Needs", description: "Set your must-haves, nice-to-haves, and preferred neighborhoods." },
  { title: "Start Your Search", description: "Review active listings and compare value, location, and property features." },
  { title: "Book Showings", description: "Tour shortlisted homes and evaluate condition, layout, and fit for your lifestyle." },
  { title: "Make an Offer", description: "Submit an offer with pricing and terms aligned to market conditions." },
  { title: "Home Inspection", description: "Assess the property’s condition and identify any risks before finalizing." },
  { title: "Finalize Financing", description: "Work with your lender to secure final mortgage approval and conditions." },
  { title: "Closing", description: "Complete legal paperwork, transfer funds, and take possession of your new home." }
];

export const metadata: Metadata = {
  title: "Buying Guide",
  description: "Steps to buy a home in Ontario, from pre-approval to closing."
};

export default function BuyingGuidePage() {
  return (
    <section className="site-container py-14 sm:py-16">
      <div className="mx-auto max-w-4xl rounded-3xl border border-brand-100 bg-white p-8 shadow-soft sm:p-10">
        <h1 className="font-heading text-4xl text-brand-900">Steps to Buy a Home in Ontario</h1>
        <div className="mt-8 space-y-4">
          {BUYING_STEPS.map((step, index) => (
            <article key={step.title} className="rounded-2xl border border-brand-100 bg-brand-50/40 p-5">
              <h2 className="font-semibold text-brand-900">
                {index + 1}. {step.title}
              </h2>
              <p className="mt-2 text-sm text-brand-700">{step.description}</p>
            </article>
          ))}
        </div>
        <div className="mt-10 rounded-2xl bg-brand-900 px-6 py-7 text-white">
          <p className="text-lg font-semibold">Ready to start your home search?</p>
          <Link
            href="/listings"
            className="mt-4 inline-flex rounded-full bg-white px-5 py-2 text-sm font-semibold text-brand-900 transition hover:bg-brand-50"
          >
            Browse Listings
          </Link>
        </div>
      </div>
    </section>
  );
}
