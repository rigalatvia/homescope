import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  ClipboardCheck,
  FileSignature,
  FolderKanban,
  Home,
  Search,
  ShieldCheck,
  Wallet,
  Wrench
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

const LEASING_STEPS = [
  { title: "Prepare Your Documents", description: "Get your rental paperwork together early so you are ready when a property matches your budget and timing." },
  { title: "Set Your Budget", description: "Define monthly rent limits and expected utilities or additional costs." },
  { title: "Search Listings", description: "Review available rental options by location, layout, and amenities." },
  { title: "Book a Showing", description: "Visit shortlisted properties and compare fit, condition, and commute." },
  { title: "Submit Application", description: "Provide a complete rental package quickly for competitive listings." },
  { title: "Landlord Review", description: "Allow time for document checks and rental application review." },
  { title: "Sign Lease Agreement", description: "Review lease terms carefully before signing and paying deposits." },
  { title: "Move In", description: "Confirm move-in logistics and complete your final walkthrough." }
];

export const metadata: Metadata = {
  title: "Ontario Leasing Guide 2026 - Rental Applications, Documents & Tenant Tips | HomeScope GTA",
  description:
    "Learn how Ontario rental applications work, what documents landlords request, and how to improve approval chances before you lease a home. Updated 2026.",
  alternates: {
    canonical: "/guides/leasing"
  }
};

const TABLE_OF_CONTENTS = [
  { href: "#leasing-overview", label: "Ontario rental application form explained" },
  { href: "#leasing-documents", label: "Documents needed for a rental application in Ontario" },
  { href: "#tenant-application", label: "Tenant application form Ontario - what to expect" },
  { href: "#financial-obligations", label: "Understanding financial obligations on rental applications" },
  { href: "#leasing-process", label: "The Ontario leasing process step by step" }
] as const;

