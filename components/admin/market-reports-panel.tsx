"use client";

import { useEffect, useMemo, useState } from "react";

interface MarketReportContent {
  id: string;
  citySlug: string;
  reportSlug: string;
  title: string;
  intro: string;
  marketSummary: string;
  buyerTakeaway: string;
  sellerTakeaway: string;
  notes: string[];
  updatedAt?: string;
}

interface MarketReportOption {
  city: string;
  citySlug: string;
  reportSlug: string;
  reportLabel: string;
  content: MarketReportContent;
}

interface MarketReportsResponse {
  success: boolean;
  reportSlug?: string;
  reportLabel?: string;
  reports?: MarketReportOption[];
  content?: MarketReportContent;
  error?: string;
}

export function MarketReportsPanel() {
  const [reports, setReports] = useState<MarketReportOption[]>([]);
  const [selectedCitySlug, setSelectedCitySlug] = useState("");
  const [draft, setDraft] = useState<MarketReportContent | null>(null);
  const [notesText, setNotesText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedReport = useMemo(
    () => reports.find((report) => report.citySlug === selectedCitySlug),
    [reports, selectedCitySlug]
  );

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    if (!selectedReport) return;
    setDraft(selectedReport.content);
    setNotesText(selectedReport.content.notes.join("\n"));
  }, [selectedReport]);

  async function loadReports() {
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/market-reports");
      const json = (await response.json()) as MarketReportsResponse;
      if (!response.ok || !json.success) throw new Error(json.error || "Failed to load reports.");

      const loadedReports = json.reports || [];
      setReports(loadedReports);
      setSelectedCitySlug((current) => current || loadedReports[0]?.citySlug || "");
      setMessage(`Loaded ${json.reportLabel || "current"} reports.`);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load reports.");
    } finally {
      setIsLoading(false);
    }
  }

  async function saveReport() {
    if (!draft || !selectedReport) return;

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/market-reports", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...draft,
          citySlug: selectedReport.citySlug,
          reportSlug: selectedReport.reportSlug,
          notes: notesText
            .split("\n")
            .map((note) => note.trim())
            .filter(Boolean)
        })
      });
      const json = (await response.json()) as MarketReportsResponse;
      if (!response.ok || !json.success || !json.content) {
        throw new Error(json.error || "Failed to save report.");
      }

      setReports((current) =>
        current.map((report) =>
          report.citySlug === selectedReport.citySlug ? { ...report, content: json.content! } : report
        )
      );
      setDraft(json.content);
      setNotesText(json.content.notes.join("\n"));
      setMessage("Market report saved and public page revalidated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save report.");
    } finally {
      setIsSaving(false);
    }
  }

  function updateDraft(field: keyof Pick<MarketReportContent, "title" | "intro" | "marketSummary" | "buyerTakeaway" | "sellerTakeaway">, value: string) {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  return (
    <div className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <label className="block text-sm font-semibold text-brand-800">
          City Report
          <select
            value={selectedCitySlug}
            onChange={(event) => setSelectedCitySlug(event.target.value)}
            className="mt-1 h-11 w-full rounded-lg border border-brand-200 px-3 text-sm md:w-80"
            disabled={isLoading}
          >
            {reports.map((report) => (
              <option key={report.citySlug} value={report.citySlug}>
                {report.city} - {report.reportLabel}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={loadReports}
          disabled={isLoading}
          className="rounded-full border border-brand-300 px-4 py-2.5 text-sm font-semibold text-brand-900 disabled:opacity-60"
        >
          {isLoading ? "Loading..." : "Reload"}
        </button>
      </div>

      {message ? <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p> : null}
      {error ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      {draft && selectedReport ? (
        <div className="mt-6 space-y-5">
          <TextInput label="Headline" value={draft.title} onChange={(value) => updateDraft("title", value)} />
          <TextArea label="Intro" value={draft.intro} rows={4} onChange={(value) => updateDraft("intro", value)} />
          <TextArea
            label="Market Summary"
            value={draft.marketSummary}
            rows={5}
            onChange={(value) => updateDraft("marketSummary", value)}
          />
          <div className="grid gap-5 lg:grid-cols-2">
            <TextArea
              label="Buyer Takeaway"
              value={draft.buyerTakeaway}
              rows={5}
              onChange={(value) => updateDraft("buyerTakeaway", value)}
            />
            <TextArea
              label="Seller Takeaway"
              value={draft.sellerTakeaway}
              rows={5}
              onChange={(value) => updateDraft("sellerTakeaway", value)}
            />
          </div>
          <TextArea
            label="Report Notes (one per line)"
            value={notesText}
            rows={5}
            onChange={setNotesText}
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={saveReport}
              disabled={isSaving}
              className="rounded-full bg-brand-800 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save Report"}
            </button>
            <a
              href={`/market-reports/${selectedReport.citySlug}/${selectedReport.reportSlug}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-brand-300 px-4 py-2.5 text-sm font-semibold text-brand-900"
            >
              Open Public Page
            </a>
            {draft.updatedAt ? <span className="text-sm text-brand-600">Last saved: {draft.updatedAt}</span> : null}
          </div>
        </div>
      ) : (
        <p className="mt-6 text-sm text-brand-700">No report selected.</p>
      )}
    </div>
  );
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-semibold text-brand-800">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  rows,
  onChange
}: {
  label: string;
  value: string;
  rows: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-brand-800">
      {label}
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm leading-6"
      />
    </label>
  );
}
