import Link from "next/link";
import { Bell, Search, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { buildSavedSearchUrl, type SavedSearchAlertFrequency, type SavedSearchRecord } from "@/lib/savedSearches";

interface SavedSearchesSectionProps {
  savedSearches: SavedSearchRecord[];
  loading: boolean;
  error: string | null;
  isPending: (searchId?: string) => boolean;
  onUpdateAlerts: (
    searchId: string,
    options: { alertsEnabled: boolean; alertFrequency: SavedSearchAlertFrequency }
  ) => Promise<void>;
  onRemove: (searchId: string) => Promise<void>;
}

const ALERT_FREQUENCIES: Array<{ value: SavedSearchAlertFrequency; label: string }> = [
  { value: "instant", label: "Instant" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" }
];

export function SavedSearchesSection({
  savedSearches,
  loading,
  error,
  isPending,
  onUpdateAlerts,
  onRemove
}: SavedSearchesSectionProps) {
  return (
    <section id="saved-searches" className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-3xl text-brand-900">Saved Searches</h2>
          <p className="mt-2 text-sm leading-7 text-brand-700 sm:text-base">
            Keep high-intent searches ready and turn on alerts for matching new listings.
          </p>
        </div>
        <Link
          href="/listings"
          className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:text-brand-900"
        >
          <Search className="h-4 w-4" />
          Start a Search
        </Link>
      </div>

      {error ? <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {loading ? (
        <div className="mt-8 grid gap-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-[1.5rem] border border-brand-100 bg-brand-50/60" />
          ))}
        </div>
      ) : savedSearches.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="You haven&apos;t saved any searches yet."
            description="Apply filters on the listing search, then save the search to prepare listing alerts."
            actionHref="/listings"
            actionLabel="Browse Listings"
          />
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {savedSearches.map((search) => (
            <SavedSearchCard
              key={search.id}
              search={search}
              pending={isPending(search.id)}
              onUpdateAlerts={onUpdateAlerts}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function SavedSearchCard({
  search,
  pending,
  onUpdateAlerts,
  onRemove
}: {
  search: SavedSearchRecord;
  pending: boolean;
  onUpdateAlerts: SavedSearchesSectionProps["onUpdateAlerts"];
  onRemove: SavedSearchesSectionProps["onRemove"];
}) {
  return (
    <article className="rounded-[1.5rem] border border-brand-100 bg-brand-50/40 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-heading text-2xl text-brand-900">{search.label}</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700">
              <Bell className="h-3.5 w-3.5" />
              {search.alertsEnabled ? `${capitalize(search.alertFrequency)} alerts` : "Alerts paused"}
            </span>
          </div>
          <p className="mt-2 text-sm text-brand-700">
            {search.resultsTotal} listing(s) matched when saved
            {search.createdAt ? ` on ${new Intl.DateTimeFormat("en-CA").format(new Date(search.createdAt))}` : ""}.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={buildSavedSearchUrl(search)}
            className="inline-flex rounded-full bg-brand-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            Open Search
          </Link>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              void onRemove(search.id);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-800 transition hover:border-brand-400 disabled:cursor-wait disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
        <label className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm font-semibold text-brand-800">
          <input
            type="checkbox"
            checked={search.alertsEnabled}
            disabled={pending}
            onChange={(event) => {
              void onUpdateAlerts(search.id, {
                alertsEnabled: event.target.checked,
                alertFrequency: search.alertFrequency
              });
            }}
            className="h-4 w-4 rounded border-brand-300 text-brand-900"
          />
          Email alerts for new matching listings
        </label>

        <select
          value={search.alertFrequency}
          disabled={pending || !search.alertsEnabled}
          onChange={(event) => {
            void onUpdateAlerts(search.id, {
              alertsEnabled: search.alertsEnabled,
              alertFrequency: event.target.value as SavedSearchAlertFrequency
            });
          }}
          className="rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm font-semibold text-brand-800 disabled:opacity-60"
        >
          {ALERT_FREQUENCIES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </article>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
