import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Guides",
  description: "Helpful information for buying, renting, and preparing your next move in Ontario."
};

export default function GuidesPage() {
  return (
    <section className="site-container py-14 sm:py-16">
      <div className="mx-auto max-w-4xl rounded-3xl border border-brand-100 bg-white p-8 shadow-soft sm:p-10">
        <h1 className="font-heading text-4xl text-brand-900">Guides</h1>
        <p className="mt-3 text-brand-700">
          Helpful information for buying, renting, and preparing your next move in Ontario.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/guides/buying" className="rounded-2xl border border-brand-100 p-5 transition hover:border-brand-300">
            <h2 className="font-heading text-2xl text-brand-900">Buying Guide</h2>
            <p className="mt-2 text-sm text-brand-700">Steps to Buy a Home in Ontario</p>
          </Link>
          <Link href="/guides/leasing" className="rounded-2xl border border-brand-100 p-5 transition hover:border-brand-300">
            <h2 className="font-heading text-2xl text-brand-900">Leasing Guide</h2>
            <p className="mt-2 text-sm text-brand-700">Steps to Rent a Home in Ontario</p>
          </Link>
          <Link href="/guides/lease-documents" className="rounded-2xl border border-brand-100 p-5 transition hover:border-brand-300">
            <h2 className="font-heading text-2xl text-brand-900">Lease Documents</h2>
            <p className="mt-2 text-sm text-brand-700">What to prepare before booking rental showings</p>
          </Link>
        </div>
      </div>
    </section>
  );
}
