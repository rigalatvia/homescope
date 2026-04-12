import type { Metadata } from "next";
import Link from "next/link";
import { MlsSyncPanel } from "@/components/admin/mls-sync-panel";

export const metadata: Metadata = {
  title: "Admin MLS Sync",
  description: "Run protected MLS sync operations for HomeScope GTA.",
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminSyncPage() {
  return (
    <section className="site-container py-14 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-4xl text-brand-900">MLS Sync Admin</h1>
          <p className="mt-3 text-brand-700">
            Trigger full, incremental, or cleanup sync runs using your protected admin token.
          </p>
          <p className="mt-2 text-sm text-brand-700">
            Need to pin listings first?{" "}
            <Link href="/admin/featured" className="font-semibold text-brand-900 underline underline-offset-2">
              Manage Featured Listings
            </Link>
          </p>
        </div>
        <MlsSyncPanel />
      </div>
    </section>
  );
}
