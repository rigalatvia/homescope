import { NextResponse } from "next/server";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { getServerConfigValue } from "@/lib/server/secret-manager";

const LISTINGS_COLLECTION = "listings";
const SETTINGS_COLLECTION = "settings";

export async function GET(request: Request) {
  const adminToken = await getServerConfigValue("MLS_SYNC_ADMIN_TOKEN");
  const requestToken = request.headers.get("x-admin-sync-token");

  if (!adminToken) {
    return NextResponse.json({ error: "MLS sync admin token is not configured." }, { status: 503 });
  }

  if (requestToken !== adminToken) {
    return NextResponse.json({ error: "Unauthorized admin request." }, { status: 401 });
  }

  try {
    const firestore = getFirebaseAdminFirestore();
    const [totalAgg, visibleAgg, fullCursorSnap, incCursorSnap, schedulerSnap] = await Promise.all([
      firestore.collection(LISTINGS_COLLECTION).count().get(),
      firestore.collection(LISTINGS_COLLECTION).where("isVisible", "==", true).count().get(),
      firestore.collection(SETTINGS_COLLECTION).doc("mlsFullSyncCursor").get(),
      firestore.collection(SETTINGS_COLLECTION).doc("mlsIncrementalCursor").get(),
      firestore.collection(SETTINGS_COLLECTION).doc("mlsSchedulerStatus").get()
    ]);

    const fullCursor = (fullCursorSnap.data() ?? {}) as { nextPage?: number; updatedAt?: string };
    const incrementalCursor = (incCursorSnap.data() ?? {}) as { sinceIso?: string; updatedAt?: string };
    const scheduler = (schedulerSnap.data() ?? {}) as {
      lastRunAt?: string;
      lastRunMode?: string;
      lastRunStatus?: string;
      lastRunCounts?: { updated?: number; created?: number; fetched?: number; filtered?: number };
      lastError?: string | null;
    };

    return NextResponse.json({
      success: true,
      stats: {
        totalRows: totalAgg.data().count,
        visibleRows: visibleAgg.data().count,
        checkedAt: new Date().toISOString(),
        fullSyncNextPage: Number(fullCursor.nextPage ?? 1),
        fullSyncCursorUpdatedAt: fullCursor.updatedAt ?? null,
        incrementalSinceIso: incrementalCursor.sinceIso ?? null,
        incrementalCursorUpdatedAt: incrementalCursor.updatedAt ?? null,
        schedulerLastRunAt: scheduler.lastRunAt ?? null,
        schedulerLastRunMode: scheduler.lastRunMode ?? null,
        schedulerLastRunStatus: scheduler.lastRunStatus ?? null,
        schedulerLastRunUpdated: Number(scheduler.lastRunCounts?.updated ?? 0),
        schedulerLastRunCreated: Number(scheduler.lastRunCounts?.created ?? 0),
        schedulerLastRunFetched: Number(scheduler.lastRunCounts?.fetched ?? 0),
        schedulerLastRunFiltered: Number(scheduler.lastRunCounts?.filtered ?? 0),
        schedulerLastError: scheduler.lastError ?? null
      }
    });
  } catch (error) {
    console.error("[admin][listings-stats] Failed loading listing stats", error);
    return NextResponse.json({ error: "Could not load listings stats." }, { status: 500 });
  }
}
