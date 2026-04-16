import type { Metadata } from "next";
import { getAdminContacts } from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: "Admin Contacts",
  description: "View contacts sorted alphabetically.",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminContactsPage() {
  const contacts = await getAdminContacts();

  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-heading text-3xl text-brand-900">Contacts</h1>
        <p className="text-sm text-brand-700">{contacts.length} records</p>
      </div>

      {contacts.length === 0 ? (
        <p className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700">No contacts yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-brand-100">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-brand-50 text-brand-800">
              <tr>
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 font-semibold">Email</th>
                <th className="px-3 py-2 font-semibold">Phone</th>
                <th className="px-3 py-2 font-semibold">Leads</th>
                <th className="px-3 py-2 font-semibold">Messages</th>
                <th className="px-3 py-2 font-semibold">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className="border-t border-brand-100 align-top">
                  <td className="px-3 py-2 text-brand-900">{contact.fullName || "-"}</td>
                  <td className="px-3 py-2 text-brand-700">{contact.email || "-"}</td>
                  <td className="px-3 py-2 text-brand-700">{contact.phone || "-"}</td>
                  <td className="px-3 py-2 text-brand-700">{contact.leadCount ?? 0}</td>
                  <td className="px-3 py-2 text-brand-700">{contact.contactMessageCount ?? 0}</td>
                  <td className="px-3 py-2 text-brand-700">{contact.lastSeenAt || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

