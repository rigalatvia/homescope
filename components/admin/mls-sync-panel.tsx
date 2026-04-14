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
  result?: {
    mode?: string;
    startedAt?: string;
    finishedAt?: string;
    notes?: string[];
    stats?: {
      fetched?: number;
      filtered?: number;
      normalized?: number;
      included?: number;
      excluded?: number;
      excludedPermToAdvertiseFalse?: number;
      hiddenByReason?: Record<string, number>;
      created?: number;
      updated?: number;
      archived?: number;
      upserted?: number;
      hidden?: number;
      unchanged?: number;
      snapshotsWritten?: number;
      failed?: number;
    };
  };
  error?: string;
}

interface SecretsCheckResponse {
  success: boolean;
  logs?: string[];
  error?: string;
  detail?: string;
}

interface ListingsStatsResponse {
  success: boolean;
  stats?: {
    totalRows: number;
    visibleRows: number;
    hiddenRows: number;
    checkedAt: string;
  };
  error?: string;
}

async function parseApiResponse<T>(response: Response): Promise<T | null> {
  const raw = await response.text();
  if (!raw.trim()) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(raw);
  }
}

export function MlsSyncPanel() {
  const [adminToken, setAdminToken] = useState("");
  const [sinceIso, setSinceIso] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMode, setActiveMode] = useState<SyncMode | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [lastCounts, setLastCounts] = useState<SyncCounts | null>(null);
  const [diagnosticLogs, setDiagnosticLogs] = useState<string>("");
  const [isCheckingSecrets, setIsCheckingSecrets] = useState(false);
  const [isRunningFullAll, setIsRunningFullAll] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [listingsStats, setListingsStats] = useState<{
    totalRows: number;
    visibleRows: number;
    hiddenRows: number;
    checkedAt: string;
  } | null>(null);

  function appendDiagnosticLog(lines: string[]): void {
    const payload = lines.join("\n");
    setDiagnosticLogs((prev) => (prev ? `${prev}\n${payload}` : payload));
  }

  async function runSync(mode: SyncMode, options?: { resetCursorToFirstPage?: boolean }): Promise<SyncResponse> {
    if (!adminToken.trim()) {
      setErrorMessage("Admin token is required.");
      throw new Error("Admin token is required.");
    }

    setIsSubmitting(true);
    setActiveMode(mode);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const body: Record<string, string | boolean> = { mode, connectorKind: "ddf-treb" };
      if (mode === "incremental" && sinceIso.trim()) {
        body.sinceIso = sinceIso.trim();
      }
      if (mode === "full" && options?.resetCursorToFirstPage) {
        body.resetCursorToFirstPage = true;
      }

      const response = await fetch("/api/admin/mls-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-sync-token": adminToken.trim()
        },
        body: JSON.stringify(body)
      });

      const json = await parseApiResponse<SyncResponse>(response);
      if (!json || !response.ok || !json.success) {
        const apiError = json?.error || `Sync failed with status ${response.status}.`;
        throw new Error(apiError);
      }

      setLastCounts(json.counts ?? null);
      setSuccessMessage(`Sync completed successfully (${mode}).`);
      const stats = json.result?.stats;
      const hiddenByReason = stats?.hiddenByReason ?? {};
      const hiddenByReasonText =
        Object.keys(hiddenByReason).length > 0
          ? Object.entries(hiddenByReason)
              .map(([key, value]) => `${key}:${value}`)
              .join(", ")
          : "none";

      appendDiagnosticLog([
        `[sync] ${new Date().toISOString()} mode=${mode} status=success`,
        `[sync] fetched=${stats?.fetched ?? json.counts?.fetched ?? 0} filtered=${stats?.filtered ?? json.counts?.filtered ?? 0} normalized=${stats?.normalized ?? 0}`,
        `[sync] included=${stats?.included ?? 0} excluded=${stats?.excluded ?? 0} excludedPermToAdvertiseFalse=${stats?.excludedPermToAdvertiseFalse ?? 0}`,
        `[sync] created=${stats?.created ?? json.counts?.created ?? 0} updated=${stats?.updated ?? json.counts?.updated ?? 0} upserted=${stats?.upserted ?? 0} unchanged=${stats?.unchanged ?? 0}`,
        `[sync] archived=${stats?.archived ?? json.counts?.archived ?? 0} hidden=${stats?.hidden ?? 0} snapshotsWritten=${stats?.snapshotsWritten ?? 0} failed=${stats?.failed ?? json.counts?.failed ?? 0}`,
        `[sync] hiddenByReason=${hiddenByReasonText}`
      ]);
      if (json.result?.notes && json.result.notes.length > 0) {
        appendDiagnosticLog(json.result.notes.map((note) => `[sync-note] ${note}`));
      }
      await loadListingsStats();
      return json;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sync failed.";
      setErrorMessage(message);
      appendDiagnosticLog([`[sync-error] ${new Date().toISOString()} mode=${mode} message=${message}`]);
      throw error;
    } finally {
      setIsSubmitting(false);
      setActiveMode(null);
    }
  }

  async function loadListingsStats() {
    if (!adminToken.trim()) return;
    setIsLoadingStats(true);
    try {
      const response = await fetch("/api/admin/listings-stats", {
        method: "GET",
        headers: {
          "x-admin-sync-token": adminToken.trim()
        }
      });
      const json = await parseApiResponse<ListingsStatsResponse>(response);
      if (!json || !response.ok || !json.success || !json.stats) {
        throw new Error(json?.error || `Listings stats failed with status ${response.status}.`);
      }
      setListingsStats(json.stats);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load listings stats.";
      appendDiagnosticLog([`[stats-error] ${new Date().toISOString()} message=${message}`]);
    } finally {
      setIsLoadingStats(false);
    }
  }

  async function runFullUntilEnd() {
    if (isRunningFullAll) return;
    setIsRunningFullAll(true);
    setErrorMessage("");
    setSuccessMessage("");

    const maxIterations = 80;

    try {
      for (let i = 0; i < maxIterations; i += 1) {
        const json = await runSync("full", { resetCursorToFirstPage: i === 0 });
        const notes = json.result?.notes || [];
        const reachedEnd = notes.some((note) => /reached end of feed|cursor reset to page 1/i.test(note));
        if (reachedEnd) {
          setSuccessMessage("Full sync completed for all pages (cursor reached end of feed).");
          return;
        }
      }

      setSuccessMessage("Stopped after safety limit. Run again to continue from current cursor.");
    } catch {
      // runSync already logs and sets error state
    } finally {
      setIsRunningFullAll(false);
    }
  }

  async function checkSecretsAccess() {
    setIsCheckingSecrets(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/admin/secrets-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-sync-token": adminToken.trim()
        },
        body: JSON.stringify({})
      });

      const json = await parseApiResponse<SecretsCheckResponse>(response);
      if (!json || !response.ok || !json.success) {
        throw new Error(json?.error || json?.detail || `Secrets check failed with status ${response.status}.`);
      }

      const logs = (json.logs ?? []).join("\n");
      if (logs) {
        appendDiagnosticLog([logs]);
      } else {
        appendDiagnosticLog(["[secrets-check] No diagnostics logs returned."]);
      }
      setSuccessMessage("Secrets diagnostics completed.");
    } catch (error) {
      setDiagnosticLogs("");
      setErrorMessage(error instanceof Error ? error.message : "Secrets diagnostics failed.");
    } finally {
      setIsCheckingSecrets(false);
    }
  }

  function confirmAndRunCleanup() {
    const confirmed = window.confirm(
      "Run Cleanup will remove existing listings data. Are you sure you want to continue?"
    );
    if (!confirmed) return;
    void runSync("cleanup");
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

        <div className="grid gap-3 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => runSync("full")}
            disabled={isSubmitting || isRunningFullAll}
            className="rounded-full bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting && activeMode === "full" ? "Running..." : "Run Full Sync"}
          </button>
          <button
            type="button"
            onClick={runFullUntilEnd}
            disabled={isSubmitting || isRunningFullAll}
            className="rounded-full border border-brand-300 px-4 py-2.5 text-sm font-semibold text-brand-900 disabled:opacity-60"
          >
            {isRunningFullAll ? "Running All..." : "Run Full (All Pages)"}
          </button>
          <button
            type="button"
            onClick={() => runSync("incremental")}
            disabled={isSubmitting || isRunningFullAll}
            className="rounded-full border border-brand-300 px-4 py-2.5 text-sm font-semibold text-brand-900 disabled:opacity-60"
          >
            {isSubmitting && activeMode === "incremental" ? "Running..." : "Run Incremental"}
          </button>
          <button
            type="button"
            onClick={confirmAndRunCleanup}
            disabled={isSubmitting || isRunningFullAll}
            className="rounded-full border border-brand-300 px-4 py-2.5 text-sm font-semibold text-brand-900 disabled:opacity-60"
          >
            {isSubmitting && activeMode === "cleanup" ? "Running..." : "Run Cleanup"}
          </button>
        </div>

        <button
          type="button"
          onClick={checkSecretsAccess}
          disabled={isCheckingSecrets}
          className="rounded-full border border-brand-300 px-4 py-2.5 text-sm font-semibold text-brand-900 disabled:opacity-60"
        >
          {isCheckingSecrets ? "Checking Secrets..." : "Check Secrets Access"}
        </button>

        <button
          type="button"
          onClick={loadListingsStats}
          disabled={isLoadingStats}
          className="rounded-full border border-brand-300 px-4 py-2.5 text-sm font-semibold text-brand-900 disabled:opacity-60"
        >
          {isLoadingStats ? "Loading Stats..." : "Refresh Listings Stats"}
        </button>
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

      {listingsStats && (
        <div className="mt-5 rounded-xl border border-brand-100 bg-brand-50/70 p-4">
          <p className="text-sm font-semibold text-brand-900">Listings Collection Stats</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-brand-800 sm:grid-cols-4">
            <p>Total Rows: {listingsStats.totalRows}</p>
            <p>Visible Rows: {listingsStats.visibleRows}</p>
            <p>Hidden Rows: {listingsStats.hiddenRows}</p>
            <p>Checked: {new Date(listingsStats.checkedAt).toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="mt-5">
        <p className="mb-2 text-sm font-semibold text-brand-900">Diagnostics Log</p>
        <textarea
          readOnly
          value={diagnosticLogs}
          placeholder="Run 'Check Secrets Access' to view server secret/env diagnostics."
          rows={10}
          className="w-full rounded-xl border border-brand-200 bg-brand-50/50 p-3 font-mono text-xs text-brand-900"
        />
      </div>
    </div>
  );
}
