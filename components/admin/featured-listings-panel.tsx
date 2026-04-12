"use client";

import { useMemo, useState } from "react";

interface ListingOption {
  id: string;
  mlsNumber: string;
  address: string;
  city: string;
  price: number;
  slug: string;
}

interface FeaturedResponse {
  success: boolean;
  featuredListingIds?: string[];
  listings?: ListingOption[];
  error?: string;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0
  }).format(value || 0);
}

export function FeaturedListingsPanel() {
  const [adminToken, setAdminToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [listings, setListings] = useState<ListingOption[]>([]);
  const [featuredListingIds, setFeaturedListingIds] = useState<string[]>([]);
  const [candidateId, setCandidateId] = useState("");

  const listingMap = useMemo(() => new Map(listings.map((item) => [item.id, item])), [listings]);
  const availableCandidates = listings.filter(
    (listing) => !featuredListingIds.includes(listing.id) && listing.id !== candidateId
  );

  async function loadData() {
    if (!adminToken.trim()) {
      setErrorMessage("Admin token is required.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/admin/featured", {
        method: "GET",
        headers: {
          "x-admin-sync-token": adminToken.trim()
        }
      });
      const json = (await response.json()) as FeaturedResponse;
      if (!response.ok || !json.success) {
        throw new Error(json.error || "Failed to load featured data.");
      }

      setListings(json.listings || []);
      setFeaturedListingIds(json.featuredListingIds || []);
      setSuccessMessage("Featured listing data loaded.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load featured data.");
    } finally {
      setIsLoading(false);
    }
  }

  async function saveFeaturedOrder() {
    if (!adminToken.trim()) {
      setErrorMessage("Admin token is required.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/admin/featured", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-sync-token": adminToken.trim()
        },
        body: JSON.stringify({ featuredListingIds })
      });
      const json = (await response.json()) as FeaturedResponse;
      if (!response.ok || !json.success) {
        throw new Error(json.error || "Failed to save featured order.");
      }

      setFeaturedListingIds(json.featuredListingIds || []);
      setSuccessMessage("Featured listing order saved.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save featured order.");
    } finally {
      setIsSaving(false);
    }
  }

  function addFeatured(id: string) {
    if (!id) return;
    setFeaturedListingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setCandidateId("");
  }

  function removeFeatured(id: string) {
    setFeaturedListingIds((prev) => prev.filter((item) => item !== id));
  }

  function moveFeatured(id: string, direction: "up" | "down") {
    setFeaturedListingIds((prev) => {
      const index = prev.indexOf(id);
      if (index === -1) return prev;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const clone = [...prev];
      [clone[index], clone[targetIndex]] = [clone[targetIndex], clone[index]];
      return clone;
    });
  }

  return (
    <div className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-brand-800">
          Admin Token
          <input
            type="password"
            value={adminToken}
            onChange={(event) => setAdminToken(event.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
            placeholder="Enter MLS_SYNC_ADMIN_TOKEN"
          />
        </label>

        <button
          type="button"
          onClick={loadData}
          disabled={isLoading}
          className="rounded-full border border-brand-300 px-4 py-2.5 text-sm font-semibold text-brand-900 disabled:opacity-60"
        >
          {isLoading ? "Loading..." : "Load Listings"}
        </button>
      </div>

      {successMessage && (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{successMessage}</p>
      )}
      {errorMessage && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>}

      <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50/50 p-4">
        <p className="text-sm font-semibold text-brand-900">Add Featured Listing</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <select
            value={candidateId}
            onChange={(event) => setCandidateId(event.target.value)}
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
          >
            <option value="">Select listing</option>
            {availableCandidates.map((listing) => (
              <option key={listing.id} value={listing.id}>
                {listing.mlsNumber} - {listing.address} ({listing.city}) {formatPrice(listing.price)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => addFeatured(candidateId)}
            disabled={!candidateId}
            className="rounded-full bg-brand-800 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Add
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <p className="text-sm font-semibold text-brand-900">Featured Order (shown first)</p>
        {featuredListingIds.length === 0 ? (
          <p className="rounded-lg border border-brand-100 bg-brand-50/70 p-3 text-sm text-brand-700">
            No featured listings selected yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {featuredListingIds.map((id, index) => {
              const listing = listingMap.get(id);
              return (
                <li key={id} className="rounded-xl border border-brand-100 bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-brand-800">
                      <p className="font-semibold text-brand-900">
                        #{index + 1} {listing?.mlsNumber || "N/A"} - {listing?.address || id}
                      </p>
                      <p className="text-brand-700">
                        {listing?.city || "Unknown"} {listing ? `• ${formatPrice(listing.price)}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => moveFeatured(id, "up")}
                        className="rounded-full border border-brand-300 px-3 py-1 text-xs font-semibold text-brand-900"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        onClick={() => moveFeatured(id, "down")}
                        className="rounded-full border border-brand-300 px-3 py-1 text-xs font-semibold text-brand-900"
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFeatured(id)}
                        className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={saveFeaturedOrder}
          disabled={isSaving}
          className="rounded-full bg-brand-800 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Featured Order"}
        </button>
      </div>
    </div>
  );
}
