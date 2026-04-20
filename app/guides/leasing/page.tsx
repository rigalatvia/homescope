import type { Metadata } from "next";
import { BriefcaseBusiness, ClipboardCheck, FileSignature, Home, Search, ShieldCheck, Wallet, Wrench } from "lucide-react";
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
  { title: "Prepare Your Documents", description: "Organize income proof, credit report, employment letter, and references." },
  { title: "Set Your Budget", description: "Define monthly rent limits and expected utilities or additional costs." },
  { title: "Search Listings", description: "Review available rental options by location, layout, and amenities." },
  { title: "Book a Showing", description: "Visit shortlisted properties and compare fit, condition, and commute." },
  { title: "Submit Application", description: "Provide a complete rental package quickly for competitive listings." },
  { title: "Landlord Review", description: "Allow time for document checks and rental application review." },
  { title: "Sign Lease Agreement", description: "Review lease terms carefully before signing and paying deposits." },
  { title: "Move In", description: "Confirm move-in logistics and complete your final walkthrough." }
];

export const metadata: Metadata = {
  title: "Ontario Leasing Guide",
  description: "Learn how to rent a home in Ontario, from preparing documents and booking showings to applying and signing a lease."
};

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
    }
  ];

  return (
    <GuidePageLayout
      title="Steps to Rent a Home in Ontario"
      intro="Use this guide to understand the leasing process in Ontario, from document preparation and budgeting to showings, applications, and move-in coordination."
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
        title: "Steps to Rent a Home in Ontario",
        description: metadata.description as string,
        url
      }}
    >
      <GuideQuickChecklist
        eyebrow="Rental Roadmap"
        title="The Leasing Process at a Glance"
        description="This quick overview helps Ontario renters see the full leasing flow before the process speeds up around a property they want."
        items={LEASING_STEPS.map((step) => step.title)}
        icon={ClipboardCheck}
      />

      <LeaseApplicationDownloadCard
        title="Ontario Rental Application Form 410"
        description="Download the residential rental application form before showings so you can review required fields and prepare a stronger leasing package."
        href="/forms/410-rental-application-ontario.pdf"
        buttonLabel="Download Rental Application"
      />

      <div className="mt-10 grid gap-5">
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
