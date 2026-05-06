"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, Heart, LayoutDashboard } from "lucide-react";
import { SignInButton } from "@/components/auth/SignInButton";
import { UserMenu } from "@/components/auth/UserMenu";
import { useAuth } from "@/hooks/useAuth";
import { SITE_CONFIG } from "@/config/site";

export function SiteHeader() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
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

  const closeMobileGuidesMenu = useCallback(() => {
    if (mobileGuidesRef.current) {
      mobileGuidesRef.current.open = false;
    }
  }, []);

  const closeAllGuidesMenus = useCallback(() => {
    setIsDesktopGuidesOpen(false);
    closeMobileGuidesMenu();
  }, [closeMobileGuidesMenu]);

  useEffect(() => {
    closeAllGuidesMenus();
  }, [pathname, closeAllGuidesMenus]);

  return (
    <header className="border-b border-brand-100 bg-white/95 backdrop-blur">
      <div className="site-container flex items-center justify-between gap-4 py-3 sm:py-4">
        <Link
          href="/"
          aria-label={`${SITE_CONFIG.name} home`}
          className="inline-flex items-center rounded-xl border border-transparent px-2 py-1 transition hover:border-brand-100"
        >
          <Image src={SITE_CONFIG.logoPath} alt={`${SITE_CONFIG.name} logo`} width={100} height={100} />
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <nav aria-label="Main navigation" className="flex items-center gap-6 text-sm font-semibold text-brand-700">
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
                <ChevronDown className="h-4 w-4" />
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

          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-10 w-28 animate-pulse rounded-full bg-brand-100" />
            ) : user ? (
              <>
                <Link
                  href="/dashboard#saved-homes"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand-800 transition hover:text-brand-900"
                >
                  <Heart className="h-4 w-4" />
                  Saved
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand-800 transition hover:text-brand-900"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <UserMenu user={user} />
              </>
            ) : (
              <SignInButton />
            )}
          </div>
        </div>
      </div>

      <div className="site-container pb-3 md:hidden">
        <nav aria-label="Mobile navigation" className="flex flex-wrap items-center gap-4 text-sm font-semibold text-brand-700">
          <Link href="/listings" className="transition hover:text-brand-900">
            Listings
          </Link>
          <details ref={mobileGuidesRef} className="group relative">
            <summary className="cursor-pointer list-none transition hover:text-brand-900">Guides</summary>
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
          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-full bg-brand-100" />
          ) : user ? (
            <>
              <Link href="/dashboard#saved-homes" className="inline-flex items-center gap-2 transition hover:text-brand-900">
                <Heart className="h-4 w-4" />
                Saved
              </Link>
              <Link href="/dashboard" className="inline-flex items-center gap-2 transition hover:text-brand-900">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <UserMenu user={user} />
            </>
          ) : (
            <SignInButton className="inline-flex items-center gap-2 rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900 transition hover:bg-brand-50" />
          )}
        </nav>
      </div>
    </header>
  );
}
