import { NextResponse } from "next/server";
import { runIncrementalSync } from "@/lib/mls/sync/runIncrementalSync";
import { runStaleCleanup } from "@/lib/mls/sync/runStaleCleanup";
import { getServerSecretValue } from "@/lib/server/secret-manager";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type { MLSSyncResult } from "@/lib/mls/types";

export const maxDuration = 900;

const SETTINGS_COLLECTION = "settings";
const SCHEDULER_STATUS_DOC_ID = "mlsSchedulerStatus";
const DEFAULT_INCREMENTAL_RUN_LIMIT = 20;
const DEFAULT_SAFE_RUNTIME_SECONDS = 240;
const DEFAULT_CLEANUP_INTERVAL_HOURS = 24;

function buildScheduledCounts(results: Array<MLSSyncResult | null>) {
  return results.reduce(
    (totals, result) => {
      if (!result) return totals;

      totals.fetched += result.stats.fetched;
      totals.filtered += result.stats.filtered;
      totals.created += result.stats.created;
      totals.updated += result.stats.updated;
      totals.deleted += result.stats.archived;
      totals.archived += result.stats.archived;
      totals.failed += result.stats.failed;
      return totals;
    },
    {
      fetched: 0,
      filtered: 0,
      created: 0,
      updated: 0,
      deleted: 0,
      archived: 0,
      failed: 0
    }
  );
}

function mergeCounts(target: ReturnType<typeof buildScheduledCounts>, result: MLSSyncResult | null) {
  if (!result) return target;
  target.fetched += result.stats.fetched;
  target.filtered += result.stats.filtered;
  target.created += result.stats.created;
  target.updated += result.stats.updated;
  target.deleted += result.stats.archived;
  target.archived += result.stats.archived;
  target.failed += result.stats.failed;
  return target;
}

function incrementalReachedEnd(result: MLSSyncResult | null): boolean {
  if (!result?.notes?.length) return false;
  return result.notes.some((note) => /incremental reached end of updated feed/i.test(note));
}

