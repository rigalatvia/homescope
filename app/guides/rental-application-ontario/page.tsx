import type { Metadata } from "next";
import { CTASection } from "@/components/guides/cta-section";
import { FAQSection } from "@/components/guides/faq-section";
import { GuidePageLayout } from "@/components/guides/guide-page-layout";
import { LeaseApplicationDownloadCard } from "@/components/guides/lease-application-download-card";
import { SITE_CONFIG } from "@/config/site";

const faqItems = [
  {
    question: "What documents do I need to rent a home in Ontario?",
    answer:
      "Renters often prepare photo ID, proof of income, employment letters, credit information, references, and any supporting financial documents a landlord may request."
  },
  {
    question: "What is Form 410?",
    answer:
      "Form 410 is a residential rental application form commonly used in Ontario to collect applicant information, rental history, employment details, references, and consent signatures."
  },
  {
    question: "Should I prepare my rental application before booking a showing?",
    answer:
      "Preparing in advance can help you move faster if you find a rental you want. It does not guarantee approval, but it can make your application package easier to submit quickly."
  }
];

export const metadata: Metadata = {
  title: {
    absolute: "Rental Application Ontario - Download Residential Form 410 | HomeScope GTA"
  },
  description:
    "Download the Ontario Residential Rental Application Form 410 and learn what documents renters may need when applying to lease a property in Ontario."
};

export default function RentalApplicationOntarioPage() {
  const url = `${SITE_CONFIG.baseUrl}/guides/rental-application-ontario`;

  return (
    <GuidePageLayout
      title="Rental Application Ontario - Download Residential Form 410"
      intro="Renters in Ontario often prepare their application package before they start viewing homes so they can move quickly when the right lease opportunity appears. This page gives you a helpful overview and a direct download for the residential rental application resource."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Guides", href: "/guides" },
        { label: "Rental Application Ontario - Download Residential Form 410" }
      ]}
      relatedLinks={[
        { href: "/", label: "Home", description: "Return to the main HomeScope GTA experience." },
        { href: "/guides", label: "All Guides", description: "Browse more Ontario buying and renting resources." },
        { href: "/listings", label: "Listings", description: "Search homes and condos for lease across the GTA." },
        {
          href: "/guides/leasing",
          label: "Ontario Leasing Guide",
          description: "See the full rental process from budgeting to move-in."
        },
        {
          href: "/guides/lease-documents",
          label: "Lease Documents for Ontario Rentals",
          description: "Review the supporting documents renters commonly prepare."
        },
        {
          href: "/guides/organize-real-estate-documents-canada",
          label: "How to Organize Real Estate Documents in Canada",
          description: "Keep your renter paperwork in one clear system."
        }
      ]}
      articleSchema={{
        title: "Rental Application Ontario - Download Residential Form 410",
        description: metadata.description as string,
        url
      }}
    >
      <LeaseApplicationDownloadCard
        title="Ontario Residential Rental Application Form 410"
        description="Download the Ontario rental application form so you can review the fields, prepare your supporting documents, and keep a ready-to-submit leasing package."
        href="/forms/410-rental-application-ontario.pdf"
        buttonLabel="Download Rental Application"
      />

      <section>
        <h2>What is this form?</h2>
        <p>
          This downloadable PDF is a residential rental application resource commonly used in Ontario leasing
          situations. It helps gather the details a landlord or listing representative may ask for during the
          application process.
        </p>
      </section>

      <section>
        <h2>What information is typically included?</h2>
        <p>Based on the form structure, applicants are commonly asked to prepare information such as:</p>
        <ul>
          <li>Applicant names and personal details</li>
          <li>Current and previous addresses</li>
          <li>Landlord references</li>
          <li>Employment history</li>
          <li>Banking information</li>
          <li>Financial obligations</li>
          <li>Personal references</li>
          <li>Vehicle information</li>
          <li>Consent and signatures</li>
        </ul>
      </section>

      <section>
        <h2>Why download it in advance?</h2>
        <p>
          Reviewing the form before you book showings can help you understand what information may be requested and
          what documents you may want to collect early. That can be especially useful in busy Ontario rental markets
          where timing matters.
        </p>
      </section>

      <section>
        <h2>Helpful documents to prepare for leasing</h2>
        <ul>
          <li>Photo identification</li>
          <li>Employment letter or proof of income</li>
          <li>Recent pay stubs or financial statements</li>
          <li>Credit report or credit profile information</li>
          <li>Landlord and personal references</li>
        </ul>
      </section>

      <section>
        <h2>Keep your lease documents organized</h2>
        <p>
          HomeScope GTA can help renters keep application forms, references, income documents, and signed lease records
          together in one organized system instead of scattered across email and local downloads.
        </p>
      </section>

      <FAQSection items={faqItems} />

      <CTASection
        title="Prepare your Ontario rental application before the right listing appears"
        description="Download the form, gather your supporting documents, and browse GTA lease listings with a more complete application package."
        links={[
          { href: "/listings", label: "Browse Listings" },
          { href: "/", label: "Go to Homepage", variant: "secondary" }
        ]}
      />
    </GuidePageLayout>
  );
}
