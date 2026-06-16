import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpenText,
  BriefcaseBusiness,
  ClipboardCheck,
  Compass,
  FileArchive,
  FolderKanban,
  Home,
  KeyRound,
  Search,
  Sparkles
} from "lucide-react";
import { Breadcrumbs } from "@/components/guides/breadcrumbs";
import { buildPageMetadata } from "@/lib/seo/metadata";

const GUIDE_CARDS = [
  {
    href: "/guides/first-time-home-buyer-ontario",
    category: "Buyer Checklist",
    icon: ClipboardCheck,
    title: "First Time Home Buyer Checklist Ontario",
    description: "A polished Ontario buying roadmap covering financing, house hunting, offers, and closing."
  },
  {
    href: "/guides/documents-needed-buy-house-toronto",
    category: "Toronto Buying Docs",
    icon: BriefcaseBusiness,
    title: "Documents Needed to Buy a House in Toronto",
    description: "A buyer-focused document guide for Toronto purchases, mortgage approvals, and closing."
  },
  {
    href: "/guides/organize-real-estate-documents-canada",
    category: "Document Organization",
    icon: FolderKanban,
    title: "How to Organize Real Estate Documents in Canada",
    description: "A practical system for keeping buyer, renter, and homeowner paperwork organized in one place."
  },
  {
    href: "/guides/rental-application-ontario",
    category: "Rental Resource",
    icon: FileArchive,
    title: "Ontario Rental Application Form 410 PDF",
    description: "Download Form 410 and review the Ontario tenant application fields before serious showings."
  },
  {
    href: "/guides/buying",
    category: "Buying Guide",
    icon: Home,
    title: "Ontario Home Buying Guide",
    description: "Review the key milestones in a home purchase, from pre-approval to taking possession."
  },
  {
    href: "/guides/leasing",
    category: "Leasing Guide",
    icon: KeyRound,
    title: "Ontario Leasing Guide",
    description: "Understand the rental journey, including showings, applications, approvals, and move-in preparation."
  },
  {
    href: "/guides/lease-documents",
    category: "Rental Document Checklist",
    icon: Search,
    title: "Documents Needed to Rent in Canada",
    description: "See the core rental documents renters often gather before applying in Canada and Ontario."
  }
] as const;

const FEATURE_PILLS = [
  "Ontario-focused buyer guides",
  "Toronto document checklists",
  "Rental application resources",
  "Clear internal next steps"
] as const;

const GUIDE_PATHS = [
  {
    title: "Buying",
    description: "For first-time buyers and active purchasers getting ready for financing, offers, and closing.",
    href: "/guides/first-time-home-buyer-ontario",
    icon: Compass
  },
  {
    title: "Leasing",
    description: "For renters who want to move faster with cleaner applications and a more organized package.",
    href: "/guides/leasing",
    icon: KeyRound
  },
  {
    title: "Document Hub",
    description: "For anyone who wants one system for approvals, signed files, and long-term real estate records.",
    href: "/guides/organize-real-estate-documents-canada",
    icon: FolderKanban
  }
] as const;

const PRIORITY_GUIDE_HREFS = new Set([
  "/guides/first-time-home-buyer-ontario",
  "/guides/documents-needed-buy-house-toronto",
  "/guides/leasing",
  "/guides/lease-documents"
]);

export const metadata: Metadata = buildPageMetadata({
  title: "Ontario Real Estate Guides | HomeScope GTA - Real Estate Listings & Document Hub Ontario",
  description:
    "Explore Ontario real estate guides for first-time buyers, Toronto purchase documents, rental applications, and organizing property paperwork.",
  path: "/guides"
});

