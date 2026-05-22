import type { Metadata } from "next";
import { CrmManager } from "@/components/admin/crm-manager";
import { listCrmContacts } from "@/lib/crm/contacts-store";
import { listCrmTemplates } from "@/lib/crm/templates-store";

export const metadata: Metadata = {
  title: "Admin CRM",
  description: "Manage CRM contacts and card templates for Yan.",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminCrmPage() {
  const [contacts, templates] = await Promise.all([listCrmContacts(), listCrmTemplates()]);

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-brand-100 bg-white p-7 shadow-soft lg:p-8">
        <h1 className="font-heading text-4xl text-brand-900">CRM Manager</h1>
        <p className="mt-3 max-w-5xl text-sm leading-7 text-brand-700">
          Manage Yan&apos;s contact list, keep birthdays in the CRM, and update the birthday or holiday email card templates with new text and images.
        </p>
      </div>
      <CrmManager initialContacts={contacts} initialTemplates={templates} />
    </div>
  );
}
