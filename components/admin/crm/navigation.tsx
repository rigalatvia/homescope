"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const crmLinks = [
  {
    href: "/admin/crm",
    label: "Contacts",
    description: "Import, search, and edit Yan's contact list."
  },
  {
    href: "/admin/crm/templates",
    label: "Templates",
    description: "Manage birthday and holiday card designs."
  },
  {
    href: "/admin/crm/campaigns",
    label: "Campaigns",
    description: "Review the daily birthday and holiday send activity."
  }
];

export function CrmNavigation() {
  const pathname = usePathname();

  return (
    <div className="rounded-3xl border border-brand-100 bg-white p-3 shadow-soft">
      <div className="grid gap-3 md:grid-cols-3">
        {crmLinks.map((link) => {
          const isActive = link.href === "/admin/crm" ? pathname === link.href : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-2xl border px-5 py-4 transition ${
                isActive
                  ? "border-brand-900 bg-brand-900 text-white"
                  : "border-brand-200 bg-white text-brand-900 hover:border-brand-400"
              }`}
            >
              <p className="text-lg font-semibold">{link.label}</p>
              <p className={`mt-1 text-sm ${isActive ? "text-white/80" : "text-brand-600"}`}>{link.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
