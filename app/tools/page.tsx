import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Bell, Calculator, GitCompare, Landmark, MapPinned, NotebookPen, Wrench } from "lucide-react";
import { Breadcrumbs } from "@/components/guides/breadcrumbs";
import { buildPageMetadata } from "@/lib/seo/metadata";

const TOOL_CARDS = [
  {
    href: "/tools/mortgage-calculator",
    label: "Mortgage Calculator",
    description: "Estimate principal, interest, and common monthly carrying costs.",
    icon: Calculator
  },
  {
    href: "/tools/land-transfer-tax-calculator",
    label: "Land Transfer Tax",
    description: "Estimate Ontario and Toronto land transfer tax with rebate options.",
    icon: Landmark
  },
  {
    href: "/map-search",
    label: "Map Search",
    description: "Search listings visually without loading map tools on the default listings page.",
    icon: MapPinned
  },
  {
    href: "/listings",
    label: "Saved Search Alerts",
    description: "Save filtered searches and get Instant, Daily, or Weekly listing alerts.",
    icon: Bell
  },
  {
    href: "/dashboard#saved-homes",
    label: "Compare Homes",
    description: "Compare saved listings side by side with price, specs, and estimates.",
    icon: GitCompare
  },
  {
    href: "/dashboard#saved-homes",
    label: "Showing Notes",
    description: "Keep private notes on saved homes while building your shortlist.",
    icon: NotebookPen
  }
] as const;

export const metadata: Metadata = buildPageMetadata({
  title: "Real Estate Tools | HomeScope GTA",
  description:
    "Use HomeScope GTA tools for mortgage payment estimates, land transfer tax, map search, saved search alerts, home comparison, and private showing notes.",
  path: "/tools"
});

export default function ToolsPage() {
  return (
    <main className="site-container py-12 sm:py-16">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Tools" }]} />

      <section className="rounded-lg border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-800">
              <Wrench className="h-4 w-4" />
              HomeScope Tools
            </div>
            <h1 className="mt-4 font-heading text-4xl text-brand-900 sm:text-5xl">Real Estate Tools for GTA Buyers and Renters</h1>
            <p className="mt-4 text-base leading-8 text-brand-700 sm:text-lg">
              Open the calculators, map search, saved-home comparison, notes, and alert tools from one place while you
              research homes across the GTA.
            </p>
          </div>
          <Link
            href="/listings"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            Browse Listings
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section aria-label="HomeScope GTA tools" className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {TOOL_CARDS.map((tool) => (
          <ToolCard key={tool.href} {...tool} />
        ))}
      </section>
    </main>
  );
}

function ToolCard({
  href,
  label,
  description,
  icon: Icon
}: {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-40 flex-col justify-between rounded-lg border border-brand-100 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-300"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-900">
          <Icon className="h-5 w-5" />
        </span>
        <ArrowRight className="h-5 w-5 text-brand-400 transition group-hover:translate-x-0.5 group-hover:text-brand-900" />
      </div>
      <div className="mt-5">
        <h2 className="font-heading text-2xl text-brand-900">{label}</h2>
        <p className="mt-2 text-sm leading-6 text-brand-700">{description}</p>
      </div>
    </Link>
  );
}