function getPositiveIntegerEnv(key: string, fallback: number): number {
  const parsed = Number(process.env[key]);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

function elapsedSeconds(startedAtMs: number): number {
  return (Date.now() - startedAtMs) / 1000;
}

function hoursSince(value: unknown): number | null {
  if (typeof value !== "string" || !value) return null;

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;

  return (Date.now() - timestamp) / (1000 * 60 * 60);
}

export async function POST(request: Request) {
  const schedulerToken = await getServerSecretValue("MLS_SCHEDULER_TOKEN");
  const requestToken = request.headers.get("x-scheduler-token");

  if (!schedulerToken) {
    return NextResponse.json({ error: "Scheduler token is not configured." }, { status: 503 });
  }

  if (requestToken !== schedulerToken) {
    return NextResponse.json({ error: "Unauthorized scheduler trigger." }, { status: 401 });
  }

  const firestore = getFirebaseAdminFirestore();
  const incrementalResults: MLSSyncResult[] = [];
  let cleanupResult: MLSSyncResult | null = null;
  let incrementalError: string | null = null;
  let incrementalIncomplete: string | null = null;
  let cleanupError: string | null = null;
  const startedAtMs = Date.now();
  const maxIncrementalRuns = getPositiveIntegerEnv(
    "MLS_SCHEDULED_INCREMENTAL_RUN_LIMIT",
    DEFAULT_INCREMENTAL_RUN_LIMIT
  );
  const safeRuntimeSeconds = getPositiveIntegerEnv(
    "MLS_SCHEDULED_SAFE_RUNTIME_SECONDS",
    DEFAULT_SAFE_RUNTIME_SECONDS
  );
  const cleanupIntervalHours = getPositiveIntegerEnv(
    "MLS_SCHEDULED_CLEANUP_INTERVAL_HOURS",
    DEFAULT_CLEANUP_INTERVAL_HOURS
  );

  try {
    try {
      for (let run = 0; run < maxIncrementalRuns; run += 1) {
        if (elapsedSeconds(startedAtMs) >= safeRuntimeSeconds) {
          incrementalIncomplete = `Scheduled incremental sync paused after ${incrementalResults.length} batch(es) to stay within the ${safeRuntimeSeconds}s runtime window.`;
          break;
        }

        const incrementalResult = await runIncrementalSync({ connectorKind: "ddf-treb" });
        incrementalResults.push(incrementalResult);

        if (incrementalReachedEnd(incrementalResult)) {
          break;
        }
      }

      if (incrementalResults.length === maxIncrementalRuns && !incrementalReachedEnd(incrementalResults[incrementalResults.length - 1])) {
        incrementalIncomplete = `Scheduled incremental sync processed ${maxIncrementalRuns} batch(es) and saved its cursor. The next scheduler run will continue.`;
      }
    } catch (error) {
      incrementalError = error instanceof Error ? error.message : "Unknown incremental error";
      console.error("[mls-sync] Scheduled incremental step failed", error);
    }

    const schedulerStatusSnap = await firestore.collection(SETTINGS_COLLECTION).doc(SCHEDULER_STATUS_DOC_ID).get();
    const schedulerStatus = schedulerStatusSnap.data() as { cleanupLastRunAt?: string } | undefined;
    const cleanupAgeHours = hoursSince(schedulerStatus?.cleanupLastRunAt);
    const cleanupDue = cleanupAgeHours === null || cleanupAgeHours >= cleanupIntervalHours;
    const cleanupAttempted = !incrementalError && !incrementalIncomplete && cleanupDue;
    if (cleanupAttempted) {
      try {
        cleanupResult = await runStaleCleanup("ddf-treb");
      } catch (error) {
        cleanupError = error instanceof Error ? error.message : "Unknown cleanup error";
        console.error("[mls-sync] Scheduled cleanup step failed", error);
      }
    }

    const counts = incrementalResults.reduce(
      (totals, result) => mergeCounts(totals, result),
      buildScheduledCounts([cleanupResult])
    );
    const combinedError = [incrementalError, cleanupError].filter(Boolean).join(" | ") || null;
    const cleanupNote = cleanupDue
      ? null
      : `Scheduled cleanup skipped; last cleanup ran ${cleanupAgeHours?.toFixed(1)} hour(s) ago.`;
    const combinedNote = [incrementalIncomplete, cleanupNote].filter(Boolean).join(" | ") || null;
    const lastRunMode = cleanupAttempted ? "incremental+cleanup" : "incremental";
    const overallStatus = cleanupError || incrementalError ? "failed" : "success";

    await firestore.collection(SETTINGS_COLLECTION).doc(SCHEDULER_STATUS_DOC_ID).set(
      {
        lastRunAt: new Date().toISOString(),
        lastRunMode,
        lastRunStatus: overallStatus,
        lastRunCounts: counts,
        lastError: combinedError,
        lastNote: combinedNote,
        ...(cleanupAttempted
          ? {
              cleanupLastRunAt: new Date().toISOString(),
              cleanupLastRunStatus: cleanupError ? "failed" : "success",
              cleanupIntervalHours
            }
          : { cleanupIntervalHours })
      },
      { merge: true }
    );

    if (cleanupError || incrementalError) {
      return NextResponse.json(
        {
          error: "Scheduled MLS sync completed with errors.",
          detail: combinedError,
          schedule: "hourly_incremental",
          mode: lastRunMode,
          counts,
          partial: Boolean(incrementalIncomplete),
          result: {
            incrementalRunsCompleted: incrementalResults.length,
            incremental: incrementalResults[incrementalResults.length - 1] ?? null,
            cleanup: cleanupResult
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        schedule: "hourly_incremental",
        mode: lastRunMode,
        counts,
        partial: Boolean(incrementalIncomplete),
        note: combinedNote,
        result: {
          incrementalRunsCompleted: incrementalResults.length,
          incremental: incrementalResults[incrementalResults.length - 1] ?? null,
          cleanup: cleanupResult
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[mls-sync] Scheduled trigger failed", error);
    const counts = incrementalResults.reduce(
      (totals, result) => mergeCounts(totals, result),
      buildScheduledCounts([cleanupResult])
    );

    await firestore.collection(SETTINGS_COLLECTION).doc(SCHEDULER_STATUS_DOC_ID).set(
      {
        lastRunAt: new Date().toISOString(),
        lastRunMode: "incremental+cleanup",
        lastRunStatus: "failed",
        lastRunCounts: counts,
        lastError: error instanceof Error ? error.message : "Unknown scheduler error"
      },
      { merge: true }
    );

    return NextResponse.json({ error: "Scheduled MLS sync failed." }, { status: 500 });
  }
}
