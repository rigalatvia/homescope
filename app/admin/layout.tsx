"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/sync", label: "Sync" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/contacts", label: "Contacts" },
  { href: "/admin/featured", label: "Featured" }
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <section className="site-container py-10 sm:py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-soft">
          <div className="flex flex-wrap items-center gap-2">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-800 transition hover:border-brand-400"
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="ml-auto rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-800 transition hover:border-brand-400"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

