import Link from "next/link";
import Image from "next/image";
import { SITE_CONFIG } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-brand-100 bg-white">
      <div className="site-container flex flex-col items-center justify-between gap-6 py-10 md:flex-row md:items-center">
        <div className="text-center md:text-left">
          <Link href="/" aria-label={`${SITE_CONFIG.name} home`} className="inline-flex items-center">
            <Image
              src={SITE_CONFIG.logoPath}
              alt={`${SITE_CONFIG.name} logo`}
              width={100}
              height={100}              
            />
          </Link>
          <p className="mt-2 max-w-md text-sm text-brand-700">
            Browse homes across Vaughan, Richmond Hill, Aurora, Newmarket, King, and Toronto.
          </p>
        </div>
        <Link href="/contact" className="text-sm font-semibold text-brand-900 underline-offset-2 hover:underline">
          Contact Us
        </Link>
      </div>
    </footer>
  );
}
