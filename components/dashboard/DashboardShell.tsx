"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Search, MapPinned, ShieldCheck } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MyShowingsSection } from "@/components/dashboard/MyShowingsSection";
import { SavedHomesSection } from "@/components/dashboard/SavedHomesSection";
import { SignInButton } from "@/components/auth/SignInButton";
import { useAuth } from "@/hooks/useAuth";
import { useSavedHomes } from "@/hooks/useSavedHomes";

export function DashboardShell() {
  const { user, loading, signOutUser } = useAuth();
  const { savedListings, loading: savedHomesLoading, error, removeHome } = useSavedHomes();

  if (loading) {
    return (
      <section className="site-container py-10">
        <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
          <div className="h-80 animate-pulse rounded-[2rem] border border-brand-100 bg-white shadow-soft" />
          <div className="space-y-6">
            <div className="h-32 animate-pulse rounded-[2rem] border border-brand-100 bg-white shadow-soft" />
            <div className="h-80 animate-pulse rounded-[2rem] border border-brand-100 bg-white shadow-soft" />
            <div className="h-72 animate-pulse rounded-[2rem] border border-brand-100 bg-white shadow-soft" />
          </div>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="site-container py-12 sm:py-16">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-brand-100 bg-white p-8 text-center shadow-soft sm:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Dashboard Access</p>
          <h1 className="mt-3 font-heading text-4xl text-brand-900 sm:text-5xl">Sign in to view your dashboard</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-brand-700">
            Save homes and keep track of your showing requests.
          </p>
          <div className="mt-8 flex justify-center">
            <SignInButton
              label="Sign in with Google"
              className="inline-flex items-center gap-2 rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
            />
          </div>
        </div>
      </section>
    );
  }

  const firstName = user.displayName?.split(" ").filter(Boolean)[0] || "there";

  return (
    <section className="site-container py-10 sm:py-12">
      <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
        <div className="hidden lg:block">
          <DashboardSidebar user={user} onSignOut={signOutUser} />
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Dashboard</p>
            <h1 className="mt-3 font-heading text-4xl text-brand-900 sm:text-5xl">
              Welcome back, {firstName} {"\u{1F44B}"}
            </h1>
            <p className="mt-3 text-base leading-8 text-brand-700">Continue your search</p>
          </div>

          <SavedHomesSection
            savedListings={savedListings}
            loading={savedHomesLoading}
            error={error}
            onRemove={removeHome}
          />

          <MyShowingsSection user={user} />

          <section className="grid gap-4 rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:grid-cols-3">
            <BenefitCard
              icon={<Search className="h-5 w-5" />}
              title="Search smarter"
              description="Powerful filters to find the right home."
            />
            <BenefitCard
              icon={<MapPinned className="h-5 w-5" />}
              title="Local expertise"
              description="Guides and insights about GTA communities."
            />
            <BenefitCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Buy with confidence"
              description="Everything you need to make the right decision."
            />
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[2rem] border border-brand-100 bg-white p-5 shadow-soft lg:hidden">
            <div>
              <p className="font-heading text-2xl text-brand-900">Need help finding the right home?</p>
              <p className="mt-2 text-sm leading-7 text-brand-700">We&apos;re here to help you every step of the way.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex rounded-full border border-accent/40 px-4 py-2.5 text-sm font-semibold text-accent transition hover:border-accent hover:bg-brand-50"
              >
                Contact Us
              </Link>
              <button
                type="button"
                onClick={() => {
                  void signOutUser();
                }}
                className="inline-flex rounded-full border border-brand-200 px-4 py-2.5 text-sm font-semibold text-brand-900 transition hover:bg-brand-50"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BenefitCard({
  icon,
  title,
  description
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.5rem] bg-brand-50/60 p-5">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand-900 shadow-soft">
        {icon}
      </span>
      <p className="mt-4 font-heading text-2xl text-brand-900">{title}</p>
      <p className="mt-3 text-sm leading-7 text-brand-700">{description}</p>
    </div>
  );
}
