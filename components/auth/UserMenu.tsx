"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Heart, LayoutDashboard, LogOut } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { useAuth } from "@/hooks/useAuth";

export function UserMenu({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOutUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = useMemo(() => {
    const fallback = user.email?.charAt(0).toUpperCase() || "H";
    if (!user.displayName) return fallback;

    const parts = user.displayName
      .split(" ")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 0) return fallback;
    if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }, [user.displayName, user.email]);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    closeMenu();
  }, [closeMenu, pathname]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [closeMenu]);

  const handleSignOut = async () => {
    try {
      await signOutUser();
      closeMenu();
      router.push("/");
    } catch (error) {
      console.error("[auth] Sign-out failed", error);
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-2 py-1.5 shadow-soft transition hover:border-brand-200"
      >
        {user.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.photoURL} alt={user.displayName || "Signed-in user"} className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-900 text-sm font-semibold text-white">
            {initials}
          </span>
        )}
        <ChevronDown className="h-4 w-4 text-brand-600" />
      </button>

      <div
        className={`absolute right-0 top-full z-30 mt-2 w-64 rounded-2xl border border-brand-100 bg-white p-2 shadow-soft transition ${
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="rounded-xl bg-brand-50/70 px-4 py-3">
          <p className="text-sm font-semibold text-brand-900">{user.displayName || "HomeScope Client"}</p>
          <p className="mt-1 text-xs text-brand-600">{user.email}</p>
        </div>

        <div className="mt-2 flex flex-col gap-1">
          <Link
            href="/dashboard"
            onClick={closeMenu}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/dashboard#saved-homes"
            onClick={closeMenu}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
          >
            <Heart className="h-4 w-4" />
            Saved Homes
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