export default function LeasingGuidePage() {
  const url = `${SITE_CONFIG.baseUrl}/guides/leasing`;
  const faqItems = [
    {
      question: "What should renters prepare before booking showings?",
      answer:
        "It helps to prepare ID, proof of income, references, and a draft rental application package before you start serious showings, especially in competitive markets."
    },
    {
      question: "What should I compare when touring rental properties?",
      answer:
        "Compare monthly cost, utilities, commute, lease terms, building condition, storage, parking, and any restrictions that may affect your day-to-day use of the property."
    },
    {
      question: "Why is a complete application package important?",
      answer:
        "A complete package can reduce delays and make it easier to submit quickly when you find a rental that fits your needs."
    },
    {
      question: "Is this page the same as a lease document checklist?",
      answer:
        "No. This page explains the rental process from budget to move-in. For a document-by-document checklist, use the lease documents guide."
    }
  ];

  return (
    <GuidePageLayout
      title="Ontario Leasing Guide 2026"
      intro="Use this Ontario leasing guide to understand rental applications, tenant documents, landlord review, and the full path from your first showing to lease signing and move-in."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Guides", href: "/guides" },
        { label: "Ontario Leasing Guide" }
      ]}
      relatedLinks={[
        { href: "/", label: "Home", description: "Return to the main HomeScope GTA experience." },
        { href: "/guides", label: "All Guides", description: "Browse more buyer and renter resources." },
        { href: "/listings", label: "Listings", description: "Search homes and condos for lease across the GTA." },
        {
          href: "/guides/lease-documents",
          label: "Lease Documents for Ontario Rentals",
          description: "Prepare the supporting paperwork that often matters during applications."
        },
        {
          href: "/guides/rental-application-ontario",
          label: "Rental Application Ontario",
          description: "Download and review Form 410 before serious showings."
        }
      ]}
      articleSchema={{
        title: "Ontario Leasing Guide 2026",
        description: metadata.description as string,
        url
      }}
      faqItems={faqItems}
    >
      <GuideQuickChecklist
        eyebrow="Rental Roadmap"
        title="The Leasing Process at a Glance"
        description="This guide explains how Ontario rental applications work, which leasing documents to prepare, what landlords often review, and how to improve your approval chances before the right rental appears."
        items={LEASING_STEPS.map((step) => step.title)}
        icon={ClipboardCheck}
      />

      <section className="not-prose mt-6 rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Jump to What Matters</p>
            <h2 className="mt-3 font-heading text-3xl text-brand-900">Use this Ontario leasing guide as a quick table of contents</h2>
            <p className="mt-3 text-sm leading-7 text-brand-700 sm:text-base">
              If you are renting in Ontario, the strongest rental applications usually come from people who understand
              the process, the expected documents, and the financial questions landlords may ask before approval.
            </p>
          </div>
          <div className="grid gap-3 lg:min-w-[320px]">
            {TABLE_OF_CONTENTS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="inline-flex items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm font-semibold text-brand-900 transition hover:border-brand-300 hover:bg-white"
              >
                <span>{item.label}</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <LeaseApplicationDownloadCard
        title="Ontario Rental Application Form 410"
        description="Download the residential rental application form before showings so you can review required fields and prepare a stronger leasing package."
        href="/forms/410-rental-application-ontario.pdf"
        buttonLabel="Download Rental Application"
      />

      <div className="mt-10 grid gap-5">
        <div id="leasing-overview">
          <GuideSectionCard
            eyebrow="What This Guide Covers"
            title="Ontario Rental Application Form Explained"
            icon={Home}
            description="Renters often hear about the Ontario rental application form before they fully understand how it fits into the leasing process. In practice, this form is part of a broader approval flow that also includes budgeting, showings, supporting documents, references, and final lease review."
            bullets={[
              "How the application fits into the leasing process",
              "When to prepare your rental package",
              "What landlords may review before approval",
              "How HomeScope GTA can help you keep leasing files in one place"
            ]}
          />
        </div>

        <div id="leasing-documents">
          <GuideSectionCard
            eyebrow="Documents"
            title="Documents Needed for a Rental Application in Ontario"
            icon={BriefcaseBusiness}
            description="Most Ontario rental applications move more smoothly when renters already have their supporting files ready. A strong package often includes identification, proof of income, employment confirmation, references, and any extra documents a landlord or listing agent may ask for."
            bullets={[
              "Government-issued ID and contact details",
              "Income proof, employment letters, or recent pay statements",
              "Reference contact information and prior landlord details",
              "A saved copy of your completed application form"
            ]}
          />
        </div>

        <div id="tenant-application">
          <GuideSectionCard
            eyebrow="Application Expectations"
            title="Tenant Application Form Ontario - What to Expect"
            icon={FileSignature}
            description="A tenant application form in Ontario typically asks for personal information, address history, employment details, references, and confirmation that the information provided is accurate. Reviewing those fields before booking serious showings can help you move faster once you find the right rental."
            bullets={[
              "Current and previous address details",
              "Employment history and monthly income information",
              "Reference names, contact details, and relationships",
              "Consent sections and signatures"
            ]}
          />
        </div>

        <div id="financial-obligations">
          <GuideSectionCard
            eyebrow="Financial Fit"
            title="Understanding Financial Obligations on Rental Applications"
            icon={Wallet}
            description="Some Ontario rental applications ask about recurring debts or financial obligations because landlords want to understand whether monthly rent fits comfortably within your broader budget. Renters who review those questions ahead of time can answer more confidently and avoid rushed or inconsistent submissions."
            bullets={[
              "Monthly rent versus your total housing budget",
              "Utilities, parking, and storage costs",
              "Existing debts or recurring monthly obligations",
              "Why clarity matters when landlords review affordability"
            ]}
          />
        </div>

        <div id="leasing-process">
          <GuideSectionCard
            eyebrow="Leasing Flow"
            title="The Ontario leasing process step by step"
            icon={ClipboardCheck}
            description="Once your application package is ready, the leasing process becomes much easier to manage. This is the practical sequence most Ontario renters follow, from planning and search to application review and move-in."
            bullets={LEASING_STEPS.map((step) => step.title)}
          />
        </div>

        <GuideDarkHighlight
          title="Prepared renters usually have the strongest approval momentum"
          description="The best leasing opportunities can move quickly. If your tenant application form, references, and financial documents are already organized, you can submit a cleaner package and spend less time scrambling after a showing."
          icon={FolderKanban}
        />

        <GuideSectionCard
          eyebrow="What This Page Covers"
          title="Use this page for the rental process, then use the document guides beside it"
          icon={Search}
          description="This page is your process guide. If you want the exact paperwork to gather, use the lease documents guide and the Ontario rental application download page together so your package is organized before serious showings begin."
          bullets={[
            "Leasing flow from showings to move-in",
            "Document checklist support from the lease documents guide",
            "Form review support from the rental application page",
            "A stronger internal path between process and paperwork"
          ]}
        />

        <GuideSectionCard eyebrow="Step 1" title="Prepare your documents" icon={BriefcaseBusiness} description={LEASING_STEPS[0].description} bullets={["Organize income proof and employment confirmation", "Keep references and ID ready", "Review the rental application before you need it"]} />
        <GuideSectionCard eyebrow="Step 2" title="Set your budget" icon={Wallet} description={LEASING_STEPS[1].description} bullets={["Plan for rent plus utilities and deposits", "Know your comfort range before touring", "Stay realistic about commute and location tradeoffs"]} />
        <GuideSectionCard eyebrow="Step 3" title="Search listings" icon={Search} description={LEASING_STEPS[2].description} bullets={["Compare layout, amenities, and lease terms", "Track your shortlist in one place", "Save links and notes for each property"]} />

        <GuideDarkHighlight
          title="Prepared renters move faster when the right lease appears"
          description="In active markets, the best rental opportunities can move quickly. If your documents and application details are already organized, you can focus on the decision instead of rushing to assemble paperwork."
          icon={FileSignature}
        />

        <GuideSectionCard eyebrow="Step 4" title="Book a showing" icon={Home} description={LEASING_STEPS[3].description} bullets={["Compare condition, noise, and building upkeep", "Ask about utilities, parking, and move-in rules", "Keep notes after each visit"]} />
        <GuideSectionCard eyebrow="Step 5" title="Submit application" icon={FileSignature} description={LEASING_STEPS[4].description} bullets={["Use a complete package when possible", "Double-check spelling and reference details", "Store every submitted version and supporting file"]} />
        <GuideSectionCard eyebrow="Step 6" title="Landlord review" icon={ShieldCheck} description={LEASING_STEPS[5].description} bullets={["Be ready for follow-up questions", "Respond quickly to document requests", "Keep communication records organized"]} />
        <GuideSectionCard eyebrow="Step 7" title="Sign lease agreement" icon={ClipboardCheck} description={LEASING_STEPS[6].description} bullets={["Review lease terms carefully", "Store the signed agreement and deposit records", "Track key dates from the start"]} />
        <GuideSectionCard eyebrow="Step 8" title="Move in" icon={Wrench} description={LEASING_STEPS[7].description} bullets={["Confirm keys and logistics", "Save move-in condition photos", "Keep lease records accessible after possession"]} />

        <GuideSectionCard
          eyebrow="Related Resource"
          title="Use the lease documents guide as your companion checklist"
          icon={ClipboardCheck}
          description="Most renters need two resources: a process guide and a document checklist. This page covers the process. The lease documents guide covers the exact records many landlords ask for."
          bullets={[
            "Proof of income and employment",
            "Credit-related records",
            "References and application support files"
          ]}
        />

        <section className="not-prose rounded-[2rem] border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-6 shadow-soft sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Related Next Steps</p>
          <h2 className="mt-3 font-heading text-3xl text-brand-900">Keep reading before you apply for a rental in Ontario</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-brand-700 sm:text-base">
            Use these related pages to turn the leasing guide into a stronger rental package and a faster search process.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/guides/lease-documents"
              className="inline-flex rounded-full bg-brand-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
            >
              Lease Document Checklist
            </Link>
            <Link
              href="/guides/rental-application-ontario"
              className="inline-flex rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900 transition hover:border-brand-300 hover:bg-white"
            >
              Rental Application Form 410
            </Link>
            <Link
              href="/listings"
              className="inline-flex rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900 transition hover:border-brand-300 hover:bg-white"
            >
              Browse Lease Listings
            </Link>
          </div>
        </section>
      </div>

      <FAQSection items={faqItems} />

      <CTASection
        title="Get your rental package ready before the right place appears"
        description="Download the application, organize your supporting files, and browse GTA lease listings with a process that feels much more under control."
        links={[
          { href: "/listings", label: "Browse Lease Listings" },
          { href: "/guides/lease-documents", label: "View Lease Document Checklist", variant: "secondary" }
        ]}
      />
    </GuidePageLayout>
  );
}
