"use client";

import { useState } from "react";

type ImportStatus = "matched" | "unmatched" | "ambiguous" | "invalid";

interface RankingImportResult {
  rowNumber: number;
  status: ImportStatus;
  inputName?: string;
  inputMunicipality?: string;
  schoolId?: string;
  schoolSlug?: string;
  schoolName?: string;
  municipality?: string;
  level?: "elementary" | "secondary";
  ranking?: {
    source: string;
    year: string;
    score?: number;
    rank?: string;
    url?: string;
  };
  reason?: string;
  candidates?: Array<{
    id: string;
    name: string;
    municipality: string;
    level: "elementary" | "secondary";
    board: string;
  }>;
}

interface RankingImportResponse {
  success?: boolean;
  dryRun?: boolean;
  parsedRows?: number;
  matched?: number;
  unmatched?: number;
  ambiguous?: number;
  invalid?: number;
  updated?: number;
  results?: RankingImportResult[];
  error?: string;
  detail?: string;
}

const sampleCsv = `schoolName,municipality,level,board,source,year,score,rank,url
Moraine Hills Public School,Richmond Hill,elementary,York Region DSB,Fraser Institute,2025,8.6,120/3037,https://www.compareschoolrankings.org/
Richmond Hill High School,Richmond Hill,secondary,York Region DSB,Fraser Institute,2025,8.1,45/739,https://www.compareschoolrankings.org/`;

