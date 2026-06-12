import type { Metadata } from "next";
import { MarketReportsPanel } from "@/components/admin/market-reports-panel";

export const metadata: Metadata = {
  title: "Admin Market Reports",
  description: "Edit HomeScope GTA market report content.",
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminMarketReportsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Content</p>
        <h1 className="mt-2 font-heading text-4xl text-brand-900">Market Reports</h1>
        <p className="mt-2 max-w-3xl text-brand-700">
          Edit the editorial content for monthly city market reports. Listing counts and price stats remain automatic.
        </p>
      </div>

      <MarketReportsPanel />
    </div>
  );
}
