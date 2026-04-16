import type { Metadata } from "next";
import { getAdminLeads } from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: "Admin Leads",
  description: "View lead submissions sorted from newest to oldest.",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminLeadsPage() {
  const leads = await getAdminLeads();

  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-heading text-3xl text-brand-900">Leads</h1>
        <p className="text-sm text-brand-700">{leads.length} records</p>
      </div>

      {leads.length === 0 ? (
        <p className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700">No leads yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-brand-100">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-brand-50 text-brand-800">
              <tr>
                <th className="px-3 py-2 font-semibold">Date</th>
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 font-semibold">Email</th>
                <th className="px-3 py-2 font-semibold">Phone</th>
                <th className="px-3 py-2 font-semibold">MLS</th>
                <th className="px-3 py-2 font-semibold">Address</th>
                <th className="px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t border-brand-100 align-top">
                  <td className="px-3 py-2 text-brand-700">{lead.createdAt || "-"}</td>
                  <td className="px-3 py-2 text-brand-900">{lead.fullName || "-"}</td>
                  <td className="px-3 py-2 text-brand-700">{lead.email || "-"}</td>
                  <td className="px-3 py-2 text-brand-700">{lead.phone || "-"}</td>
                  <td className="px-3 py-2 text-brand-700">{lead.listingMlsNumber || "-"}</td>
                  <td className="px-3 py-2 text-brand-700">{lead.listingAddress || "-"}</td>
                  <td className="px-3 py-2 text-brand-700">{lead.emailStatus || lead.emailDeliveryStatus || "pending"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

