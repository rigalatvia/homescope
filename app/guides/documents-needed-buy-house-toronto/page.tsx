import type { Metadata } from "next";
import {
  BadgeCheck,
  BriefcaseBusiness,
  FileText,
  FolderKanban,
  Landmark,
  Scale,
  ShieldCheck
} from "lucide-react";
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
    "Complete document checklist for buying a house in Toronto, including ID, income records, mortgage paperwork, property documents, and closing files.",
  alternates: {
    canonical: "/guides/documents-needed-buy-house-toronto"
  }
};

export default function DocumentsNeededToBuyHouseTorontoPage() {
  const url = `${SITE_CONFIG.baseUrl}/guides/documents-needed-buy-house-toronto`;
  const quickChecklist = [
    "Keep photo ID and proof of address ready",
    "Prepare income, savings, and debt records before pre-approval",
    "Store lender letters and down payment proof in one folder",
    "Save listing sheets, offer paperwork, and condo records as you go",
    "Keep legal closing documents easy to access after possession"
  ];

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
      <GuideQuickChecklist
        eyebrow="Buyer Document Checklist"
        title="Documents at a Glance Before You Start Making Offers"
        description="This page is a Toronto buyer paperwork guide, not a general home buying roadmap. Use it to understand which records lenders, lawyers, and agents may need at each document-heavy stage."
        items={quickChecklist}
        icon={BadgeCheck}
      />

      <div className="mt-10 grid gap-5">
        <GuideSectionCard
          eyebrow="What This Page Covers"
          title="This guide is about paperwork, not the full buying journey"
          icon={FileText}
          description="If you are looking for a step-by-step first-time buyer roadmap, use the Ontario buyer checklist. This page is narrower by design: it focuses on the actual records buyers in Toronto should gather, store, and retrieve throughout a purchase."
          bullets={[
            "Identity and address documents",
            "Income, savings, and debt records",
            "Mortgage approval paperwork",
            "Property-specific files",
            "Legal and closing documents"
          ]}
        />

        <GuideSectionCard
          eyebrow="Foundation"
          title="Why document preparation matters"
          icon={FolderKanban}
          description="Strong document preparation keeps your Toronto purchase moving. It supports mortgage conversations, helps your agent structure cleaner offers, and reduces delays when deadlines tighten."
          bullets={[
            "Respond faster when lenders request follow-up documents",
            "Keep offer paperwork cleaner during competitive situations",
            "Reduce last-minute scrambling before closing"
          ]}
        />

        <GuideSectionCard
          eyebrow="Category 1"
          title="Personal identification"
          icon={ShieldCheck}
          description="Start with the identity and address records that lenders and legal professionals often need at the beginning of the transaction."
          bullets={[
            "Government-issued photo identification",
            "Proof of legal name and current address",
            "Marriage, separation, or name-change documents if relevant"
          ]}
        />

        <GuideSectionCard
          eyebrow="Category 2"
          title="Financial documents"
          icon={BriefcaseBusiness}
          description="Your financial package helps lenders evaluate affordability, down payment readiness, and ongoing obligations."
          bullets={[
            "Recent pay stubs",
            "T4s and Notices of Assessment",
            "Bank statements showing savings and down payment funds",
            "Investment or gifted-fund records if applicable",
            "Details of existing debts and recurring obligations"
          ]}
        />

        <GuideSectionCard
          eyebrow="Category 3"
          title="Mortgage documents"
          icon={Landmark}
          description="Lenders and mortgage brokers may ask for supporting paperwork beyond standard income records, especially if deposits, employment status, or down payment sources need clarification."
          bullets={[
            "Mortgage pre-approval letter",
            "Employment letter confirming role, income, and job stability",
            "Explanations for large deposits if needed",
            "Proof of down payment source"
          ]}
        />

        <GuideDarkHighlight
          title="Keep a lender-ready folder before the right listing appears"
          description="Toronto homes can move quickly. If your ID, income records, statements, and approval letters are already organized, you can respond more calmly when a lender or agent needs something the same day."
          icon={FileText}
        />

        <GuideSectionCard
          eyebrow="Category 4"
          title="Property-related documents"
          icon={FolderKanban}
          description="As your search turns into a live transaction, create a property-specific folder for each serious listing so you can compare and retrieve details easily."
          bullets={[
            "Listing sheet and MLS details",
            "Signed offer documents and amendments",
            "Home inspection report where applicable",
            "Status certificate review materials for condos"
          ]}
        />

        <GuideSectionCard
          eyebrow="Category 5"
          title="Legal documents"
          icon={Scale}
          description="Your lawyer coordinates the final legal side of the purchase, but you should still keep your own copies of closing records and title-related paperwork."
          bullets={[
            "Title-related review documents",
            "Closing adjustments and final statements",
            "Insurance confirmation",
            "Transfer and registration records"
          ]}
        />

        <GuideSectionCard
          eyebrow="Checklist Workflow"
          title="How to structure your buyer document folders"
          icon={FileText}
          description="One of the easiest ways to reduce confusion is to separate your buyer documents into simple working folders instead of saving everything in email or one download folder."
          bullets={[
            "Personal ID and address records",
            "Mortgage and banking documents",
            "Property-specific files for each serious listing",
            "Signed offer and amendment folder",
            "Lawyer and closing package folder"
          ]}
        />

        <GuideSectionCard
          eyebrow="Workflow"
          title="Why organization matters"
          icon={FolderKanban}
          description="Missing paperwork can slow approvals or create friction when momentum matters most. Buyers who keep records sorted can answer lender, lawyer, and agent requests far more quickly."
          bullets={[
            "Store approvals and revisions in dated folders",
            "Keep each property file separate from your general buyer documents",
            "Save final signed versions instead of relying on email search"
          ]}
        />

        <GuideSectionCard
          eyebrow="HomeScope GTA"
          title="Keep everything in one place"
          icon={FileText}
          description="HomeScope GTA can help Toronto buyers organize financial, property, and legal documents in one system so the latest approval letter, signed agreement, or closing file is always easier to find."
          bullets={[
            "Mortgage letters and lender requests",
            "Offer documents and amendments",
            "Inspection and condo review materials",
            "Closing statements and long-term property records"
          ]}
        />
      </div>

      <FAQSection items={faqItems} />

      <CTASection
        title="Get your buying documents ready before the right Toronto listing appears"
        description="Organize your approvals, offer paperwork, and closing records now so you can browse GTA listings and move faster when a strong opportunity comes up."
        links={[
          { href: "/listings", label: "Browse GTA Listings" },
          { href: "/", label: "Explore HomeScope GTA", variant: "secondary" }
        ]}
      />
    </GuidePageLayout>
  );
}
