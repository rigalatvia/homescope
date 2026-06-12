"use client";

import { Bell, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { SignInButton } from "@/components/auth/SignInButton";
import { useAuth } from "@/hooks/useAuth";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import { DEFAULT_MAX_PRICE, DEFAULT_MIN_PRICE } from "@/lib/listings/filters";
import type { ListingFilters } from "@/types/listing";

interface SaveSearchButtonProps {
  filters: ListingFilters;
  resultsTotal: number;
}

export function SaveSearchButton({ filters, resultsTotal }: SaveSearchButtonProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { saveSearch, isPending } = useSavedSearches();
  const [showPrompt, setShowPrompt] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const pending = isPending();
  const label = useMemo(() => buildSavedSearchLabel(filters), [filters]);

  const handleSave = async () => {
    if (authLoading || pending) return;

    if (!user) {
      setErrorMessage("");
      setShowPrompt(true);
      return;
    }

    try {
      await saveSearch({
        label,
        path: pathname || "/listings",
        queryString: cleanQueryString(searchParams),
        filters,
        resultsTotal,
        alertsEnabled: true,
        alertFrequency: "daily"
      });
      setErrorMessage("");
      setStatusMessage("Saved. Daily alerts are on for this search.");
    } catch (error) {
      console.error("[savedSearches] Failed to save search", error);
      setStatusMessage("");
      setErrorMessage(error instanceof Error ? error.message : "We could not save this search right now. Please try again.");
    }
  };

  return (
    <>
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => {
            void handleSave();
          }}
          disabled={authLoading || pending}
          className="inline-flex items-center gap-2 rounded-full bg-brand-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
          Save Search + Alerts
        </button>
        {statusMessage ? <p className="text-xs font-semibold text-emerald-700">{statusMessage}</p> : null}
        {errorMessage ? <p className="text-xs font-semibold text-red-700">{errorMessage}</p> : null}
      </div>

      {showPrompt ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-brand-900/45 p-4">
          <div className="w-full max-w-sm rounded-[1.75rem] border border-brand-100 bg-white p-6 shadow-soft">
            <p className="font-heading text-3xl text-brand-900">Sign in to save this search.</p>
            <p className="mt-3 text-sm leading-7 text-brand-700">
              Saved searches keep your filters ready and prepare daily new-listing alerts for your account.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <SignInButton
                label="Sign in with Google"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
                onSuccess={() => {
                  setShowPrompt(false);
                  setStatusMessage("Signed in. Click Save Search + Alerts once more to save this search.");
                }}
                onError={setErrorMessage}
              />
              <button
                type="button"
                onClick={() => setShowPrompt(false)}
                className="inline-flex items-center justify-center rounded-full border border-brand-200 px-5 py-3 text-sm font-semibold text-brand-900 transition hover:bg-brand-50"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function buildSavedSearchLabel(filters: ListingFilters): string {
  const parts = [
    filters.city || "GTA",
    filters.transactionType === "lease" ? "For Lease" : "For Sale",
    filters.propertyType,
    filters.bedrooms ? `${filters.bedrooms}${filters.bedroomsMatch === "exact" ? "" : "+"} Bed` : undefined,
    filters.schoolSlug ? "Near School" : undefined,
    hasMapBounds(filters) ? "Map Area" : undefined
  ].filter(Boolean);

  return `${parts.join(" - ")} Search`;
}

function cleanQueryString(searchParams: URLSearchParams): string {
  const params = new URLSearchParams(searchParams.toString());
  params.delete("page");
  params.delete("pageSize");

  if (!params.has("minPrice")) params.set("minPrice", String(DEFAULT_MIN_PRICE));
  if (!params.has("maxPrice")) params.set("maxPrice", String(DEFAULT_MAX_PRICE));

  return params.toString();
}

function hasMapBounds(filters: ListingFilters): boolean {
  return (
    filters.minLatitude != null ||
    filters.maxLatitude != null ||
    filters.minLongitude != null ||
    filters.maxLongitude != null
  );
}
