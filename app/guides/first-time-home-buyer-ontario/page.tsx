import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import {
  BadgeDollarSign,
  Compass,
  FileStack,
  Handshake,
  HardHat,
  Home,
  Landmark,
  Lightbulb,
  Search,
  ShieldCheck,
  ClipboardCheck
} from "lucide-react";
import { CTASection } from "@/components/guides/cta-section";
import { FAQSection } from "@/components/guides/faq-section";
import { GuidePageLayout } from "@/components/guides/guide-page-layout";
import { SITE_CONFIG } from "@/config/site";

const faqItems = [
  {
    question: "How much down payment do I need in Ontario?",
    answer:
      "The minimum down payment depends on purchase price and lending rules. Many first-time buyers start with the minimum permitted by their lender, but they should also budget for closing costs, inspections, legal fees, and moving expenses."
  },
  {
    question: "What documents should first-time buyers keep?",
    answer:
      "Keep mortgage pre-approval letters, pay stubs, tax returns, proof of down payment, signed offers, inspection reports, lawyer correspondence, insurance details, and final closing documents in one organized system."
  },
  {
    question: "Why is mortgage pre-approval important?",
    answer:
      "Mortgage pre-approval helps Ontario buyers understand their real budget before touring homes. It also shows sellers you are serious and can move more quickly when you find the right property."
  }
];

const quickChecklist = [
  "Review your budget, savings, and monthly carrying costs",
  "Get mortgage pre-approval before active house hunting",
  "Choose an agent who understands your target neighborhoods",
  "Track listings, showing notes, and offer deadlines in one place",
  "Keep inspection, financing, and legal records organized from day one"
];

export const metadata: Metadata = {
  title: {
    absolute: "First Time Home Buyer Checklist Ontario | HomeScope GTA - Real Estate Listings & Document Hub Ontario"
  },
  description:
    "Step-by-step checklist for first time home buyers in Ontario. Learn how to prepare finances, get pre-approved, search for homes, and close your purchase smoothly.",
  alternates: {
    canonical: "/guides/first-time-home-buyer-ontario"
  }
};

