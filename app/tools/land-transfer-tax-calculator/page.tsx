import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calculator } from "lucide-react";
import { Breadcrumbs } from "@/components/guides/breadcrumbs";
import { LandTransferTaxCalculator } from "@/components/guides/land-transfer-tax-calculator";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Land Transfer Tax Calculator | HomeScope GTA",
  description:
    "Estimate Ontario land transfer tax and Toronto municipal land transfer tax with first-time buyer rebate options.",
  path: "/tools/land-transfer-tax-calculator"
});

export default function LandTransferTaxCalculatorToolPage() {
  return (
    <main className="site-container py-12 sm:py-16">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Tools", href: "/tools" },
          { label: "Land Transfer Tax Calculator" }
        ]}
      />

      <section className="rounded-lg border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Closing Cost Tool</p>
        <h1 className="mt-3 font-heading text-4xl text-brand-900 sm:text-5xl">Land Transfer Tax Calculator</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-brand-700">
          Estimate Ontario land transfer tax, Toronto municipal land transfer tax, and first-time buyer rebate scenarios
          before you compare closing costs.
        </p>
      </section>

      <div className="mt-8">
        <LandTransferTaxCalculator />
      </div>

      <section className="mt-8 flex flex-wrap gap-3 rounded-lg border border-brand-100 bg-white p-5 shadow-soft">
        <Link
          href="/tools/mortgage-calculator"
          className="inline-flex items-center gap-2 rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900 transition hover:bg-brand-50"
        >
          <Calculator className="h-4 w-4" />
          Mortgage Calculator
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
