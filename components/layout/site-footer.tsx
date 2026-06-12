import Link from "next/link";
import Image from "next/image";
import { CookieSettingsButton } from "@/components/analytics/cookie-settings-button";
import { SITE_CONFIG } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-brand-100 bg-white">
      <div className="site-container flex flex-col gap-8 py-10 md:flex-row md:items-start md:justify-between">
        <div className="text-center md:text-left">
          <Link href="/" aria-label={`${SITE_CONFIG.name} home`} className="inline-flex items-center">
            <Image
              src={SITE_CONFIG.logoPath}
              alt={`${SITE_CONFIG.name} logo`}
              width={160}
              height={64}
              className="h-auto w-[120px] sm:w-[140px]"
            />
          </Link>
          <p className="mt-2 max-w-md text-sm text-brand-700">
            Browse homes across Vaughan, Richmond Hill, Aurora, Newmarket, King, and Toronto.
          </p>
        </div>
        <div className="grid gap-8 text-center sm:grid-cols-2 md:text-left">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Explore</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/listings" className="text-sm font-semibold text-brand-900 underline-offset-2 hover:underline">
                Listings
              </Link>
              <Link href="/guides" className="text-sm font-semibold text-brand-900 underline-offset-2 hover:underline">
                Guides
              </Link>
              <Link href="/about" className="text-sm font-semibold text-brand-900 underline-offset-2 hover:underline">
                About
              </Link>
              <Link href="/contact" className="text-sm font-semibold text-brand-900 underline-offset-2 hover:underline">
                Contact Us
              </Link>
              <CookieSettingsButton />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Popular Resources</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link
                href="/guides/first-time-home-buyer-ontario"
                className="text-sm font-semibold text-brand-900 underline-offset-2 hover:underline"
              >
                First-Time Buyer Checklist
              </Link>
              <Link
                href="/guides/documents-needed-buy-house-toronto"
                className="text-sm font-semibold text-brand-900 underline-offset-2 hover:underline"
              >
                Toronto Buyer Documents
              </Link>
              <Link
                href="/guides/leasing"
                className="text-sm font-semibold text-brand-900 underline-offset-2 hover:underline"
              >
                Ontario Leasing Guide
              </Link>
              <Link
                href="/guides/lease-documents"
                className="text-sm font-semibold text-brand-900 underline-offset-2 hover:underline"
              >
                Lease Documents Checklist
              </Link>
              <Link
                href="/guides/rental-application-ontario"
                className="text-sm font-semibold text-brand-900 underline-offset-2 hover:underline"
              >
                Rental Application Form 410
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
