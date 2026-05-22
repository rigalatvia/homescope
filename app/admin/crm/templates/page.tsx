import type { Metadata } from "next";
import { CrmTemplateStudio } from "@/components/admin/crm/template-studio";
import { listCrmTemplates } from "@/lib/crm/templates-store";
import { resolveFirebaseStorageBucketName } from "@/lib/firebase/storage-bucket";

export const metadata: Metadata = {
  title: "Admin CRM Templates",
  description: "Manage Yan's CRM birthday and holiday templates.",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminCrmTemplatesPage() {
  const templates = await listCrmTemplates();

  return (
    <CrmTemplateStudio
      initialTemplates={templates}
      hasStorageBucket={Boolean(resolveFirebaseStorageBucketName())}
    />
  );
}