export function SchoolRankingImportPanel() {
  const [csv, setCsv] = useState("");
  const [defaultSource, setDefaultSource] = useState("Fraser Institute");
  const [defaultYear, setDefaultYear] = useState(new Date().getFullYear().toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMode, setActiveMode] = useState<"preview" | "commit" | null>(null);
  const [response, setResponse] = useState<RankingImportResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function runImport(dryRun: boolean) {
    if (!csv.trim()) {
      setErrorMessage("CSV content is required.");
      return;
    }

    if (!dryRun) {
      const confirmed = window.confirm("Commit matched ranking rows to Firestore?");
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    setActiveMode(dryRun ? "preview" : "commit");
    setErrorMessage("");

    try {
      const apiResponse = await fetch("/api/admin/schools/rankings", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          csv,
          dryRun,
          defaultSource,
          defaultYear
        })
      });

      const json = await parseApiResponse(apiResponse);
      if (!apiResponse.ok || !json.success) {
        throw new Error(json.detail || json.error || `Ranking import failed with status ${apiResponse.status}.`);
      }

      setResponse(json);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Ranking import failed.");
    } finally {
      setIsSubmitting(false);
      setActiveMode(null);
    }
  }

  return (
    <div className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
      <div className="grid gap-4 lg:grid-cols-[1fr_220px_160px]">
        <label className="block text-sm font-semibold text-brand-800">
          Ranking CSV
          <textarea
            value={csv}
            onChange={(event) => setCsv(event.target.value)}
            rows={10}
            className="mt-1 w-full rounded-xl border border-brand-200 bg-brand-50/50 p-3 font-mono text-xs text-brand-900"
            placeholder={sampleCsv}
          />
        </label>

        <label className="block text-sm font-semibold text-brand-800">
          Default source
          <input
            type="text"
            value={defaultSource}
            onChange={(event) => setDefaultSource(event.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
          />
        </label>

        <label className="block text-sm font-semibold text-brand-800">
          Default year
          <input
            type="text"
            value={defaultYear}
            onChange={(event) => setDefaultYear(event.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setCsv(sampleCsv)}
          className="rounded-full border border-brand-300 px-4 py-2.5 text-sm font-semibold text-brand-900"
        >
          Load Sample
        </button>
        <button
          type="button"
          onClick={() => runImport(true)}
          disabled={isSubmitting}
          className="rounded-full bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting && activeMode === "preview" ? "Previewing..." : "Preview Import"}
        </button>
        <button
          type="button"
          onClick={() => runImport(false)}
          disabled={isSubmitting}
          className="rounded-full border border-brand-300 px-4 py-2.5 text-sm font-semibold text-brand-900 disabled:opacity-60"
        >
          {isSubmitting && activeMode === "commit" ? "Committing..." : "Commit Matched Rankings"}
        </button>
      </div>

      {errorMessage ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p> : null}

      {response ? (
        <div className="mt-6 space-y-5">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <ResultMetric label="Rows" value={response.parsedRows ?? 0} />
            <ResultMetric label="Matched" value={response.matched ?? 0} />
            <ResultMetric label="Unmatched" value={response.unmatched ?? 0} />
            <ResultMetric label="Ambiguous" value={response.ambiguous ?? 0} />
            <ResultMetric label="Invalid" value={response.invalid ?? 0} />
            <ResultMetric label="Updated" value={response.updated ?? 0} />
          </div>

          <div className="overflow-hidden rounded-2xl border border-brand-100">
            <div className="max-h-[560px] overflow-auto">
              <table className="min-w-full divide-y divide-brand-100 text-left text-sm">
                <thead className="sticky top-0 bg-brand-50 text-xs uppercase tracking-[0.16em] text-brand-700">
                  <tr>
                    <th className="px-4 py-3">Row</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Input</th>
                    <th className="px-4 py-3">Matched School</th>
                    <th className="px-4 py-3">Ranking</th>
                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100 bg-white">
                  {(response.results ?? []).map((result) => (
                    <tr key={`${result.rowNumber}-${result.status}`}>
                      <td className="px-4 py-3 font-mono text-xs text-brand-700">{result.rowNumber}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(result.status)}`}>
                          {result.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-brand-800">
                        <p className="font-semibold text-brand-900">{result.inputName || "-"}</p>
                        <p className="text-xs">{result.inputMunicipality || "-"}</p>
                      </td>
                      <td className="px-4 py-3 text-brand-800">
                        <p className="font-semibold text-brand-900">{result.schoolName || "-"}</p>
                        <p className="text-xs">{formatSchoolMeta(result)}</p>
                      </td>
                      <td className="px-4 py-3 text-brand-800">
                        <p className="font-semibold text-brand-900">{formatRanking(result)}</p>
                        <p className="text-xs">{result.ranking ? `${result.ranking.source}, ${result.ranking.year}` : "-"}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-brand-700">{formatNotes(result)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ResultMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">{label}</p>
      <p className="mt-1 font-heading text-2xl text-brand-900">{value.toLocaleString()}</p>
    </div>
  );
}

async function parseApiResponse(response: Response): Promise<RankingImportResponse> {
  const raw = await response.text();
  if (!raw.trim()) return {};

  try {
    return JSON.parse(raw) as RankingImportResponse;
  } catch {
    return { error: `The server returned a non-JSON response with status ${response.status}.` };
  }
}

function getStatusClass(status: ImportStatus): string {
  if (status === "matched") return "bg-emerald-100 text-emerald-800";
  if (status === "ambiguous") return "bg-amber-100 text-amber-800";
  if (status === "invalid") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-700";
}

function formatSchoolMeta(result: RankingImportResult): string {
  const parts = [result.municipality, result.level, result.schoolId].filter(Boolean);
  return parts.length > 0 ? parts.join(" | ") : "-";
}

function formatRanking(result: RankingImportResult): string {
  if (!result.ranking) return "-";
  const score = result.ranking.score != null ? `${result.ranking.score}/10` : "";
  return [score, result.ranking.rank].filter(Boolean).join(" | ") || "-";
}

function formatNotes(result: RankingImportResult): string {
  if (result.candidates && result.candidates.length > 0) {
    return result.candidates.map((candidate) => `${candidate.name}, ${candidate.municipality}, ${candidate.level}`).join(" | ");
  }

  return result.reason || "-";
}
