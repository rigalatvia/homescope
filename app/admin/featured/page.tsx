import type { Metadata } from "next";
import { FeaturedListingsPanel } from "@/components/admin/featured-listings-panel";

export const metadata: Metadata = {
  title: "Admin Featured Listings",
  description: "Manage featured listing priority for HomeScope GTA.",
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminFeaturedPage() {
  return (
    <section className="site-container py-14 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-4xl text-brand-900">Featured Listings Admin</h1>
          <p className="mt-3 text-brand-700">Choose and order featured properties. Ordered listings appear first on the site.</p>
        </div>
        <FeaturedListingsPanel />
      </div>
    </section>
  );
}
