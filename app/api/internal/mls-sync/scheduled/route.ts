import { NextResponse } from "next/server";
import { runIncrementalSync } from "@/lib/mls/sync/runIncrementalSync";
import { runStaleCleanup } from "@/lib/mls/sync/runStaleCleanup";
import { getServerSecretValue } from "@/lib/server/secret-manager";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type { MLSSyncResult } from "@/lib/mls/types";

export const maxDuration = 300;

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
  let incrementalResult: MLSSyncResult | null = null;
  let cleanupResult: MLSSyncResult | null = null;

  try {
    incrementalResult = await runIncrementalSync({ connectorKind: "ddf-treb" });
    cleanupResult = await runStaleCleanup("ddf-treb");
    const counts = buildScheduledCounts([incrementalResult, cleanupResult]);

    await firestore.collection(SETTINGS_COLLECTION).doc(SCHEDULER_STATUS_DOC_ID).set(
      {
        lastRunAt: new Date().toISOString(),
        lastRunMode: "incremental+cleanup",
        lastRunStatus: "success",
        lastRunCounts: counts,
        lastError: null
      },
      { merge: true }
    );

    return NextResponse.json(
      {
        success: true,
        schedule: "daily_3am",
        counts,
        result: {
          incremental: incrementalResult,
          cleanup: cleanupResult
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[mls-sync] Scheduled trigger failed", error);
    const counts = buildScheduledCounts([incrementalResult, cleanupResult]);

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
