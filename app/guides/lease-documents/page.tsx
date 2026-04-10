import type { Metadata } from "next";
import Link from "next/link";

const LEASE_DOCS = [
  {
    title: "Proof of Income",
    description: "Recent pay stubs, bank statements, or other documents that verify your monthly income."
  },
  {
    title: "Credit Report",
    description: "A current credit report helps landlords assess payment history and financial reliability."
  },
  {
    title: "Employment Letter",
    description: "A signed letter confirming your role, compensation, and employment status."
  },
  {
    title: "References",
    description: "Personal or landlord references that support your rental application."
  }
];

export const metadata: Metadata = {
  title: "Lease Documents",
  description: "Required documents to prepare before booking and applying for a rental home in Ontario."
};

export default function LeaseDocumentsGuidePage() {
  return (
    <section className="site-container py-14 sm:py-16">
      <div className="mx-auto max-w-4xl rounded-3xl border border-brand-100 bg-white p-8 shadow-soft sm:p-10">
        <h1 className="font-heading text-4xl text-brand-900">Lease Documents for Ontario Rentals</h1>
        <p className="mt-3 text-brand-700">
          Preparing these documents in advance can help you move faster when booking showings and submitting rental applications.
        </p>

        <div className="mt-8 space-y-4">
          {LEASE_DOCS.map((item, index) => (
            <article key={item.title} className="rounded-2xl border border-brand-100 bg-brand-50/40 p-5">
              <h2 className="font-semibold text-brand-900">
                {index + 1}. {item.title}
              </h2>
              <p className="mt-2 text-sm text-brand-700">{item.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-brand-900 px-6 py-7 text-white">
          <p className="text-lg font-semibold">Ready to view rental options?</p>
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
