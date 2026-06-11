import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import {
  BadgeDollarSign,
  ClipboardCheck,
  Compass,
  FileStack,
  Handshake,
  HardHat,
  Landmark,
  Lightbulb,
  Map,
  Search,
  ShieldCheck,
  Users
} from "lucide-react";
import { CTASection } from "@/components/guides/cta-section";
import { FAQSection } from "@/components/guides/faq-section";
import { GuidePageLayout } from "@/components/guides/guide-page-layout";
import { SITE_CONFIG } from "@/config/site";
import { buildPageMetadata } from "@/lib/seo/metadata";

const faqItems = [
  {
    question: "What should a first-time home buyer do first in Ontario?",
    answer:
      "Start by reviewing your budget, savings, credit profile, and monthly carrying costs. After that, speak with a mortgage professional about pre-approval so you understand your realistic price range."
  },
  {
    question: "Do I need mortgage pre-approval before viewing homes?",
    answer:
      "It is strongly recommended. Pre-approval helps you understand your budget and allows you to move faster when the right home becomes available."
  },
  {
    question: "What documents should first-time buyers prepare?",
    answer:
      "Buyers often prepare ID, proof of income, employment details, bank statements, down payment confirmation, mortgage documents, signed offers, inspection reports, legal paperwork, and closing documents."
  },
  {
    question: "Is this guide only for Toronto buyers?",
    answer:
      "No. This guide is for Ontario buyers, especially people searching in Toronto, Vaughan, Richmond Hill, Aurora, Newmarket, and King."
  }
];

const quickRoadmap = [
  "Review your budget and savings",
  "Get mortgage pre-approval",
  "Choose your target cities or neighborhoods",
  "Start viewing homes",
  "Compare listings and showing notes",
  "Make an offer with the right conditions",
  "Complete inspection, financing, and legal steps",
  "Prepare for closing and possession"
];

export const metadata: Metadata = buildPageMetadata({
  title: "First-Time Home Buyer Checklist Ontario | HomeScope GTA",
  description:
    "A simple first-time home buyer checklist for Ontario. Learn how to prepare your budget, mortgage pre-approval, showings, offers, closing steps, and documents before buying a home.",
  path: "/guides/first-time-home-buyer-ontario",
  type: "article"
});

export default function FirstTimeHomeBuyerOntarioPage() {
  const url = `${SITE_CONFIG.baseUrl}/guides/first-time-home-buyer-ontario`;

  return (
    <GuidePageLayout
      title="First-Time Home Buyer Checklist in Ontario"
      intro="Buying your first home in Ontario is exciting, but it can also feel like there are too many steps at once. This guide gives you a simple roadmap so you know what to prepare before showings, what happens when you make an offer, and how to stay organized from pre-approval to closing."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Guides", href: "/guides" },
        { label: "First-Time Home Buyer Checklist in Ontario" }
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
          href: "/contact",
          label: "Contact Us",
          description: "Reach out if you want help exploring GTA neighborhoods or listings."
        }
      ]}
      articleSchema={{
        title: "First-Time Home Buyer Checklist in Ontario",
        description: metadata.description as string,
        url
      }}
      faqItems={faqItems}
    >
      <section className="not-prose rounded-[2rem] border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-6 shadow-soft sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-800">
              <Map className="h-4 w-4" />
              Ontario Buyer Roadmap
            </div>
            <h2 className="mt-4 font-heading text-3xl text-brand-900">Quick Ontario First-Time Buyer Roadmap</h2>
            <p className="mt-3 text-sm leading-7 text-brand-700 sm:text-base">
              Use this roadmap as your quick overview before you get deep into showings, mortgage decisions, and offer
              deadlines.
            </p>
          </div>
          <div className="rounded-3xl border border-brand-100 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Quick checklist</h3>
            <ul className="mt-4 space-y-3">
              {quickRoadmap.map((item, index) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-6 text-brand-700">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-900 text-[11px] font-semibold text-white">
                    {index + 1}
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
          step="Who this guide is for"
          title="Who this guide is for"
          icon={Users}
          description="This checklist is helpful if you are buying your first home in Ontario, starting to compare GTA neighborhoods, preparing for mortgage pre-approval, or trying to understand what happens before and after an offer. It is written for regular buyers who want a clear, simple path without legal or real estate jargon."
          bullets={[
            "First-time buyers planning a move in Ontario",
            "People comparing Toronto, Vaughan, Richmond Hill, Aurora, Newmarket, or King",
            "Buyers preparing for mortgage pre-approval conversations",
            "Anyone who wants the buying process explained in plain language"
          ]}
        />

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

        <InlineCta
          title="Ready to see what is available?"
          description="Once your budget is clearer, you can start browsing active GTA listings in Toronto, Vaughan, Richmond Hill, Aurora, Newmarket, and King."
          primaryLink={{ href: "/listings", label: "Browse GTA Listings" }}
          secondaryLink={{
            href: "/guides/documents-needed-buy-house-toronto",
            label: "Review Toronto Buyer Documents"
          }}
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
                clarity matter. If you want the paperwork side explained in more detail, review the{" "}
                <a
                  href="/guides/documents-needed-buy-house-toronto"
                  className="font-semibold text-white underline underline-offset-4"
                >
                  Toronto buyer documents guide
                </a>
                .
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
            "Choose the cities or neighborhoods that fit your budget and commute",
            "Track favorite properties and compare features side by side",
            "Save showing notes so you remember what stood out later"
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
                and closing paperwork in one place instead of across scattered email threads and downloads. First-time
                buyers can also use the{" "}
                <a
                  href="/guides/organize-real-estate-documents-canada"
                  className="font-semibold text-brand-900 underline underline-offset-4"
                >
                  document organization guide
                </a>{" "}
                to build a cleaner folder system from the start.
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
        title="Need help planning your first move?"
        description="HomeScope GTA helps buyers explore listings, understand the process, and stay organized with important real estate documents."
        links={[
          { href: "/listings", label: "Browse Listings" },
          { href: "/contact", label: "Contact Us", variant: "secondary" }
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

function InlineCta({
  title,
  description,
  primaryLink,
  secondaryLink
}: {
  title: string;
  description: string;
  primaryLink: { href: string; label: string };
  secondaryLink?: { href: string; label: string };
}) {
  return (
    <section className="rounded-[2rem] border border-brand-100 bg-brand-50/60 p-6 shadow-soft sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Next Step</p>
      <h2 className="mt-2 font-heading text-3xl text-brand-900">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-brand-700 sm:text-base">{description}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={primaryLink.href}
          className="inline-flex items-center justify-center rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
        >
          {primaryLink.label}
        </a>
        {secondaryLink ? (
          <a
            href={secondaryLink.href}
            className="inline-flex items-center justify-center rounded-full border border-brand-200 px-5 py-3 text-sm font-semibold text-brand-900 transition hover:border-brand-300 hover:bg-white"
          >
            {secondaryLink.label}
          </a>
        ) : null}
      </div>
    </section>
  );
}
