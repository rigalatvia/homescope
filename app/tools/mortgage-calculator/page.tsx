import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Landmark } from "lucide-react";
import { Breadcrumbs } from "@/components/guides/breadcrumbs";
import { MortgagePaymentCalculator } from "@/components/guides/mortgage-payment-calculator";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Mortgage Payment Calculator | HomeScope GTA",
  description:
    "Estimate monthly mortgage principal, interest, and common carrying costs for Ontario and GTA homes.",
  path: "/tools/mortgage-calculator"
});

export default function MortgageCalculatorToolPage() {
  return (
    <main className="site-container py-12 sm:py-16">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Tools", href: "/tools" },
          { label: "Mortgage Calculator" }
        ]}
      />

      <section className="rounded-lg border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Payment Tool</p>
        <h1 className="mt-3 font-heading text-4xl text-brand-900 sm:text-5xl">Mortgage Payment Calculator</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-brand-700">
          Estimate monthly principal and interest, then add property tax, condo fees, and heating assumptions to compare
          a broader monthly carrying cost.
        </p>
      </section>

      <div className="mt-8">
        <MortgagePaymentCalculator />
      </div>

      <section className="mt-8 flex flex-wrap gap-3 rounded-lg border border-brand-100 bg-white p-5 shadow-soft">
        <Link
          href="/tools/land-transfer-tax-calculator"
          className="inline-flex items-center gap-2 rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900 transition hover:bg-brand-50"
        >
          <Landmark className="h-4 w-4" />
          Land Transfer Tax
        </Link>
        <Link
          href="/listings"
          className="inline-flex items-center gap-2 rounded-full bg-brand-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
        >
          Browse Listings
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}
