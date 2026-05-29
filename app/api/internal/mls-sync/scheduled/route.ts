import { NextResponse } from "next/server";
import { runIncrementalSync } from "@/lib/mls/sync/runIncrementalSync";
import { runStaleCleanup } from "@/lib/mls/sync/runStaleCleanup";
import { getServerSecretValue } from "@/lib/server/secret-manager";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type { MLSSyncResult } from "@/lib/mls/types";

export const maxDuration = 900;

const SETTINGS_COLLECTION = "settings";
const SCHEDULER_STATUS_DOC_ID = "mlsSchedulerStatus";

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
  let cleanupError: string | null = null;

  try {
    try {
      const maxIncrementalRuns = 500;
      for (let run = 0; run < maxIncrementalRuns; run += 1) {
        const incrementalResult = await runIncrementalSync({ connectorKind: "ddf-treb" });
        incrementalResults.push(incrementalResult);

        if (incrementalReachedEnd(incrementalResult)) {
          break;
        }
      }

      if (incrementalResults.length === maxIncrementalRuns && !incrementalReachedEnd(incrementalResults[incrementalResults.length - 1])) {
        incrementalError = "Incremental nightly run hit the safety limit before reaching the end of the updated feed.";
      }
    } catch (error) {
      incrementalError = error instanceof Error ? error.message : "Unknown incremental error";
      console.error("[mls-sync] Scheduled incremental step failed", error);
    }

    try {
      cleanupResult = await runStaleCleanup("ddf-treb");
    } catch (error) {
      cleanupError = error instanceof Error ? error.message : "Unknown cleanup error";
      console.error("[mls-sync] Scheduled cleanup step failed", error);
    }

    const counts = incrementalResults.reduce(
      (totals, result) => mergeCounts(totals, result),
      buildScheduledCounts([cleanupResult])
    );
    const combinedError = [incrementalError, cleanupError].filter(Boolean).join(" | ") || null;
    const overallStatus = cleanupError || incrementalError ? "failed" : "success";

    await firestore.collection(SETTINGS_COLLECTION).doc(SCHEDULER_STATUS_DOC_ID).set(
      {
        lastRunAt: new Date().toISOString(),
        lastRunMode: "incremental+cleanup",
        lastRunStatus: overallStatus,
        lastRunCounts: counts,
        lastError: combinedError
      },
      { merge: true }
    );

    if (cleanupError || incrementalError) {
      return NextResponse.json(
        {
          error: "Scheduled MLS sync completed with errors.",
          detail: combinedError,
          schedule: "daily_3am",
          counts,
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
        schedule: "daily_3am",
        counts,
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
