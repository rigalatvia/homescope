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
  const quickChecklist = [
    "Download the form before you start active showings",
    "Prepare ID, income proof, and references in advance",
    "Review address, employment, and banking fields before you need them",
    "Keep leasing documents together so your package is easy to submit",
    "Use HomeScope GTA to stay organized while browsing listings"
  ];

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
      <GuideQuickChecklist
        eyebrow="Leasing Prep"
        title="What to Have Ready Before You Apply"
        description="A rental application is easier to complete when you have already reviewed the form and gathered the documents that support it."
        items={quickChecklist}
        icon={Download}
      />

      <LeaseApplicationDownloadCard
        title="Ontario Residential Rental Application Form 410"
        description="Download the Ontario rental application form so you can review the fields, prepare your supporting documents, and keep a ready-to-submit leasing package."
        href="/forms/410-rental-application-ontario.pdf"
        buttonLabel="Download Rental Application"
      />

      <div className="mt-10 grid gap-5">
        <GuideSectionCard
          eyebrow="Overview"
          title="What is this form?"
          icon={FileSignature}
          description="This PDF is a residential rental application resource commonly used in Ontario leasing situations. It gives renters a practical way to review the details a landlord or listing representative may request during the application process."
        />

        <GuideSectionCard
          eyebrow="Form Fields"
          title="What information is typically included?"
          icon={FolderKanban}
          description="Based on the structure of the form, applicants are commonly asked to prepare a broad picture of their identity, rental history, work situation, and financial background."
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
          title="Helpful documents to prepare for leasing"
          icon={BriefcaseBusiness}
          description="The form is only one part of a strong rental application package. Supporting documents often matter just as much."
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
          { href: "/", label: "Explore HomeScope GTA", variant: "secondary" }
        ]}
      />
    </GuidePageLayout>
  );
}
