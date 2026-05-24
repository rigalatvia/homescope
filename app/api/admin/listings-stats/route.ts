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
    const [totalAgg, visibleAgg, fullCursorSnap, incCursorSnap, cleanupCursorSnap, schedulerSnap, manualSyncSnap] = await Promise.all([
      firestore.collection(LISTINGS_COLLECTION).count().get(),
      firestore.collection(LISTINGS_COLLECTION).where("isVisible", "==", true).count().get(),
      firestore.collection(SETTINGS_COLLECTION).doc("mlsFullSyncCursor").get(),
      firestore.collection(SETTINGS_COLLECTION).doc("mlsIncrementalCursor").get(),
      firestore.collection(SETTINGS_COLLECTION).doc("mlsCleanupCursor").get(),
      firestore.collection(SETTINGS_COLLECTION).doc("mlsSchedulerStatus").get(),
      firestore.collection(SETTINGS_COLLECTION).doc("mlsManualSyncStatus").get()
    ]);

    const fullCursor = (fullCursorSnap.data() ?? {}) as { nextPage?: number; updatedAt?: string };
    const incrementalCursor = (incCursorSnap.data() ?? {}) as { sinceIso?: string; updatedAt?: string };
    const cleanupCursor = (cleanupCursorSnap.data() ?? {}) as { nextPage?: number; updatedAt?: string };
    const scheduler = (schedulerSnap.data() ?? {}) as {
      lastRunAt?: string;
      lastRunMode?: string;
      lastRunStatus?: string;
      lastRunCounts?: {
        updated?: number;
        created?: number;
        deleted?: number;
        archived?: number;
        fetched?: number;
        filtered?: number;
      };
      lastError?: string | null;
    };
    const manualSync = (manualSyncSnap.data() ?? {}) as {
      lastRunAt?: string;
      lastRunMode?: string;
      lastRunStatus?: string;
      lastRunCounts?: {
        updated?: number;
        created?: number;
        deleted?: number;
        archived?: number;
        fetched?: number;
        filtered?: number;
      };
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
        cleanupNextPage: Number(cleanupCursor.nextPage ?? 1),
        cleanupCursorUpdatedAt: cleanupCursor.updatedAt ?? null,
        schedulerLastRunAt: scheduler.lastRunAt ?? null,
        schedulerLastRunMode: scheduler.lastRunMode ?? null,
        schedulerLastRunStatus: scheduler.lastRunStatus ?? null,
        schedulerLastRunUpdated: Number(scheduler.lastRunCounts?.updated ?? 0),
        schedulerLastRunCreated: Number(scheduler.lastRunCounts?.created ?? 0),
        schedulerLastRunDeleted: Number(scheduler.lastRunCounts?.deleted ?? scheduler.lastRunCounts?.archived ?? 0),
        schedulerLastRunFetched: Number(scheduler.lastRunCounts?.fetched ?? 0),
        schedulerLastRunFiltered: Number(scheduler.lastRunCounts?.filtered ?? 0),
        schedulerLastError: scheduler.lastError ?? null,
        manualLastRunAt: manualSync.lastRunAt ?? null,
        manualLastRunMode: manualSync.lastRunMode ?? null,
        manualLastRunStatus: manualSync.lastRunStatus ?? null,
        manualLastRunUpdated: Number(manualSync.lastRunCounts?.updated ?? 0),
        manualLastRunCreated: Number(manualSync.lastRunCounts?.created ?? 0),
        manualLastRunDeleted: Number(manualSync.lastRunCounts?.deleted ?? manualSync.lastRunCounts?.archived ?? 0),
        manualLastRunFetched: Number(manualSync.lastRunCounts?.fetched ?? 0),
        manualLastRunFiltered: Number(manualSync.lastRunCounts?.filtered ?? 0),
        manualLastError: manualSync.lastError ?? null
      }
    });
  } catch (error) {
    console.error("[admin][listings-stats] Failed loading listing stats", error);
    return NextResponse.json({ error: "Could not load listings stats." }, { status: 500 });
  }
}
