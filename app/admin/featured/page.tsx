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
    <div className="mx-auto max-w-4xl rounded-2xl border border-brand-100 bg-white p-6 shadow-soft">
      <div className="mb-6 text-center">
        <h1 className="font-heading text-4xl text-brand-900">Featured Listings Admin</h1>
        <p className="mt-3 text-brand-700">Choose and order featured properties. Ordered listings appear first on the site.</p>
      </div>
      <FeaturedListingsPanel />
    </div>
  );
}
