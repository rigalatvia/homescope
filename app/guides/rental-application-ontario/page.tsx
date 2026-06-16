import type { Metadata } from "next";
import {
  BriefcaseBusiness,
  CarFront,
  Download,
  FileSignature,
  FolderKanban,
  MapPinned,
  Users
} from "lucide-react";
import { CTASection } from "@/components/guides/cta-section";
import { FAQSection } from "@/components/guides/faq-section";
import {
  GuideDarkHighlight,
  GuideQuickChecklist,
  GuideSectionCard
} from "@/components/guides/guide-content-blocks";
import { GuidePageLayout } from "@/components/guides/guide-page-layout";
import { LeaseApplicationDownloadCard } from "@/components/guides/lease-application-download-card";
import { SITE_CONFIG } from "@/config/site";
import { buildPageMetadata } from "@/lib/seo/metadata";

const faqItems = [
  {
    question: "What is Form 410?",
    answer:
      "Form 410 is a residential rental application form commonly used in Ontario to collect applicant information, rental history, employment details, references, and consent signatures."
  },
  {
    question: "Is Form 410 a tenant application form for Ontario rentals?",
    answer:
      "Yes. Renters commonly use Form 410 as an Ontario tenant application form when preparing personal details, rental history, employment information, references, and consent sections before applying."
  },
  {
    question: "What documents should I prepare with Ontario Form 410?",
    answer:
      "Prepare the supporting documents a landlord may ask for beside Form 410, such as photo ID, proof of income, employment confirmation, credit information where requested, landlord references, and personal references."
  },
  {
    question: "Should I prepare my rental application before booking a showing?",
    answer:
      "Preparing in advance can help you move faster if you find a rental you want. It does not guarantee approval, but it can make your application package easier to submit quickly."
  }
];

export const metadata: Metadata = buildPageMetadata({
  title: "Ontario Rental Application Form 410 PDF | Tenant Application",
  description:
    "Download and review Ontario Rental Application Form 410. Learn what tenant application details and documents renters may need before applying in Ontario.",
  path: "/guides/rental-application-ontario",
  type: "article"
});

export default function RentalApplicationOntarioPage() {
  const url = `${SITE_CONFIG.baseUrl}/guides/rental-application-ontario`;
  const quickChecklist = [
    "Download the form before you start active showings",
    "Prepare ID, income proof, and references in advance",
    "Review address, employment, and banking fields before you need them",
    "Keep leasing documents together so your package is easy to submit",
    "Use HomeScope GTA to stay organized while browsing listings"
  ];

  return (
    <GuidePageLayout
      title="Ontario Rental Application Form 410 PDF"
      intro="Looking for the Ontario rental application or tenant application form? Review Form 410 before serious showings so you understand the fields, signatures, and supporting documents landlords may request."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Guides", href: "/guides" },
        { label: "Ontario Rental Application Form 410 PDF" }
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
          label: "Documents Needed to Rent in Canada",
          description: "Use the separate rental document checklist for proof of income, ID, credit, employment, and references."
        },
        {
          href: "/guides/organize-real-estate-documents-canada",
          label: "How to Organize Real Estate Documents in Canada",
          description: "Keep your renter paperwork in one clear system."
        }
      ]}
      articleSchema={{
        title: "Ontario Rental Application Form 410 PDF",
        description: metadata.description as string,
        url
      }}
      faqItems={faqItems}
    >
      <GuideQuickChecklist
        eyebrow="Leasing Prep"
        title="What to Have Ready Before You Apply"
        description="This page is specifically about Form 410. A rental application is easier to complete when you have reviewed the form fields and know which support files may sit beside it."
        items={quickChecklist}
        icon={Download}
      />

      <LeaseApplicationDownloadCard
        title="Download Ontario Rental Application Form 410 PDF"
        description="Download the Ontario rental application form so you can review tenant details, references, employment fields, signatures, and supporting documents before you apply."
        href="/forms/410-rental-application-ontario.pdf"
        buttonLabel="Download Form 410 PDF"
      />

      <div className="mt-10 grid gap-5">
        <GuideSectionCard
          eyebrow="Overview"
          title="What is Ontario Rental Application Form 410?"
          icon={FileSignature}
          description="Form 410 is a residential rental application resource commonly used in Ontario leasing situations. Renters use it to review the personal details, rental history, employment information, references, and consent sections a landlord or listing representative may request."
        />

        <GuideSectionCard
          eyebrow="Form Fields"
          title="What information is on a tenant application form in Ontario?"
          icon={FolderKanban}
          description="A tenant application form in Ontario commonly asks applicants to prepare a clear picture of identity, rental history, work situation, references, and financial background."
          bullets={[
            "Applicant names and personal details",
            "Current and previous addresses",
            "Landlord references",
            "Employment history",
            "Banking information",
            "Financial obligations",
            "Personal references",
            "Vehicle information",
            "Consent and signatures"
          ]}
        />

        <GuideDarkHighlight
          title="Download it before you start booking competitive showings"
          description="Busy Ontario rental markets reward preparation. If you understand the form and have your documents ready before you fall in love with a unit, your leasing package can move faster when timing matters."
          icon={Download}
        />

        <GuideSectionCard
          eyebrow="Why It Helps"
          title="Why download it in advance?"
          icon={MapPinned}
          description="Reviewing the application before you start viewing rentals helps you understand what may be requested and what documents you should prepare early."
          bullets={[
            "You can spot information gaps before a deadline",
            "You can collect references and income proof sooner",
            "You reduce delays when a suitable property appears"
          ]}
        />

        <GuideSectionCard
          eyebrow="Support File"
          title="Documents to prepare with Form 410"
          icon={BriefcaseBusiness}
          description="Form 410 is the application form. For the broader checklist of rental documents, use the documents-needed-to-rent guide; this section only shows common support files to keep beside the form."
          bullets={[
            "Photo identification",
            "Employment letter or proof of income",
            "Recent pay stubs or financial statements",
            "Credit report or credit profile information",
            "Landlord and personal references"
          ]}
        />

        <GuideSectionCard
          eyebrow="Practical Details"
          title="Other details renters often overlook"
          icon={CarFront}
          description="Some applications also request vehicle details, additional occupants, emergency contacts, or permission-related signatures, so it helps to read the whole form before you need to submit it."
          bullets={[
            "Vehicle and parking-related information",
            "Names of all intended occupants",
            "Reference details you may need to confirm quickly"
          ]}
        />

        <GuideSectionCard
          eyebrow="Organization"
          title="Keep your lease documents organized"
          icon={Users}
          description="HomeScope GTA can help renters keep application forms, references, income documents, and signed lease records together in one organized system instead of scattering them across email, screenshots, and local downloads."
          bullets={[
            "Application forms and versions",
            "Income and employment proof",
            "Reference details and landlord communication",
            "Signed lease records after approval"
          ]}
        />
      </div>

      <FAQSection items={faqItems} />

      <CTASection
        title="Download the form now so you can apply faster later"
        description="Review the Ontario rental application, organize your supporting files, and browse GTA lease listings with a package that is ready when the right home appears."
        links={[
          { href: "/listings", label: "Browse Lease Listings" },
          { href: "/guides/lease-documents", label: "Documents Needed to Rent in Canada", variant: "secondary" },
          { href: "/", label: "Explore HomeScope GTA", variant: "secondary" }
        ]}
      />
    </GuidePageLayout>
  );
}
