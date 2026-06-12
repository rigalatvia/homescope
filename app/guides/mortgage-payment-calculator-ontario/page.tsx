import type { Metadata } from "next";
import { Calculator, Home, Landmark, ShieldCheck } from "lucide-react";
import { CTASection } from "@/components/guides/cta-section";
import { FAQSection } from "@/components/guides/faq-section";
import { GuideDarkHighlight, GuideQuickChecklist, GuideSectionCard } from "@/components/guides/guide-content-blocks";
import { GuidePageLayout } from "@/components/guides/guide-page-layout";
import { MortgagePaymentCalculator } from "@/components/guides/mortgage-payment-calculator";
import { SITE_CONFIG } from "@/config/site";
import { buildPageMetadata } from "@/lib/seo/metadata";

const faqItems = [
  {
    question: "What does this mortgage calculator estimate?",
    answer:
      "It estimates monthly principal and interest, then adds optional monthly carrying costs such as property tax, condo fees, and heating."
  },
  {
    question: "Does this calculator decide mortgage approval?",
    answer:
      "No. Mortgage approval depends on lender rules, income, credit, debt, down payment, stress-test requirements, property details, and other factors."
  },
  {
    question: "Does the estimate include mortgage insurance?",
    answer:
      "No. Mortgage default insurance is not included. Buyers with smaller down payments should confirm insurance premiums and qualification details with a mortgage professional."
  },
  {
    question: "Should I use this before booking showings?",
    answer:
      "Yes, as a planning tool. It can help compare carrying costs across listings, but a pre-approval and lender review are still important before making an offer."
  }
];

export const metadata: Metadata = buildPageMetadata({
  title: "Ontario Mortgage Payment Calculator | HomeScope GTA",
  description:
    "Estimate monthly mortgage payments, down payment, principal and interest, and common carrying costs for Ontario and GTA homes.",
  path: "/guides/mortgage-payment-calculator-ontario",
  type: "article"
});

export default function MortgagePaymentCalculatorOntarioPage() {
  const url = `${SITE_CONFIG.baseUrl}/guides/mortgage-payment-calculator-ontario`;

  return (
    <GuidePageLayout
      title="Ontario Mortgage Payment Calculator"
      intro="Estimate monthly mortgage payments and carrying costs before comparing GTA homes. Adjust purchase price, down payment, interest rate, amortization, term, property tax, condo fees, and heating assumptions."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Guides", href: "/guides" },
        { label: "Ontario Mortgage Payment Calculator" }
      ]}
      relatedLinks={[
        { href: "/", label: "Home", description: "Return to the main HomeScope GTA experience." },
        { href: "/guides", label: "All Guides", description: "Browse more Ontario buyer and renter resources." },
        { href: "/guides/land-transfer-tax-calculator-ontario", label: "Land Transfer Tax Calculator", description: "Estimate another major Ontario closing cost." },
        { href: "/guides/first-time-home-buyer-ontario", label: "First-Time Buyer Checklist", description: "See where payment planning fits into the buying process." },
        { href: "/listings", label: "Listings", description: "Search active GTA listings while comparing affordability." }
      ]}
      articleSchema={{
        title: "Ontario Mortgage Payment Calculator",
        description: metadata.description as string,
        url
      }}
      faqItems={faqItems}
    >
      <MortgagePaymentCalculator />

      <div className="mt-10 grid gap-5">
        <GuideQuickChecklist
          eyebrow="Payment Planning"
          title="What to review before comparing monthly payments"
          description="A mortgage payment is only one part of ownership cost. Use the calculator to compare scenarios, then confirm approval and final numbers with qualified professionals."
          items={[
            "Purchase price and expected down payment",
            "Current interest-rate quote or pre-approval assumptions",
            "Amortization period and mortgage term",
            "Property tax and condo fee estimates",
            "Heating, insurance, maintenance, and other ownership costs"
          ]}
          icon={Calculator}
        />

        <GuideSectionCard
          eyebrow="Mortgage Basics"
          title="Principal and interest are only the starting point"
          description="The calculator separates principal and interest from other monthly costs so buyers can see the difference between mortgage payment and broader carrying cost."
          bullets={[
            "Higher down payments reduce the mortgage amount",
            "Longer amortizations usually lower monthly payments but increase total interest over time",
            "Interest rates can change before renewal",
            "Condo fees and property taxes can materially change affordability"
          ]}
          icon={Landmark}
        />

        <GuideSectionCard
          eyebrow="Listing Research"
          title="Use payment estimates while comparing homes"
          description="Embedding payment estimates into the listing research process helps buyers compare homes by monthly carrying cost, not just sticker price."
          bullets={[
            "Compare similar homes with different taxes or condo fees",
            "Estimate monthly cost before requesting a showing",
            "Keep payment estimates beside saved homes and buyer documents",
            "Use pre-approval numbers for more realistic comparisons"
          ]}
          icon={Home}
        />

        <GuideDarkHighlight
          eyebrow="Important"
          title="Use this as a planning estimate, not financing advice"
          description="This calculator does not replace mortgage pre-approval, lender qualification, legal advice, insurance quotes, or tax advice. Use it to understand scenarios, then verify your numbers before making decisions."
          icon={ShieldCheck}
        />
      </div>

      <FAQSection items={faqItems} />

      <CTASection
        title="Ready to compare homes by monthly cost?"
        description="Use the calculator beside current listings so price, payment, and closing-cost planning stay connected."
        links={[
          { href: "/listings", label: "Browse Listings" },
          { href: "/guides/land-transfer-tax-calculator-ontario", label: "Land Transfer Tax Calculator", variant: "secondary" }
        ]}
      />
    </GuidePageLayout>
  );
}
