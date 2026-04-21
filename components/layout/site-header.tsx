"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SITE_CONFIG } from "@/config/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [isDesktopGuidesOpen, setIsDesktopGuidesOpen] = useState(false);
  const mobileGuidesRef = useRef<HTMLDetailsElement>(null);
  const guideItems = [
    { href: "/guides", label: "All Guides" },
    { href: "/guides/first-time-home-buyer-ontario", label: "First-Time Buyer Checklist" },
    { href: "/guides/documents-needed-buy-house-toronto", label: "Toronto Buyer Documents" },
    { href: "/guides/organize-real-estate-documents-canada", label: "Organize Real Estate Documents" },
    { href: "/guides/rental-application-ontario", label: "Rental Application Form 410" },
    { href: "/guides/leasing", label: "Leasing Guide" },
    { href: "/guides/lease-documents", label: "Lease Documents" }
  ];

  function closeMobileGuidesMenu() {
    if (mobileGuidesRef.current) {
      mobileGuidesRef.current.open = false;
    }
  }

  function closeAllGuidesMenus() {
    setIsDesktopGuidesOpen(false);
    closeMobileGuidesMenu();
  }

  useEffect(() => {
    closeAllGuidesMenus();
  }, [pathname]);

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
            />
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-4 text-sm font-semibold text-brand-700 sm:gap-6 md:flex">
          <Link href="/listings" className="transition hover:text-brand-900">
            Listings
          </Link>
          <div className="relative">
            <button
              type="button"
              aria-expanded={isDesktopGuidesOpen}
              onClick={() => setIsDesktopGuidesOpen((open) => !open)}
              className="inline-flex items-center gap-1 transition hover:text-brand-900"
            >
              Guides
              <span aria-hidden="true" className="text-xs">▾</span>
            </button>
            <div
              className={`absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-brand-100 bg-white p-2 shadow-soft transition ${
                isDesktopGuidesOpen ? "visible opacity-100" : "invisible opacity-0"
              }`}
            >
              {guideItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeAllGuidesMenus}
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
          <details ref={mobileGuidesRef} className="group relative">
            <summary className="cursor-pointer list-none transition hover:text-brand-900">
              Guides
            </summary>
            <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border border-brand-100 bg-white p-2 shadow-soft">
              {guideItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeAllGuidesMenus}
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
