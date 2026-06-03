import type { Metadata } from "next";
import { SchoolRankingImportPanel } from "@/components/admin/school-ranking-import-panel";

export const metadata: Metadata = {
  title: "School Rankings",
  description: "Import school ranking data for HomeScope GTA.",
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminSchoolsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Schools</p>
        <h1 className="mt-2 font-heading text-4xl text-brand-900">School Rankings</h1>
        <p className="mt-2 max-w-3xl text-brand-700">
          Import approved ranking rows, preview matches against the six-city school directory, then commit matched rows to Firestore.
        </p>
      </div>

      <SchoolRankingImportPanel />
    </div>
  );
}
