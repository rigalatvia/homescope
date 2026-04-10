import Link from "next/link";
import Image from "next/image";
import { SITE_CONFIG } from "@/config/site";

export function SiteHeader() {
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
            className="h-100 w-auto sm:h-100"
          />
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-4 text-sm font-semibold text-brand-700 sm:gap-6">
          <Link href="/listings" className="transition hover:text-brand-900">
            Listings
          </Link>
          <Link href="/contact" className="transition hover:text-brand-900">
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}
