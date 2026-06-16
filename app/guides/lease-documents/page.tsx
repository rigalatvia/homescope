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
import { buildPageMetadata } from "@/lib/seo/metadata";

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

export const metadata: Metadata = buildPageMetadata({
  title: "Documents Needed to Rent in Canada & Ontario Checklist | HomeScope GTA",
  description:
    "See documents needed to rent in Canada and Ontario, including proof of income, credit report, employment letter, references, and ID.",
  path: "/guides/lease-documents",
  type: "article"
});

export default function LeaseDocumentsGuidePage() {
  const url = `${SITE_CONFIG.baseUrl}/guides/lease-documents`;
  const faqItems = [
    {
      question: "What documents do you need to rent in Canada?",
      answer:
        "Renters are commonly asked for photo ID, proof of income, employment confirmation, references, and sometimes credit information or supporting financial records. Exact requirements vary by landlord, province, and property."
    },
    {
      question: "What rental documents are most commonly requested in Ontario?",
      answer:
        "Ontario landlords commonly ask for proof of income, employment confirmation, references, photo ID, and sometimes credit information or supporting financial records."
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
      title="Documents Needed to Rent in Canada and Ontario"
      intro="Wondering what documents you need to rent in Canada or Ontario? This checklist covers the rental files renters commonly prepare before showings and tenant applications, including income proof, ID, credit information, employment letters, and references."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Guides", href: "/guides" },
        { label: "Documents Needed to Rent in Canada and Ontario" }
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
          label: "Ontario Rental Application Form 410 PDF",
          description: "Use the separate Form 410 page when you want the Ontario tenant application form itself."
        }
      ]}
      articleSchema={{
        title: "Documents Needed to Rent in Canada and Ontario",
        description: metadata.description as string,
        url
      }}
      faqItems={faqItems}
    >
      <GuideQuickChecklist
        eyebrow="Rental File Checklist"
        title="Documents Needed to Rent in Canada"
        description="This page is intentionally document-focused. Use it to understand which rental files matter, why landlords ask for them, and what to keep after a lease is approved."
        items={LEASE_DOCS.map((item) => item.title)}
        icon={BadgeCheck}
      />

      <LeaseApplicationDownloadCard
        title="Need the Ontario tenant application form too?"
        description="This page owns the rental document checklist. Use the Form 410 guide when you want the Ontario rental application form and field-by-field prep."
        href="/forms/410-rental-application-ontario.pdf"
        buttonLabel="Download Form 410 PDF"
      />

      <div className="mt-10 grid gap-5">
        <GuideSectionCard
          eyebrow="What This Page Covers"
          title="This guide is your rental document checklist for Canada and Ontario"
          icon={ClipboardCheck}
          description="Unlike the Ontario Leasing Guide, which explains the leasing process, this page focuses narrowly on the supporting documents renters often need before and after they apply in Canada and Ontario."
          bullets={[
            "What each file helps prove",
            "Why landlords may ask for it",
            "When to prepare it",
            "What to keep after approval"
          ]}
        />

        <GuideSectionCard
          eyebrow="Core Document 1"
          title="Proof of income for a rental application"
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
          title="Credit report or credit information"
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
          title="Employment letter for renting"
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
          title="References for a tenant application"
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
        description="Organize the documents needed to rent, review the Ontario rental application separately when needed, and browse GTA lease listings with less last-minute stress."
        links={[
          { href: "/listings", label: "Browse Lease Listings" },
          { href: "/guides/rental-application-ontario", label: "Ontario Rental Application Form 410 PDF", variant: "secondary" }
        ]}
      />
    </GuidePageLayout>
  );
}
