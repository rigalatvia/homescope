import type { Metadata } from "next";
import { CTASection } from "@/components/guides/cta-section";
import { FAQSection } from "@/components/guides/faq-section";
import { GuidePageLayout } from "@/components/guides/guide-page-layout";
import { SITE_CONFIG } from "@/config/site";

const faqItems = [
  {
    question: "What real estate documents should I save?",
    answer:
      "Save IDs, approvals, offers, inspection reports, leases, insurance records, legal documents, receipts, and closing statements. If a document affects money, ownership, tenancy, or deadlines, keep it."
  },
  {
    question: "Should I keep digital copies of everything?",
    answer:
      "Yes. Digital copies are easier to search, back up, and share with agents, lenders, landlords, or lawyers when needed. Many people also keep original paper copies for key signed documents."
  },
  {
    question: "How long should I keep real estate documents?",
    answer:
      "Keep important ownership, lease, tax, and closing records for the long term. Retention periods vary by situation, but many property-related documents should be stored well beyond the transaction itself."
  }
];

export const metadata: Metadata = {
  title: {
    absolute: "How to Organize Real Estate Documents Canada | HomeScope GTA - Real Estate Listings & Document Hub Ontario"
  },
  description:
    "Learn how to organize real estate documents in Canada using a simple system for buyers, renters, and homeowners."
};

export default function OrganizeRealEstateDocumentsCanadaPage() {
  const url = `${SITE_CONFIG.baseUrl}/guides/organize-real-estate-documents-canada`;

  return (
    <GuidePageLayout
      title="How to Organize Real Estate Documents in Canada"
      intro="Real estate paperwork tends to build up quickly in Canada, whether you are buying, leasing, refinancing, or simply maintaining a property. A consistent system makes it easier to find what you need when a deadline or request appears."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Guides", href: "/guides" },
        { label: "How to Organize Real Estate Documents in Canada" }
      ]}
      relatedLinks={[
        { href: "/", label: "Home", description: "Return to the main HomeScope GTA experience." },
        { href: "/guides", label: "All Guides", description: "Read more Ontario buyer and renter resources." },
        { href: "/listings", label: "Listings", description: "Browse available homes while keeping documents in order." },
        {
          href: "/guides/first-time-home-buyer-ontario",
          label: "First Time Home Buyer Checklist Ontario",
          description: "Understand when new records start to accumulate in the buying process."
        },
        {
          href: "/guides/documents-needed-buy-house-toronto",
          label: "Documents Needed to Buy a House in Toronto",
          description: "See which purchase files belong in your buyer folder."
        },
        {
          href: "/guides/rental-application-ontario",
          label: "Rental Application Ontario",
          description: "Keep leasing forms and supporting renter documents together."
        }
      ]}
      articleSchema={{
        title: "How to Organize Real Estate Documents in Canada",
        description: metadata.description as string,
        url
      }}
    >
      <section>
        <h2>Why organization is important</h2>
        <p>
          Organized files save time, reduce stress, and help you respond faster to lenders, landlords, lawyers, or
          accountants. They also make it easier to review your own transaction history later.
        </p>
      </section>

      <section>
        <h2>Categorize your documents</h2>
        <p>Create clear folders for each type of document instead of keeping everything in one mixed download folder.</p>
        <ul>
          <li>Identification and personal records</li>
          <li>Income and financial documents</li>
          <li>Mortgage or lease paperwork</li>
          <li>Property inspections and reports</li>
          <li>Legal and closing documents</li>
          <li>Receipts, warranties, and ongoing property records</li>
        </ul>
      </section>

      <section>
        <h2>Use digital storage</h2>
        <p>
          Digital storage gives you quick access from your phone or laptop. Use consistent file names, clear folder
          labels, and dated versions so you do not lose track of the latest signed document.
        </p>
      </section>

      <section>
        <h2>Keep everything in one system</h2>
        <p>
          Splitting documents across email, downloads, screenshots, and cloud drives makes real estate paperwork harder
          to manage. One centralized structure is easier to maintain and share.
        </p>
      </section>

      <section>
        <h2>Track important dates</h2>
        <p>
          Document organization is not only about files. Keep important dates attached to the records that matter most,
          including financing deadlines, inspection dates, deposit schedules, renewal dates, and closing milestones.
        </p>
      </section>

      <section>
        <h2>Use a dedicated platform</h2>
        <p>
          HomeScope GTA can act as a centralized document hub for Ontario buyers, renters, and homeowners who want a
          cleaner way to manage approvals, agreements, statements, and property paperwork alongside their search.
        </p>
      </section>

      <FAQSection items={faqItems} />

      <CTASection
        title="Make your next move easier to manage"
        description="Use HomeScope GTA to combine listings, guides, and document organization into one more practical workflow."
        links={[
          { href: "/", label: "Go to Homepage" },
          { href: "/guides", label: "Browse More Guides", variant: "secondary" }
        ]}
      />
    </GuidePageLayout>
  );
}
