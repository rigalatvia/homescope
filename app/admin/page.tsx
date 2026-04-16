import type { Metadata } from "next";
import Link from "next/link";
import { getAdminDashboardData } from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "HomeScope GTA admin overview.",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminIndexPage() {
  const dashboard = await getAdminDashboardData();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-soft">
        <h1 className="font-heading text-4xl text-brand-900">Admin Dashboard</h1>
        <p className="mt-2 text-brand-700">Overview of sync, leads, contacts, and listings.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Leads" value={dashboard.totalLeads} href="/admin/leads" />
        <MetricCard label="Total Contacts" value={dashboard.totalContacts} href="/admin/contacts" />
        <MetricCard label="Total Listings" value={dashboard.totalListings} href="/admin/sync" />
        <MetricCard label="Visible Listings" value={dashboard.visibleListings} href="/admin/sync" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-heading text-2xl text-brand-900">Latest Leads</h2>
            <Link href="/admin/leads" className="text-sm font-semibold text-brand-900 underline underline-offset-2">
              View all
            </Link>
          </div>
          {dashboard.latestLeads.length === 0 ? (
            <p className="text-sm text-brand-700">No leads yet.</p>
          ) : (
            <div className="space-y-3">
              {dashboard.latestLeads.map((lead) => (
                <div key={lead.id} className="rounded-xl border border-brand-100 p-3">
                  <p className="font-semibold text-brand-900">{lead.fullName || "-"}</p>
                  <p className="text-sm text-brand-700">{lead.email || "-"}</p>
                  <p className="text-xs text-brand-600">{lead.createdAt || "-"}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-heading text-2xl text-brand-900">Contacts A to Z</h2>
            <Link href="/admin/contacts" className="text-sm font-semibold text-brand-900 underline underline-offset-2">
              View all
            </Link>
          </div>
          {dashboard.contactsAlphabeticalPreview.length === 0 ? (
            <p className="text-sm text-brand-700">No contacts yet.</p>
          ) : (
            <div className="space-y-3">
              {dashboard.contactsAlphabeticalPreview.map((contact) => (
                <div key={contact.id} className="rounded-xl border border-brand-100 p-3">
                  <p className="font-semibold text-brand-900">{contact.fullName || "-"}</p>
                  <p className="text-sm text-brand-700">{contact.email || "-"}</p>
                  <p className="text-xs text-brand-600">
                    Leads: {contact.leadCount ?? 0} | Messages: {contact.contactMessageCount ?? 0}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-soft">
        <h2 className="font-heading text-2xl text-brand-900">Quick Actions</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin/sync" className="rounded-full bg-brand-800 px-4 py-2 text-sm font-semibold text-white">
            Run MLS Sync
          </Link>
          <Link href="/admin/featured" className="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-800">
            Manage Featured
          </Link>
          <Link href="/admin/leads" className="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-800">
            Open Leads
          </Link>
          <Link href="/admin/contacts" className="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-800">
            Open Contacts
          </Link>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-soft transition hover:border-brand-300">
      <p className="text-sm font-semibold text-brand-700">{label}</p>
      <p className="mt-1 font-heading text-3xl text-brand-900">{value.toLocaleString()}</p>
    </Link>
  );
}
