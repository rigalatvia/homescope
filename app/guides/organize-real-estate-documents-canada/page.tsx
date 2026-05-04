import type { Metadata } from "next";
import { CalendarClock, FileArchive, FolderKanban, HardDrive, Layers3, ShieldCheck } from "lucide-react";
import { CTASection } from "@/components/guides/cta-section";
import { FAQSection } from "@/components/guides/faq-section";
import {
  GuideDarkHighlight,
  GuideQuickChecklist,
  GuideSectionCard
} from "@/components/guides/guide-content-blocks";
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
  const quickChecklist = [
    "Create separate folders for buying, leasing, ownership, and taxes",
    "Use clear names and dates for every digital file",
    "Keep signed versions separate from drafts and screenshots",
    "Track deadlines beside the documents they relate to",
    "Use one dedicated system instead of scattered downloads and email threads"
  ];

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
      <GuideQuickChecklist
        eyebrow="Organization System"
        title="A Simple Document Framework You Can Actually Maintain"
        description="The best document system is not complicated. It is consistent, searchable, and easy to update whenever a new agreement, approval, or receipt arrives."
        items={quickChecklist}
        icon={FolderKanban}
      />

      <div className="mt-10 grid gap-5">
        <GuideSectionCard
          eyebrow="Why It Matters"
          title="Why organization is important"
          icon={ShieldCheck}
          description="Organized files save time, reduce stress, and help you answer requests faster when lenders, landlords, lawyers, or accountants need information."
          bullets={[
            "Find approvals and signed documents faster",
            "Reduce duplicate requests and missed deadlines",
            "Review your own transaction history more easily"
          ]}
        />

        <section className="rounded-[2rem] border border-brand-100 bg-brand-50/60 p-6 shadow-soft sm:p-8">
          <p className="text-sm leading-7 text-brand-700 sm:text-base">
            First-time buyers can also use the{" "}
            <a
              href="/guides/first-time-home-buyer-ontario"
              className="font-semibold text-brand-900 underline underline-offset-4"
            >
              First-Time Buyer Checklist Ontario
            </a>{" "}
            to understand which documents appear at each stage of the buying process.
          </p>
          <p className="mt-4 text-sm leading-7 text-brand-700 sm:text-base">
            If you are specifically collecting lender, offer, and closing paperwork for a Toronto purchase, review the{" "}
            <a
              href="/guides/documents-needed-buy-house-toronto"
              className="font-semibold text-brand-900 underline underline-offset-4"
            >
              Documents Needed to Buy a House in Toronto
            </a>{" "}
            guide for a more focused buyer checklist.
          </p>
        </section>

        <GuideSectionCard
          eyebrow="System Design"
          title="Categorize your documents"
          icon={Layers3}
          description="Create clear folders by transaction type instead of throwing everything into one mixed download folder."
          bullets={[
            "Identification and personal records",
            "Income and financial documents",
            "Mortgage or lease paperwork",
            "Property inspections and reports",
            "Legal and closing documents",
            "Receipts, warranties, and ongoing ownership records"
          ]}
        />

        <GuideSectionCard
          eyebrow="Storage"
          title="Use digital storage"
          icon={HardDrive}
          description="Digital storage makes documents easier to search, back up, and share. Use clear names, version dates, and folders that reflect the actual transaction stage."
          bullets={[
            "Use consistent file naming like YYYY-MM-DD plus document type",
            "Separate drafts from signed final copies",
            "Back up important records in more than one location"
          ]}
        />

        <GuideDarkHighlight
          title="One organized system beats five disconnected tools"
          description="When documents live across email, screenshots, downloads, and cloud drives, it becomes harder to know which version is current. One consistent structure makes real estate paperwork easier to manage over the long term."
          icon={FileArchive}
        />

        <GuideSectionCard
          eyebrow="Consistency"
          title="Keep everything in one system"
          icon={FolderKanban}
          description="A single centralized structure is easier to maintain than a collection of ad hoc folders spread across devices."
          bullets={[
            "Store buying and leasing files separately but under one parent system",
            "Create a folder for each property or application",
            "Keep recurring ownership records in long-term folders"
          ]}
        />

        <GuideSectionCard
          eyebrow="Timing"
          title="Track important dates"
          icon={CalendarClock}
          description="Document organization is also about timing. Connect the right file to the deadline it supports so nothing important gets buried."
          bullets={[
            "Financing and inspection deadlines",
            "Deposit and renewal dates",
            "Closing milestones and key transfer dates"
          ]}
        />

        <GuideSectionCard
          eyebrow="Platform"
          title="Use a dedicated platform"
          icon={HardDrive}
          description="HomeScope GTA can act as a centralized document hub for Ontario buyers, renters, and homeowners who want a cleaner way to manage approvals, agreements, statements, and property paperwork alongside their search."
          bullets={[
            "Approvals and supporting documents",
            "Leasing forms and reference files",
            "Closing records and ownership paperwork",
            "A more practical workflow connected to listings and guides"
          ]}
        />
      </div>

      <FAQSection items={faqItems} />

      <CTASection
        title="Create a document system that makes your next move easier"
        description="Use HomeScope GTA to keep listings, approvals, lease paperwork, and long-term property records connected in one cleaner workflow."
        links={[
          { href: "/", label: "Explore HomeScope GTA" },
          { href: "/guides", label: "Browse More Guides", variant: "secondary" }
        ]}
      />
    </GuidePageLayout>
  );
}
