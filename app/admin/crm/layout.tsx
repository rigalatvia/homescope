import type { ReactNode } from "react";
import { CrmNavigation } from "@/components/admin/crm/navigation";

export default function AdminCrmLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-brand-100 bg-white p-7 shadow-soft lg:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">CRM Workspace</p>
        <h1 className="mt-2 font-heading text-4xl text-brand-900">Yan CRM</h1>
        <p className="mt-3 max-w-5xl text-sm leading-7 text-brand-700">
          Contacts and card templates now live in separate workspaces so each task has a cleaner, more focused screen.
        </p>
      </div>

      <CrmNavigation />

      {children}
    </div>
  );
}
