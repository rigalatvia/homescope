import type { Metadata } from "next";
import Link from "next/link";
import { FeaturedListingsPreview } from "@/components/home/featured-listings-preview";
import { HeroSection } from "@/components/home/hero";
import { ServiceAreasSection } from "@/components/home/service-areas";
import { ValuePointsSection } from "@/components/home/value-points";
import { getAllPublicListings } from "@/lib/listings/service";

export const metadata: Metadata = {
  title: "Home",
  description:
    "HomeScope GTA helps buyers browse and view homes across Vaughan, Richmond Hill, Aurora, Newmarket, and Toronto."
};

export default async function HomePage() {
  const featuredListings = (await getAllPublicListings()).slice(0, 3);

  return (
    <>
      <HeroSection />
      <ServiceAreasSection />
      <ValuePointsSection />
      <FeaturedListingsPreview listings={featuredListings} />
      <section className="site-container pb-20 pt-4">
        <div className="rounded-3xl bg-brand-900 px-8 py-12 text-white sm:px-10 sm:py-14">
          <h2 className="font-heading text-3xl">Start Your Search with HomeScope GTA</h2>
          <p className="mt-3 max-w-2xl text-brand-100">
            Browse listings, explore key GTA markets, and request a private showing through a streamlined, modern
            experience.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/listings"
              className="inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-900 transition hover:bg-brand-50"
            >
              Browse Listings
            </Link>
            <Link
              href="/contact"
              className="inline-block rounded-full border border-white/50 px-6 py-3 text-sm font-semibold text-white transition hover:border-white"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
