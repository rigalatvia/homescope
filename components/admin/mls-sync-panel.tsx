"use client";

import { useState } from "react";

type SyncMode = "full" | "incremental" | "cleanup";

interface SyncCounts {
  fetched: number;
  filtered: number;
  created: number;
  updated: number;
  archived: number;
  failed: number;
}

interface SyncResponse {
  success: boolean;
  counts?: SyncCounts;
  error?: string;
}

export function MlsSyncPanel() {
  const [adminToken, setAdminToken] = useState("");
  const [sinceIso, setSinceIso] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMode, setActiveMode] = useState<SyncMode | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [lastCounts, setLastCounts] = useState<SyncCounts | null>(null);

  async function runSync(mode: SyncMode) {
    if (!adminToken.trim()) {
      setErrorMessage("Admin token is required.");
      return;
    }

    setIsSubmitting(true);
    setActiveMode(mode);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const body: Record<string, string> = { mode, connectorKind: "ddf-treb" };
      if (mode === "incremental" && sinceIso.trim()) {
        body.sinceIso = sinceIso.trim();
      }

      const response = await fetch("/api/admin/mls-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-sync-token": adminToken.trim()
        },
        body: JSON.stringify(body)
      });

      const json = (await response.json()) as SyncResponse;
      if (!response.ok || !json.success) {
        throw new Error(json.error || "Sync failed.");
      }

      setLastCounts(json.counts ?? null);
      setSuccessMessage(`Sync completed successfully (${mode}).`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Sync failed.");
    } finally {
      setIsSubmitting(false);
      setActiveMode(null);
    }
  }

  return (
    <div className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-brand-800">
          Admin Sync Token
          <input
            type="password"
            value={adminToken}
            onChange={(event) => setAdminToken(event.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
            placeholder="Enter MLS_SYNC_ADMIN_TOKEN"
          />
        </label>

        <label className="block text-sm font-semibold text-brand-800">
          Incremental Since (optional ISO timestamp)
          <input
            type="text"
            value={sinceIso}
            onChange={(event) => setSinceIso(event.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
            placeholder="2026-04-10T00:00:00.000Z"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => runSync("full")}
            disabled={isSubmitting}
            className="rounded-full bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting && activeMode === "full" ? "Running..." : "Run Full Sync"}
          </button>
          <button
            type="button"
            onClick={() => runSync("incremental")}
            disabled={isSubmitting}
            className="rounded-full border border-brand-300 px-4 py-2.5 text-sm font-semibold text-brand-900 disabled:opacity-60"
          >
            {isSubmitting && activeMode === "incremental" ? "Running..." : "Run Incremental"}
          </button>
          <button
            type="button"
            onClick={() => runSync("cleanup")}
            disabled={isSubmitting}
            className="rounded-full border border-brand-300 px-4 py-2.5 text-sm font-semibold text-brand-900 disabled:opacity-60"
          >
            {isSubmitting && activeMode === "cleanup" ? "Running..." : "Run Cleanup"}
          </button>
        </div>
      </div>

      {successMessage && (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{successMessage}</p>
      )}
      {errorMessage && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>}

      {lastCounts && (
        <div className="mt-5 rounded-xl border border-brand-100 bg-brand-50/70 p-4">
          <p className="text-sm font-semibold text-brand-900">Last Sync Counts</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-brand-800 sm:grid-cols-3">
            <p>Fetched: {lastCounts.fetched}</p>
            <p>Filtered: {lastCounts.filtered}</p>
            <p>Created: {lastCounts.created}</p>
            <p>Updated: {lastCounts.updated}</p>
            <p>Archived: {lastCounts.archived}</p>
            <p>Failed: {lastCounts.failed}</p>
          </div>
        </div>
      )}
    </div>
  );
}

