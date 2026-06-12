import type { Metadata } from "next";
import { Calculator, FileText, Landmark, ShieldCheck } from "lucide-react";
import { CTASection } from "@/components/guides/cta-section";
import { FAQSection } from "@/components/guides/faq-section";
import {
  GuideDarkHighlight,
  GuideQuickChecklist,
  GuideSectionCard
} from "@/components/guides/guide-content-blocks";
import { GuidePageLayout } from "@/components/guides/guide-page-layout";
import { LandTransferTaxCalculator } from "@/components/guides/land-transfer-tax-calculator";
import { SITE_CONFIG } from "@/config/site";
import { buildPageMetadata } from "@/lib/seo/metadata";

const faqItems = [
  {
    question: "Does Toronto have a second land transfer tax?",
    answer:
      "Yes. Buyers in the City of Toronto generally pay Ontario land transfer tax plus Toronto municipal land transfer tax. Some buyers may qualify for rebates."
  },
  {
    question: "What is the Ontario first-time buyer land transfer tax rebate?",
    answer:
      "Eligible first-time buyers may receive an Ontario land transfer tax refund up to $4,000. Eligibility should be confirmed with official sources and your lawyer."
  },
  {
    question: "What does this calculator exclude?",
    answer:
      "This calculator excludes legal fees, title insurance, adjustments, HST issues, non-resident speculation taxes, lender costs, moving costs, and other closing expenses."
  },
  {
    question: "Are the Toronto high-value rates included?",
    answer:
      "The calculator includes a toggle for Toronto high-value single-family residential MLTT rates effective April 1, 2026. Verify the property type and official rates before relying on an estimate."
  }
];

export const metadata: Metadata = buildPageMetadata({
  title: "Ontario Land Transfer Tax Calculator & Toronto LTT Guide | HomeScope GTA",
  description:
    "Estimate Ontario land transfer tax and Toronto municipal land transfer tax. Learn how rebates, purchase price, and Toronto's double land transfer tax affect closing costs.",
  path: "/guides/land-transfer-tax-calculator-ontario",
  type: "article"
});

export default function LandTransferTaxCalculatorOntarioPage() {
  const url = `${SITE_CONFIG.baseUrl}/guides/land-transfer-tax-calculator-ontario`;

  return (
    <GuidePageLayout
      title="Ontario Land Transfer Tax Calculator and Toronto LTT Guide"
      intro="Land transfer tax is one of the largest closing costs Ontario buyers need to plan for. Use this calculator to estimate Ontario land transfer tax and, for City of Toronto purchases, municipal land transfer tax as well."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Guides", href: "/guides" },
        { label: "Ontario Land Transfer Tax Calculator" }
      ]}
      relatedLinks={[
        { href: "/", label: "Home", description: "Return to the main HomeScope GTA experience." },
        { href: "/guides", label: "All Guides", description: "Browse more Ontario buyer and renter resources." },
        { href: "/guides/first-time-home-buyer-ontario", label: "First-Time Buyer Checklist", description: "See where land transfer tax fits into the buying process." },
        { href: "/guides/documents-needed-buy-house-toronto", label: "Toronto Buyer Documents", description: "Prepare mortgage and legal paperwork before closing." },
        { href: "/listings", label: "Listings", description: "Search active GTA listings while planning closing costs." }
      ]}
      articleSchema={{
        title: "Ontario Land Transfer Tax Calculator and Toronto LTT Guide",
        description: metadata.description as string,
        url
      }}
      faqItems={faqItems}
    >
      <LandTransferTaxCalculator />

      <div className="mt-10 grid gap-5">
        <GuideQuickChecklist
          eyebrow="Closing Cost Planning"
          title="What to know before estimating land transfer tax"
          description="Land transfer tax depends on the purchase price, location, property type, and rebate eligibility. Toronto buyers need to budget for both provincial and municipal land transfer tax."
          items={[
            "Ontario land transfer tax applies across the province",
            "Toronto purchases can trigger an additional municipal land transfer tax",
            "Eligible first-time buyers may qualify for rebates",
            "High-value Toronto single-family residential purchases have higher MLTT brackets",
            "Your lawyer should confirm the final amount before closing"
          ]}
          icon={Calculator}
        />

        <GuideSectionCard
          eyebrow="Ontario Tax"
          title="How Ontario land transfer tax works"
          description="Ontario land transfer tax is calculated using marginal brackets. That means each part of the purchase price is taxed at its own bracket rate, rather than applying one rate to the whole purchase price."
          bullets={[
            "The first portion of the price is taxed at the lowest rate",
            "Higher portions are taxed at higher marginal rates",
            "Eligible first-time buyers may receive a refund up to $4,000",
            "Final tax treatment should be confirmed with your lawyer"
          ]}
          icon={Landmark}
        />

        <GuideSectionCard
          eyebrow="Toronto Tax"
          title="Toronto buyers should budget for a second land transfer tax"
          description="The City of Toronto applies municipal land transfer tax in addition to Ontario land transfer tax. Toronto also introduced higher graduated MLTT rates for high-value residential properties containing one or two single-family residences, effective April 1, 2026."
          bullets={[
            "Toronto MLTT is separate from Ontario land transfer tax",
            "Eligible first-time buyers may qualify for a Toronto rebate",
            "High-value single-family residential properties can use higher Toronto brackets",
            "Non-resident speculation taxes are not included in this calculator"
          ]}
          icon={FileText}
        />

        <GuideDarkHighlight
          eyebrow="Important"
          title="Use this as a planning estimate, not a legal calculation"
          description="Land transfer tax can be affected by property type, buyer eligibility, residency, exemptions, and closing details. Use the calculator to plan your budget, then verify the final amount with your lawyer and official government resources."
          icon={ShieldCheck}
        />
      </div>

      <section className="not-prose mt-10 rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
        <h2 className="font-heading text-3xl text-brand-900">Official Resources</h2>
        <p className="mt-3 text-sm leading-7 text-brand-700 sm:text-base">
          Review official resources before relying on any closing-cost estimate:
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="https://www.ontario.ca/document/land-transfer-tax"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900 transition hover:bg-brand-50"
          >
            Ontario Land Transfer Tax
          </a>
          <a
            href="https://www.toronto.ca/services-payments/property-taxes-utilities/municipal-land-transfer-tax-mltt/municipal-land-transfer-tax-mltt-rates-and-fees/"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900 transition hover:bg-brand-50"
          >
            Toronto MLTT Rates
          </a>
        </div>
      </section>

      <FAQSection items={faqItems} />

      <CTASection
        title="Planning a purchase?"
        description="Use current listings and buyer guides together so your search, budget, and closing-cost planning stay aligned."
        links={[
          { href: "/listings", label: "Browse Listings" },
          { href: "/guides/first-time-home-buyer-ontario", label: "Buyer Checklist", variant: "secondary" }
        ]}
      />
    </GuidePageLayout>
  );
}