export default function FirstTimeHomeBuyerOntarioPage() {
  const url = `${SITE_CONFIG.baseUrl}/guides/first-time-home-buyer-ontario`;

  return (
    <GuidePageLayout
      title="First Time Home Buyer Checklist in Ontario"
      intro="Buying your first home in Ontario can feel exciting and overwhelming at the same time. A clearer roadmap helps you move from saving and pre-approval to showings, offers, and closing with more confidence, better timing, and fewer surprises."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Guides", href: "/guides" },
        { label: "First Time Home Buyer Checklist in Ontario" }
      ]}
      relatedLinks={[
        { href: "/", label: "Home", description: "Return to the main HomeScope GTA experience." },
        { href: "/guides", label: "All Guides", description: "Browse more Ontario buyer and renter resources." },
        { href: "/listings", label: "Listings", description: "Search active GTA homes when you are ready to start viewing." },
        {
          href: "/guides/documents-needed-buy-house-toronto",
          label: "Documents Needed to Buy a House in Toronto",
          description: "Review the key paperwork buyers often gather before making an offer."
        },
        {
          href: "/guides/organize-real-estate-documents-canada",
          label: "How to Organize Real Estate Documents in Canada",
          description: "Keep every purchase record in one structured system."
        },
        {
          href: "/guides/rental-application-ontario",
          label: "Rental Application Ontario",
          description: "Useful if you are leasing while preparing for a future purchase."
        }
      ]}
      articleSchema={{
        title: "First Time Home Buyer Checklist in Ontario",
        description: metadata.description as string,
        url
      }}
    >
      <section className="not-prose rounded-[2rem] border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-6 shadow-soft sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-800">
              <Home className="h-4 w-4" />
              First-Time Buyer Roadmap
            </div>
            <h2 className="mt-4 font-heading text-3xl text-brand-900">Quick Checklist Before You Start Touring Homes</h2>
            <p className="mt-3 text-sm leading-7 text-brand-700 sm:text-base">
              Use this shortlist as your Ontario home buying reset. It gives you the major checkpoints to complete
              before the process starts moving quickly.
            </p>
          </div>
          <div className="rounded-3xl border border-brand-100 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">At a Glance</h3>
            <ul className="mt-4 space-y-3">
              {quickChecklist.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-6 text-brand-700">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-900 text-white">
                    <ClipboardCheck className="h-3.5 w-3.5" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="not-prose mt-10 grid gap-5">
        <StepCard
          step="Step 1"
          title="Check your financial readiness"
          icon={BadgeDollarSign}
          description="Before browsing Toronto, Vaughan, Richmond Hill, or other GTA listings, look closely at your income, savings, debt, and monthly obligations. Your mortgage payment is only one part of the budget."
          bullets={[
            "Review your savings for down payment and closing costs",
            "Check your credit profile and fix issues early",
            "Estimate property taxes, utilities, insurance, and maintenance",
            "Keep recent pay stubs, tax returns, and bank statements ready"
          ]}
        />

        <StepCard
          step="Step 2"
          title="Get mortgage pre-approval"
          icon={Landmark}
          description="Mortgage pre-approval gives first-time buyers a practical budget range before scheduling showings. It also helps you move faster when a well-priced home hits the market."
          bullets={[
            "Gather identification and employment verification",
            "Prepare proof of income and account statements",
            "Be ready to explain debts, liabilities, or unusual deposits",
            "Use your approval range to narrow your home search realistically"
          ]}
        />

        <section className="rounded-[2rem] bg-brand-900 px-6 py-7 text-white shadow-soft sm:px-8">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <Lightbulb className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-200">Pro Tip</p>
              <h2 className="mt-2 font-heading text-3xl">Act like a buyer who is already lender-ready</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-brand-100 sm:text-base">
                Ontario homes can move quickly. Keep your lender documents, ID, down payment proof, and employment
                records in one organized system before you tour seriously. When the right listing appears, speed and
                clarity matter.
              </p>
            </div>
          </div>
        </section>

        <StepCard
          step="Step 3"
          title="Find a real estate agent"
          icon={Handshake}
          description="A good agent helps you understand neighborhoods, pricing, offer strategy, and timelines. For Ontario buyers, this can make a major difference in competitive areas where properties move quickly."
          bullets={[
            "Choose someone who understands your target neighborhoods",
            "Ask how they help with showing strategy and offer timing",
            "Make sure communication style and availability match your needs"
          ]}
        />

        <StepCard
          step="Step 4"
          title="Start searching for homes"
          icon={Search}
          description="Once your budget is clear, compare listings by location, layout, commute, school access, and long-term fit. Keep notes from every showing so your search stays organized."
          bullets={[
            "Track favorite properties and compare features",
            "Note maintenance needs, building fees, or future repair concerns",
            "Save listing sheets, photos, and showing notes in one place"
          ]}
        />

        <StepCard
          step="Step 5"
          title="Make an offer"
          icon={Compass}
          description="When you find the right home, your agent will help structure an offer that reflects market conditions, comparable sales, and your priorities."
          bullets={[
            "Review price strategy carefully",
            "Understand which conditions you want to include",
            "Keep signed offer documents and amendments easy to access"
          ]}
        />

        <StepCard
          step="Step 6"
          title="Home inspection and financing"
          icon={HardHat}
          description="During the conditional period, keep all inspection reports, lender requests, and updated paperwork together. If the lender asks for more information, organized records make the process smoother."
          bullets={[
            "Store inspection findings and contractor notes together",
            "Track lender requests and follow-ups quickly",
            "Keep revised approvals and supporting files in one folder"
          ]}
        />

        <StepCard
          step="Step 7"
          title="Closing the deal"
          icon={ShieldCheck}
          description="Closing involves final lender instructions, legal review, transfer documents, insurance confirmation, and final fund arrangements. Your lawyer coordinates many of the final steps, but you should still keep your own copies accessible."
          bullets={[
            "Confirm insurance and funding deadlines",
            "Store lawyer correspondence and closing statements",
            "Save final possession and transfer records for the long term"
          ]}
        />

        <section className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-900">
              <FileStack className="h-6 w-6" />
            </span>
            <div>
              <h2 className="font-heading text-3xl text-brand-900">Keep your documents organized</h2>
              <p className="mt-3 text-sm leading-7 text-brand-700 sm:text-base">
                First-time buyers often underestimate how many files pile up throughout the process. HomeScope GTA can
                serve as a practical document hub for tracking approvals, signed agreements, inspection notes, receipts,
                and closing paperwork in one place instead of across scattered email threads and downloads.
              </p>
              <ul className="mt-4 grid gap-3 text-sm text-brand-700 sm:grid-cols-2">
                <li className="rounded-2xl bg-brand-50/60 px-4 py-3">Pre-approval letters and lender requests</li>
                <li className="rounded-2xl bg-brand-50/60 px-4 py-3">Showing notes and property shortlists</li>
                <li className="rounded-2xl bg-brand-50/60 px-4 py-3">Inspection reports and follow-up quotes</li>
                <li className="rounded-2xl bg-brand-50/60 px-4 py-3">Signed offers, legal files, and closing records</li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      <FAQSection items={faqItems} />

      <CTASection
        title="Start your Ontario home search with a clearer plan"
        description="Browse GTA listings, stay ready with your financing documents, and use HomeScope GTA to keep every approval, note, and closing file in one organized system from day one."
        links={[
          { href: "/listings", label: "Browse GTA Listings" },
          { href: "/", label: "Explore HomeScope GTA", variant: "secondary" }
        ]}
      />
    </GuidePageLayout>
  );
}

function StepCard({
  step,
  title,
  description,
  bullets,
  icon: Icon
}: {
  step: string;
  title: string;
  description: string;
  bullets: string[];
  icon: LucideIcon;
}) {
  return (
    <section className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
      <div className="flex items-start gap-4">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-900">
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">{step}</p>
          <h2 className="mt-2 font-heading text-3xl text-brand-900">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-brand-700 sm:text-base">{description}</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {bullets.map((bullet) => (
              <li key={bullet} className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm leading-6 text-brand-700">
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
