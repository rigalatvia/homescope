import type { Metadata } from "next";
import { BadgeDollarSign, ClipboardCheck, Compass, HardHat, Handshake, Home, Landmark, Search, ShieldCheck } from "lucide-react";
import { CTASection } from "@/components/guides/cta-section";
import { FAQSection } from "@/components/guides/faq-section";
import {
  GuideDarkHighlight,
  GuideQuickChecklist,
  GuideSectionCard
} from "@/components/guides/guide-content-blocks";
import { GuidePageLayout } from "@/components/guides/guide-page-layout";
import { SITE_CONFIG } from "@/config/site";

const BUYING_STEPS = [
  { title: "Get Pre-Approved", description: "Confirm your budget early so your search stays focused and realistic." },
  { title: "Define Your Needs", description: "Set your must-haves, nice-to-haves, and preferred neighborhoods." },
  { title: "Start Your Search", description: "Review active listings and compare value, location, and property features." },
  { title: "Book Showings", description: "Tour shortlisted homes and evaluate condition, layout, and fit for your lifestyle." },
  { title: "Make an Offer", description: "Submit an offer with pricing and terms aligned to market conditions." },
  { title: "Home Inspection", description: "Assess the property’s condition and identify any risks before finalizing." },
  { title: "Finalize Financing", description: "Work with your lender to secure final mortgage approval and conditions." },
  { title: "Closing", description: "Complete legal paperwork, transfer funds, and take possession of your new home." }
];

export const metadata: Metadata = {
  title: "Ontario Home Buying Guide",
  description: "Learn the steps to buy a home in Ontario, from mortgage pre-approval and showings to offers, inspections, and closing."
};

export default function BuyingGuidePage() {
  const url = `${SITE_CONFIG.baseUrl}/guides/buying`;
  const faqItems = [
    {
      question: "When should I get pre-approved before house hunting?",
      answer:
        "Get pre-approved before you start scheduling serious showings. It gives you a working budget and helps you respond more confidently when a suitable property appears."
    },
    {
      question: "What should I track while comparing homes?",
      answer:
        "Track location, layout, condition, monthly carrying costs, condo fees where relevant, commute, and any repair or renovation concerns that may affect value."
    },
    {
      question: "Why should buyers keep their paperwork organized from the start?",
      answer:
        "Organized records make lender follow-ups, inspection reviews, offer changes, and legal closing steps much easier to manage once timelines tighten."
    }
  ];

  return (
    <GuidePageLayout
      title="Steps to Buy a Home in Ontario"
      intro="This guide gives buyers a practical overview of the Ontario home buying journey, from financing and home search strategy to inspections, final approval, and closing day."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Guides", href: "/guides" },
        { label: "Ontario Home Buying Guide" }
      ]}
      relatedLinks={[
        { href: "/", label: "Home", description: "Return to the main HomeScope GTA experience." },
        { href: "/guides", label: "All Guides", description: "Browse more buyer and renter resources." },
        { href: "/listings", label: "Listings", description: "Search GTA homes when your budget and documents are ready." },
        {
          href: "/guides/first-time-home-buyer-ontario",
          label: "First Time Home Buyer Checklist Ontario",
          description: "Follow a more detailed step-by-step version of the buying journey."
        },
        {
          href: "/guides/documents-needed-buy-house-toronto",
          label: "Documents Needed to Buy a House in Toronto",
          description: "Prepare the paperwork that supports mortgage and offer timelines."
        }
      ]}
      articleSchema={{
        title: "Steps to Buy a Home in Ontario",
        description: metadata.description as string,
        url
      }}
    >
      <GuideQuickChecklist
        eyebrow="Buyer Journey"
        title="The Home Buying Flow at a Glance"
        description="If you want a fast overview before diving into each stage, these are the checkpoints most Ontario buyers move through from start to finish."
        items={BUYING_STEPS.map((step) => step.title)}
        icon={ClipboardCheck}
      />

      <div className="mt-10 grid gap-5">
        <GuideSectionCard
          eyebrow="Step 1"
          title="Get pre-approved"
          icon={Landmark}
          description={BUYING_STEPS[0].description}
          bullets={[
            "Confirm a realistic purchase range",
            "Know your estimated monthly payment range",
            "Prepare lender-ready documents early"
          ]}
        />

        <GuideSectionCard
          eyebrow="Step 2"
          title="Define your needs"
          icon={Compass}
          description={BUYING_STEPS[1].description}
          bullets={[
            "List non-negotiables and flexibility areas",
            "Prioritize neighborhood and commute factors",
            "Separate lifestyle wants from budget constraints"
          ]}
        />

        <GuideSectionCard
          eyebrow="Step 3"
          title="Start your search"
          icon={Search}
          description={BUYING_STEPS[2].description}
          bullets={[
            "Compare price, layout, and location",
            "Track listings in one shortlist",
            "Save notes as soon as each property stands out"
          ]}
        />

        <GuideDarkHighlight
          title="Serious buyers get organized before the market speeds up"
          description="The more prepared you are with financing, notes, and supporting paperwork, the easier it becomes to make confident decisions when an attractive home moves quickly."
          icon={BadgeDollarSign}
        />

        <GuideSectionCard
          eyebrow="Step 4"
          title="Book showings"
          icon={Home}
          description={BUYING_STEPS[3].description}
          bullets={[
            "Compare condition and layout in person",
            "Note repair or maintenance concerns",
            "Document each visit while details are fresh"
          ]}
        />

        <GuideSectionCard
          eyebrow="Step 5"
          title="Make an offer"
          icon={Handshake}
          description={BUYING_STEPS[4].description}
          bullets={[
            "Understand comparable pricing",
            "Review conditions and timelines carefully",
            "Keep every signed offer version organized"
          ]}
        />

        <GuideSectionCard
          eyebrow="Step 6"
          title="Home inspection"
          icon={HardHat}
          description={BUYING_STEPS[5].description}
          bullets={[
            "Store inspection findings and related notes",
            "Review material issues before waiving conditions",
            "Track follow-up questions clearly"
          ]}
        />

        <GuideSectionCard
          eyebrow="Step 7"
          title="Finalize financing"
          icon={ShieldCheck}
          description={BUYING_STEPS[6].description}
          bullets={[
            "Respond to lender requests promptly",
            "Keep revised approvals in one place",
            "Stay aligned with closing deadlines"
          ]}
        />

        <GuideSectionCard
          eyebrow="Step 8"
          title="Closing"
          icon={ClipboardCheck}
          description={BUYING_STEPS[7].description}
          bullets={[
            "Coordinate with your lawyer",
            "Store final statements and insurance confirmation",
            "Keep long-term ownership records after possession"
          ]}
        />
      </div>

      <FAQSection items={faqItems} />

      <CTASection
        title="Turn your buying plan into a more organized search"
        description="Use HomeScope GTA to browse listings, stay on top of approvals, and keep offer and closing records easier to manage from the first showing onward."
        links={[
          { href: "/listings", label: "Browse GTA Listings" },
          { href: "/guides/first-time-home-buyer-ontario", label: "View Detailed Buyer Checklist", variant: "secondary" }
        ]}
      />
    </GuidePageLayout>
  );
}
