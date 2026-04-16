import { NextResponse } from "next/server";
import { runIncrementalSync } from "@/lib/mls/sync/runIncrementalSync";
import { getServerConfigValue } from "@/lib/server/secret-manager";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";

const SETTINGS_COLLECTION = "settings";
const SCHEDULER_STATUS_DOC_ID = "mlsSchedulerStatus";

export async function POST(request: Request) {
  const schedulerToken = await getServerConfigValue("MLS_SCHEDULER_TOKEN");
  const requestToken = request.headers.get("x-scheduler-token");

  if (!schedulerToken) {
    return NextResponse.json({ error: "Scheduler token is not configured." }, { status: 503 });
  }

  if (requestToken !== schedulerToken) {
    return NextResponse.json({ error: "Unauthorized scheduler trigger." }, { status: 401 });
  }

  const firestore = getFirebaseAdminFirestore();

  try {
    const result = await runIncrementalSync({ connectorKind: "ddf-treb" });

    await firestore.collection(SETTINGS_COLLECTION).doc(SCHEDULER_STATUS_DOC_ID).set(
      {
        lastRunAt: new Date().toISOString(),
        lastRunMode: "incremental",
        lastRunStatus: "success",
        lastRunCounts: {
          fetched: result.stats.fetched,
          filtered: result.stats.filtered,
          created: result.stats.created,
          updated: result.stats.updated,
          archived: result.stats.archived,
          failed: result.stats.failed
        },
        lastError: null
      },
      { merge: true }
    );

    return NextResponse.json(
      {
        success: true,
        schedule: "daily_3am",
        counts: {
          fetched: result.stats.fetched,
          filtered: result.stats.filtered,
          created: result.stats.created,
          updated: result.stats.updated,
          archived: result.stats.archived,
          failed: result.stats.failed
        },
        result
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[mls-sync] Scheduled trigger failed", error);

    await firestore.collection(SETTINGS_COLLECTION).doc(SCHEDULER_STATUS_DOC_ID).set(
      {
        lastRunAt: new Date().toISOString(),
        lastRunMode: "incremental",
        lastRunStatus: "failed",
        lastError: error instanceof Error ? error.message : "Unknown scheduler error"
      },
      { merge: true }
    );

    return NextResponse.json({ error: "Scheduled MLS sync failed." }, { status: 500 });
  }
}
