import type { Metadata } from "next";
import { BadgeCheck, BriefcaseBusiness, ClipboardCheck, FileSignature, ShieldCheck, Users } from "lucide-react";
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

const LEASE_DOCS = [
  {
    title: "Proof of Income",
    description: "Recent pay stubs, bank statements, or other documents that verify your monthly income."
  },
  {
    title: "Credit Report",
    description: "A current credit report helps landlords assess payment history and financial reliability."
  },
  {
    title: "Employment Letter",
    description: "A signed letter confirming your role, compensation, and employment status."
  },
  {
    title: "References",
    description: "Personal or landlord references that support your rental application."
  }
];

export const metadata: Metadata = {
  title: "Ontario Rental Documents Checklist",
  description:
    "Ontario rental document checklist covering proof of income, credit report, employment letter, references, and what to keep after the lease is signed.",
  alternates: {
    canonical: "/guides/lease-documents"
  }
};

export default function LeaseDocumentsGuidePage() {
  const url = `${SITE_CONFIG.baseUrl}/guides/lease-documents`;
  const faqItems = [
    {
      question: "What rental documents are most commonly requested in Ontario?",
      answer:
        "Landlords commonly ask for proof of income, employment confirmation, references, photo ID, and sometimes credit information or supporting financial records."
    },
    {
      question: "Should I bring my documents before I decide on a rental?",
      answer:
        "It helps to have them ready before serious showings so you can apply quickly if you find a property that fits your needs."
    },
    {
      question: "What should I store after my lease is signed?",
      answer:
        "Keep your signed lease, payment records, landlord communication, move-in documentation, and any later amendments or notices in one accessible folder."
    },
    {
      question: "Is this page different from the Ontario Leasing Guide?",
      answer:
        "Yes. This page is a rental document checklist. The Ontario Leasing Guide covers the wider leasing process from budgeting and showings through signing and move-in."
    }
  ];

  return (
    <GuidePageLayout
      title="Lease Documents for Ontario Rentals"
      intro="Preparing these documents in advance can help renters move faster when booking showings and submitting applications, especially when a strong lease opportunity receives immediate attention."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Guides", href: "/guides" },
        { label: "Lease Documents for Ontario Rentals" }
      ]}
      relatedLinks={[
        { href: "/", label: "Home", description: "Return to the main HomeScope GTA experience." },
        { href: "/guides", label: "All Guides", description: "Browse more Ontario buyer and renter resources." },
        { href: "/listings", label: "Listings", description: "Search rental listings once your package is ready." },
        {
          href: "/guides/leasing",
          label: "Ontario Leasing Guide",
          description: "See how these documents fit into the wider leasing process."
        },
        {
          href: "/guides/rental-application-ontario",
          label: "Rental Application Ontario",
          description: "Download Form 410 and review the application fields in advance."
        }
      ]}
      articleSchema={{
        title: "Lease Documents for Ontario Rentals",
        description: metadata.description as string,
        url
      }}
    >
      <GuideQuickChecklist
        eyebrow="Rental File Checklist"
        title="The Core Documents Most Renters Should Prepare"
        description="This page is intentionally document-focused. Use it to understand which rental files matter, why they matter, and what to keep after a lease is approved."
        items={LEASE_DOCS.map((item) => item.title)}
        icon={BadgeCheck}
      />

      <LeaseApplicationDownloadCard
        title="Download Ontario Rental Application Form 410"
        description="Pair your supporting documents with a ready-to-review rental application so your leasing package is easier to complete when a suitable property appears."
        href="/forms/410-rental-application-ontario.pdf"
        buttonLabel="Download Rental Application"
      />

      <div className="mt-10 grid gap-5">
        <GuideSectionCard
          eyebrow="What This Page Covers"
          title="This guide is your rental document checklist"
          icon={ClipboardCheck}
          description="Unlike the Ontario Leasing Guide, which explains the leasing process, this page focuses narrowly on the supporting documents renters often need before and after they apply."
          bullets={[
            "What each file helps prove",
            "Why landlords may ask for it",
            "When to prepare it",
            "What to keep after approval"
          ]}
        />

        <GuideSectionCard
          eyebrow="Core Document 1"
          title="Proof of income"
          icon={BriefcaseBusiness}
          description={LEASE_DOCS[0].description}
          bullets={[
            "Recent pay stubs",
            "Bank statements where relevant",
            "Any other income verification the landlord may request"
          ]}
        />

        <GuideSectionCard
          eyebrow="Core Document 2"
          title="Credit report"
          icon={ShieldCheck}
          description={LEASE_DOCS[1].description}
          bullets={[
            "A current credit report if requested",
            "Supporting context for any unusual items",
            "A clean digital copy ready to share"
          ]}
        />

        <GuideSectionCard
          eyebrow="Core Document 3"
          title="Employment letter"
          icon={FileSignature}
          description={LEASE_DOCS[2].description}
          bullets={[
            "Role and employer confirmation",
            "Compensation details where appropriate",
            "Current employment status"
          ]}
        />

        <GuideDarkHighlight
          title="Your documents matter more when they are organized before the showing"
          description="If your proof of income, references, and application form are already prepared, you can focus on whether the property is right for you instead of scrambling for paperwork afterward."
          icon={ClipboardCheck}
        />

        <GuideSectionCard
          eyebrow="Core Document 4"
          title="References"
          icon={Users}
          description={LEASE_DOCS[3].description}
          bullets={[
            "Previous landlord contacts where available",
            "Professional or personal references if requested",
            "Reference details verified before submitting"
          ]}
        />

        <GuideSectionCard
          eyebrow="After Approval"
          title="What to keep after the lease is signed"
          icon={FileSignature}
          description="Your document checklist does not end when the landlord approves you. Keep the final records that protect you and help with future reference checks, renewals, and moving questions."
          bullets={[
            "Signed lease agreement",
            "Deposit and rent payment records",
            "Move-in condition photos or notes",
            "Important landlord communication and amendments"
          ]}
        />
      </div>

      <FAQSection items={faqItems} />

      <CTASection
        title="Prepare your rental package before the right listing appears"
        description="Download the Ontario rental application, organize your supporting documents, and browse GTA lease listings with a cleaner process and less last-minute stress."
        links={[
          { href: "/listings", label: "Browse Lease Listings" },
          { href: "/guides/rental-application-ontario", label: "Open Rental Application Guide", variant: "secondary" }
        ]}
      />
    </GuidePageLayout>
  );
}
