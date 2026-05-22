import type { Metadata } from "next";
import { CrmContactsManager } from "@/components/admin/crm/contacts-manager";
import { listCrmContacts } from "@/lib/crm/contacts-store";

export const metadata: Metadata = {
  title: "Admin CRM Contacts",
  description: "Manage Yan's CRM contacts.",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminCrmPage() {
  const contacts = await listCrmContacts();
  return <CrmContactsManager initialContacts={contacts} />;
}
