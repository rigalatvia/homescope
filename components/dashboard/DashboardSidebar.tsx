"use client";

import Link from "next/link";
import { Bell, Heart, House, LayoutDashboard, LogOut } from "lucide-react";
import type { User } from "firebase/auth";

interface DashboardSidebarProps {
  user: User;
  onSignOut: () => Promise<void>;
}

export function DashboardSidebar({ user, onSignOut }: DashboardSidebarProps) {
  const initials = getUserInitials(user);

  return (
    <aside className="space-y-6 rounded-[2rem] border border-brand-100 bg-white p-5 shadow-soft">
      <div className="rounded-[1.5rem] border border-brand-100 bg-brand-50/50 p-4">
        <div className="flex items-center gap-3">
          {user.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt={user.displayName || "Dashboard user"} className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-900 text-base font-semibold text-white">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-brand-900">{user.displayName || "HomeScope Client"}</p>
            <p className="truncate text-sm text-brand-600">{user.email}</p>
          </div>
        </div>
      </div>

      <nav aria-label="Dashboard navigation" className="space-y-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-2xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-900"
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
        <Link
          href="/dashboard#saved-homes"
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 hover:text-brand-900"
        >
          <Heart className="h-4 w-4" />
          Saved Homes
        </Link>
        <Link
          href="/dashboard#saved-searches"
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 hover:text-brand-900"
        >
          <Bell className="h-4 w-4" />
          Saved Searches
        </Link>
        <Link
          href="/dashboard#my-showings"
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 hover:text-brand-900"
        >
          <House className="h-4 w-4" />
          My Showings
        </Link>
      </nav>

      <div className="rounded-[1.75rem] border border-brand-100 bg-white p-5 shadow-soft">
        <p className="font-heading text-2xl text-brand-900">Need help finding the right home?</p>
        <p className="mt-3 text-sm leading-7 text-brand-700">We&apos;re here to help you every step of the way.</p>
        <Link
          href="/contact"
          className="mt-5 inline-flex rounded-full border border-accent/40 px-4 py-2.5 text-sm font-semibold text-accent transition hover:border-accent hover:bg-brand-50"
        >
          Contact Us
        </Link>
      </div>

      <button
        type="button"
        onClick={() => {
          void onSignOut();
        }}
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 transition hover:text-brand-900"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </aside>
  );
}

function getUserInitials(user: User): string {
  const fallback = user.email?.charAt(0).toUpperCase() || "H";
  if (!user.displayName) return fallback;

  const parts = user.displayName
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}
