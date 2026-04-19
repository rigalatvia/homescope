import type { Metadata } from "next";
import { CTASection } from "@/components/guides/cta-section";
import { FAQSection } from "@/components/guides/faq-section";
import { GuidePageLayout } from "@/components/guides/guide-page-layout";
import { SITE_CONFIG } from "@/config/site";

const faqItems = [
  {
    question: "How much down payment do I need in Ontario?",
    answer:
      "The minimum down payment depends on purchase price and lending rules. Many first-time buyers start with the minimum permitted by their lender, but they should also budget for closing costs, inspections, legal fees, and moving expenses."
  },
  {
    question: "What documents should first-time buyers keep?",
    answer:
      "Keep mortgage pre-approval letters, pay stubs, tax returns, proof of down payment, signed offers, inspection reports, lawyer correspondence, insurance details, and final closing documents in one organized system."
  },
  {
    question: "Why is mortgage pre-approval important?",
    answer:
      "Mortgage pre-approval helps Ontario buyers understand their real budget before touring homes. It also shows sellers you are serious and can move more quickly when you find the right property."
  }
];

export const metadata: Metadata = {
  title: {
    absolute: "First Time Home Buyer Checklist Ontario | HomeScope GTA - Real Estate Listings & Document Hub Ontario"
  },
  description:
    "Step-by-step checklist for first time home buyers in Ontario. Learn how to prepare finances, get pre-approved, search for homes, and close your purchase smoothly."
};

export default function FirstTimeHomeBuyerOntarioPage() {
  const url = `${SITE_CONFIG.baseUrl}/guides/first-time-home-buyer-ontario`;

  return (
    <GuidePageLayout
      title="First Time Home Buyer Checklist in Ontario"
      intro="Buying your first home in Ontario can feel exciting and overwhelming at the same time. A clear plan helps you move from saving and pre-approval to showings, offers, and closing with more confidence and fewer surprises."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Guides", href: "/guides" },
        { label: "First Time Home Buyer Checklist in Ontario" }
      ]}
      relatedLinks={[
        { href: "/", label: "Home", description: "Return to the main HomeScope GTA experience." },
        { href: "/guides", label: "All Guides", description: "Browse more Ontario buyer and renter resources." },
        { href: "/listings", label: "Listings", description: "Search active GTA homes when you are ready to start viewing." },
        {
          href: "/guides/documents-needed-buy-house-toronto",
          label: "Documents Needed to Buy a House in Toronto",
          description: "Review the key paperwork buyers often gather before making an offer."
        },
        {
          href: "/guides/organize-real-estate-documents-canada",
          label: "How to Organize Real Estate Documents in Canada",
          description: "Keep every purchase record in one structured system."
        },
        {
          href: "/guides/rental-application-ontario",
          label: "Rental Application Ontario",
          description: "Useful if you are leasing while preparing for a future purchase."
        }
      ]}
      articleSchema={{
        title: "First Time Home Buyer Checklist in Ontario",
        description: metadata.description as string,
        url
      }}
    >
      <section>
        <h2>Check your financial readiness</h2>
        <p>
          Before browsing Toronto, Vaughan, Richmond Hill, or other GTA listings, look closely at your income,
          savings, debt, and monthly obligations. Your mortgage payment is only one part of the budget.
        </p>
        <ul>
          <li>Review your savings for down payment and closing costs.</li>
          <li>Check your credit profile and fix issues early.</li>
          <li>Estimate property taxes, utilities, insurance, and maintenance.</li>
          <li>Keep recent pay stubs, tax returns, and bank statements ready.</li>
        </ul>
      </section>

      <section>
        <h2>Get mortgage pre-approval</h2>
        <p>
          Mortgage pre-approval gives first-time buyers a practical budget range before scheduling showings. It also
          helps you move faster when a well-priced home hits the market.
        </p>
        <p>
          Lenders commonly ask for identification, employment verification, proof of income, account statements, and
          details about debts or liabilities.
        </p>
      </section>

      <section>
        <h2>Find a real estate agent</h2>
        <p>
          A good agent helps you understand neighborhoods, pricing, offer strategies, and timelines. For Ontario
          buyers, this can make a major difference in competitive areas where properties move quickly.
        </p>
      </section>

      <section>
        <h2>Start searching for homes</h2>
        <p>
          Once your budget is clear, compare listings by location, layout, commute, school access, and long-term fit.
          Keep notes from every showing so your search stays organized.
        </p>
        <ul>
          <li>Track favorite properties and compare features.</li>
          <li>Note maintenance needs, building fees, or future repair concerns.</li>
          <li>Save listing sheets, photos, and showing notes in one place.</li>
        </ul>
      </section>

      <section>
        <h2>Make an offer</h2>
        <p>
          When you find the right home, your agent will help structure an offer that reflects market conditions,
          comparable sales, and your priorities. Conditions may include financing, inspection, or review of documents.
        </p>
      </section>

      <section>
        <h2>Home inspection and financing</h2>
        <p>
          During the conditional period, keep all inspection reports, lender requests, and updated paperwork together.
          If the lender asks for additional documents, organized records make the process smoother.
        </p>
      </section>

      <section>
        <h2>Closing the deal</h2>
        <p>
          Closing involves final lender instructions, legal review, transfer documents, insurance confirmation, and
          final fund arrangements. Your lawyer will coordinate many of the final steps, but you should still keep your
          copies accessible.
        </p>
      </section>

      <section>
        <h2>Keep your documents organized</h2>
        <p>
          First-time buyers often underestimate how many files pile up throughout the process. HomeScope GTA can serve
          as a practical document hub for tracking approvals, signed agreements, inspection notes, receipts, and
          closing paperwork in one place instead of across scattered email threads and downloads.
        </p>
      </section>

      <FAQSection items={faqItems} />

      <CTASection
        title="Ready to move from planning to searching?"
        description="Browse GTA listings, compare neighborhoods, and keep your buying paperwork organized as your purchase takes shape."
        links={[
          { href: "/", label: "Go to Homepage" },
          { href: "/listings", label: "Browse Listings", variant: "secondary" }
        ]}
      />
    </GuidePageLayout>
  );
}
