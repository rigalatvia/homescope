import Link from "next/link";
import Image from "next/image";
import { SITE_CONFIG } from "@/config/site";

export function SiteHeader() {
  const guideItems = [
    { href: "/guides/buying", label: "Buying Guide" },
    { href: "/guides/leasing", label: "Leasing Guide" },
    { href: "/guides/lease-documents", label: "Lease Documents" }
  ];

  return (
    <header className="border-b border-brand-100 bg-white/95 backdrop-blur">
      <div className="site-container flex items-center justify-between py-3 sm:py-4">
        <Link
          href="/"
          aria-label={`${SITE_CONFIG.name} home`}
          className="inline-flex items-center rounded-xl border border-transparent px-2 py-1 transition hover:border-brand-100"
        >
          <Image
            src={SITE_CONFIG.logoPath}
            alt={`${SITE_CONFIG.name} logo`}
            width={100}
            height={100}
            priority            
          />
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-4 text-sm font-semibold text-brand-700 sm:gap-6 md:flex">
          <Link href="/listings" className="transition hover:text-brand-900">
            Listings
          </Link>
          <div className="group relative">
            <button type="button" className="inline-flex items-center gap-1 transition hover:text-brand-900">
              Guides
              <span aria-hidden="true" className="text-xs">▾</span>
            </button>
            <div className="invisible absolute right-0 top-full z-20 mt-2 w-48 rounded-xl border border-brand-100 bg-white p-2 opacity-0 shadow-soft transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              {guideItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-sm text-brand-800 transition hover:bg-brand-50 hover:text-brand-900"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <Link href="/contact" className="transition hover:text-brand-900">
            Contact
          </Link>
        </nav>
      </div>

      <div className="site-container pb-3 md:hidden">
        <nav aria-label="Mobile navigation" className="flex items-center gap-4 text-sm font-semibold text-brand-700">
          <Link href="/listings" className="transition hover:text-brand-900">
            Listings
          </Link>
          <details className="group relative">
            <summary className="cursor-pointer list-none transition hover:text-brand-900">
              Guides
            </summary>
            <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-xl border border-brand-100 bg-white p-2 shadow-soft">
              {guideItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-sm text-brand-800 transition hover:bg-brand-50 hover:text-brand-900"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </details>
          <Link href="/contact" className="transition hover:text-brand-900">
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}