export default function GuidesPage() {
  const featuredGuide = GUIDE_CARDS[0];
  const priorityGuides = GUIDE_CARDS.filter((guide) => PRIORITY_GUIDE_HREFS.has(guide.href));
  const supportingGuides = GUIDE_CARDS.filter(
    (guide) => guide.href !== featuredGuide.href && !PRIORITY_GUIDE_HREFS.has(guide.href)
  );

  return (
    <section className="site-container py-12 sm:py-16">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-10">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Guides" }]} />

        <div className="rounded-[2rem] border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-brand-50/40 p-6 sm:p-8">
          <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-800">
                <BookOpenText className="h-4 w-4" />
                Resource Library
              </div>
              <h1 className="mt-4 font-heading text-4xl text-brand-900 sm:text-5xl">
                Ontario Real Estate Guides and Document Resources
              </h1>
              <p className="mt-4 text-base leading-8 text-brand-700 sm:text-lg">
                Explore premium buyer and renter guides built for Ontario clients who want a clearer process, stronger
                document preparation, and better next steps while browsing homes with HomeScope GTA.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {FEATURE_PILLS.map((pill) => (
                  <span
                    key={pill}
                    className="inline-flex rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-700"
                  >
                    {pill}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/listings"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
                >
                  Browse Listings
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/guides/first-time-home-buyer-ontario"
                  className="inline-flex items-center gap-2 rounded-full border border-brand-200 px-5 py-3 text-sm font-semibold text-brand-900 transition hover:border-brand-300 hover:bg-white"
                >
                  Start With Buyer Checklist
                </Link>
              </div>
            </div>

            <Link
              href={featuredGuide.href}
              className="group rounded-[2rem] border border-brand-100 bg-brand-900 p-6 text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-800"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <featuredGuide.icon className="h-6 w-6" />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-brand-200">
                Featured Buyer Guide
              </p>
              <h2 className="mt-2 font-heading text-3xl">First-Time Home Buyer Checklist Ontario</h2>
              <p className="mt-3 text-sm leading-7 text-brand-100">
                A clear, beginner-friendly roadmap for Ontario buyers covering budgeting, mortgage pre-approval, home
                search, offers, conditions, closing, and document organization.
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
                Start Buyer Checklist
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {GUIDE_PATHS.map((path) => (
            <PathCard key={path.href} {...path} />
          ))}
        </div>

        <div className="mt-12 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Priority Guides</p>
            <h2 className="mt-2 font-heading text-3xl text-brand-900">
              Start with these four core buyer and renter resources
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-brand-700 sm:text-base">
              These pages are the main buyer and renter guide resources on HomeScope GTA, covering first-time buying,
              Toronto purchase documents, leasing flow, and rental document preparation.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {priorityGuides.map((guide) => (
            <GuideCard key={guide.href} {...guide} />
          ))}
        </div>

        <div className="mt-12 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">All Guides</p>
            <h2 className="mt-2 font-heading text-3xl text-brand-900">Find the next resource for your stage</h2>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 md:inline-flex">
            <Sparkles className="h-4 w-4" />
            Built for Ontario buyers, renters, and document-heavy decisions
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {supportingGuides.map((guide) => (
            <GuideCard key={guide.href} {...guide} />
          ))}
        </div>

        <div className="mt-12 rounded-[2rem] bg-brand-900 px-6 py-8 text-white shadow-soft sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-200">Next Step</p>
          <h2 className="mt-2 font-heading text-3xl">Use the guides, then move into the market with a clearer plan</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-brand-100 sm:text-base">
            HomeScope GTA is designed to connect helpful guidance, active listings, and document organization so your
            next move feels more coordinated from research to decision.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/listings"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-900 transition hover:bg-brand-50"
            >
              View Listings
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:border-white"
            >
              Explore HomeScope GTA
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function PathCard({
  title,
  description,
  href,
  icon: Icon
}: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-300"
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-900">
        <Icon className="h-6 w-6" />
      </span>
      <h2 className="mt-5 font-heading text-2xl text-brand-900">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-brand-700">{description}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-900">
        Explore path
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function GuideCard({
  href,
  title,
  description,
  category,
  icon: Icon
}: {
  href: string;
  title: string;
  description: string;
  category: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[2rem] border border-brand-100 bg-brand-50/40 p-6 transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-white"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">{category}</p>
          <h3 className="mt-3 font-heading text-2xl text-brand-900">{title}</h3>
        </div>
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-900 shadow-soft">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-sm leading-7 text-brand-700">{description}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-900">
        Read guide
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
