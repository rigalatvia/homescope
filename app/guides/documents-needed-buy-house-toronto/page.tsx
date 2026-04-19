import type { Metadata } from "next";
import { CTASection } from "@/components/guides/cta-section";
import { FAQSection } from "@/components/guides/faq-section";
import { GuidePageLayout } from "@/components/guides/guide-page-layout";
import { SITE_CONFIG } from "@/config/site";

const faqItems = [
  {
    question: "What documents do lenders ask for in Toronto?",
    answer:
      "Lenders commonly request government-issued ID, employment confirmation, income documents, tax returns, bank statements, down payment proof, and information about existing debts."
  },
  {
    question: "Do I need a pre-approval letter before making an offer?",
    answer:
      "It is strongly recommended. A pre-approval letter helps define your budget and can strengthen your position when Toronto homes receive competitive attention."
  },
  {
    question: "What documents are handled by the lawyer?",
    answer:
      "Your lawyer typically handles title review, transfer documents, closing adjustments, registration-related paperwork, and final legal coordination before the keys are released."
  }
];

export const metadata: Metadata = {
  title: {
    absolute: "Documents Needed to Buy a House in Toronto | HomeScope GTA - Real Estate Listings & Document Hub Ontario"
  },
  description:
    "Complete list of documents required to buy a house in Toronto, including ID, financial records, mortgage paperwork, and legal closing documents."
};

export default function DocumentsNeededToBuyHouseTorontoPage() {
  const url = `${SITE_CONFIG.baseUrl}/guides/documents-needed-buy-house-toronto`;

  return (
    <GuidePageLayout
      title="Documents Needed to Buy a House in Toronto"
      intro="Document preparation can speed up every stage of a Toronto home purchase. From mortgage qualification to legal closing, organized records help buyers respond quickly and avoid delays when timing matters."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Guides", href: "/guides" },
        { label: "Documents Needed to Buy a House in Toronto" }
      ]}
      relatedLinks={[
        { href: "/", label: "Home", description: "Return to the main HomeScope GTA experience." },
        { href: "/guides", label: "All Guides", description: "Explore more buyer and renter resources." },
        { href: "/listings", label: "Listings", description: "Search GTA homes once your paperwork is ready." },
        {
          href: "/guides/first-time-home-buyer-ontario",
          label: "First Time Home Buyer Checklist Ontario",
          description: "See how these documents fit into the overall buying timeline."
        },
        {
          href: "/guides/organize-real-estate-documents-canada",
          label: "How to Organize Real Estate Documents in Canada",
          description: "Use a better system for storing records, approvals, and closing files."
        },
        {
          href: "/guides/rental-application-ontario",
          label: "Rental Application Ontario",
          description: "Helpful if you are renting while preparing to purchase."
        }
      ]}
      articleSchema={{
        title: "Documents Needed to Buy a House in Toronto",
        description: metadata.description as string,
        url
      }}
    >
      <section>
        <h2>Why document preparation matters</h2>
        <p>
          Toronto buyers often move through fast timelines, especially when attractive properties receive immediate
          interest. Having your documents ready can make mortgage conversations smoother, help your agent build a
          stronger offer package, and reduce last-minute stress.
        </p>
      </section>

      <section>
        <h2>Personal identification</h2>
        <ul>
          <li>Government-issued photo identification</li>
          <li>Proof of legal name and current address</li>
          <li>Marriage certificate or separation documentation if relevant to financing or title</li>
        </ul>
      </section>

      <section>
        <h2>Financial documents</h2>
        <ul>
          <li>Recent pay stubs</li>
          <li>T4s and Notices of Assessment</li>
          <li>Bank statements showing savings and down payment funds</li>
          <li>Records of investments or gifted funds if applicable</li>
          <li>Details of existing debts, loans, or monthly obligations</li>
        </ul>
      </section>

      <section>
        <h2>Mortgage documents</h2>
        <p>
          Your lender or mortgage broker may request additional supporting paperwork beyond standard income records.
        </p>
        <ul>
          <li>Mortgage pre-approval letter</li>
          <li>Employment letter confirming role, income, and job stability</li>
          <li>Explanations for large deposits if needed</li>
          <li>Proof of down payment source</li>
        </ul>
      </section>

      <section>
        <h2>Property-related documents</h2>
        <ul>
          <li>Listing sheet and MLS details</li>
          <li>Signed offer documents and amendments</li>
          <li>Home inspection report where applicable</li>
          <li>Status certificate review materials for condos</li>
        </ul>
      </section>

      <section>
        <h2>Legal documents</h2>
        <p>
          Closing a house in Toronto also means coordinating with a real estate lawyer. Legal documents may include
          title-related paperwork, closing adjustments, final statements, insurance confirmation, and transfer records.
        </p>
      </section>

      <section>
        <h2>Why organization matters</h2>
        <p>
          Missing paperwork can delay approvals or create friction at the exact moment when you want momentum. Buyers
          who keep their records sorted can respond more quickly to lenders, lawyers, and agents.
        </p>
      </section>

      <section>
        <h2>Keep everything in one place</h2>
        <p>
          HomeScope GTA can help Toronto buyers keep financial, property, and legal documents in one organized system
          so they always know where to find the latest version of an approval, statement, or signed agreement.
        </p>
      </section>

      <FAQSection items={faqItems} />

      <CTASection
        title="Get your buying documents ready before the right listing appears"
        description="Use a better system for approvals, offer paperwork, and closing documents, then browse GTA listings with more confidence."
        links={[
          { href: "/", label: "Go to Homepage" },
          { href: "/listings", label: "Browse Listings", variant: "secondary" }
        ]}
      />
    </GuidePageLayout>
  );
}
