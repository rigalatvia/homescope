import type { Metadata } from "next";
import Link from "next/link";

const LEASING_STEPS = [
  { title: "Prepare Your Documents", description: "Organize income proof, credit report, employment letter, and references." },
  { title: "Set Your Budget", description: "Define monthly rent limits and expected utilities or additional costs." },
  { title: "Search Listings", description: "Review available rental options by location, layout, and amenities." },
  { title: "Book a Showing", description: "Visit shortlisted properties and compare fit, condition, and commute." },
  { title: "Submit Application", description: "Provide a complete rental package quickly for competitive listings." },
  { title: "Landlord Review", description: "Allow time for document checks and rental application review." },
  { title: "Sign Lease Agreement", description: "Review lease terms carefully before signing and paying deposits." },
  { title: "Move In", description: "Confirm move-in logistics and complete your final walkthrough." }
];

export const metadata: Metadata = {
  title: "Leasing Guide",
  description: "Steps to rent a home in Ontario, from preparing documents to move-in."
};

export default function LeasingGuidePage() {
  return (
    <section className="site-container py-14 sm:py-16">
      <div className="mx-auto max-w-4xl rounded-3xl border border-brand-100 bg-white p-8 shadow-soft sm:p-10">
        <h1 className="font-heading text-4xl text-brand-900">Steps to Rent a Home in Ontario</h1>
        <div className="mt-8 space-y-4">
          {LEASING_STEPS.map((step, index) => (
            <article key={step.title} className="rounded-2xl border border-brand-100 bg-brand-50/40 p-5">
              <h2 className="font-semibold text-brand-900">
                {index + 1}. {step.title}
              </h2>
              <p className="mt-2 text-sm text-brand-700">{step.description}</p>
            </article>
          ))}
        </div>
        <div className="mt-10 rounded-2xl bg-brand-900 px-6 py-7 text-white">
          <p className="text-lg font-semibold">Looking for a rental?</p>
          <p className="mt-2 text-sm text-brand-100">
            Review required documents before booking showings in our{" "}
            <Link href="/guides/lease-documents" className="underline decoration-white/70 underline-offset-2 hover:decoration-white">
              Lease Documents guide
            </Link>
            .
          </p>
          <Link
            href="/listings"
            className="mt-4 inline-flex rounded-full bg-white px-5 py-2 text-sm font-semibold text-brand-900 transition hover:bg-brand-50"
          >
            View Rentals
          </Link>
        </div>
      </div>
    </section>
  );
}
