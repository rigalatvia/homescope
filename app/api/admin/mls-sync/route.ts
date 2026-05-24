import { NextResponse } from "next/server";
import type { MLSConnectorKind, MLSSyncMode } from "@/lib/mls/types";
import { runMLSSync } from "@/lib/mls/sync/runSync";
import { getServerConfigValue } from "@/lib/server/secret-manager";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import {
  getDefaultFullSyncStartPage,
  setFullSyncNextCursor,
  setFullSyncStartPage,
  setFullSyncSweepStartedAt
} from "@/lib/mls/sync/fullSyncCursor";
import { requestMLSSyncStop } from "@/lib/mls/sync/stopSignal";

export const maxDuration = 300;

const SETTINGS_COLLECTION = "settings";
const MANUAL_STATUS_DOC_ID = "mlsManualSyncStatus";

interface ManualSyncBody {
  mode?: MLSSyncMode;
  connectorKind?: MLSConnectorKind;
  sinceIso?: string;
  resetCursorToFirstPage?: boolean;
}

export async function POST(request: Request) {
  const adminToken = await getServerConfigValue("MLS_SYNC_ADMIN_TOKEN");
  const requestToken = request.headers.get("x-admin-sync-token");
  const firestore = getFirebaseAdminFirestore();
  let attemptedMode: MLSSyncMode = "full";

  if (!adminToken) {
    return NextResponse.json({ error: "MLS sync admin token is not configured." }, { status: 503 });
  }

  if (requestToken !== adminToken) {
    return NextResponse.json({ error: "Unauthorized sync trigger." }, { status: 401 });
  }

  try {
    const body = ((await request.json()) as ManualSyncBody) || {};
    const mode: MLSSyncMode = body.mode || "full";
    attemptedMode = mode;
    if (mode === "full" && body.resetCursorToFirstPage === true) {
      await setFullSyncStartPage(getDefaultFullSyncStartPage());
      await setFullSyncNextCursor(null);
      await setFullSyncSweepStartedAt(null);
    }
    const result = await runMLSSync(mode, {
      connectorKind: body.connectorKind,
      sinceIso: body.sinceIso
    });

    await firestore.collection(SETTINGS_COLLECTION).doc(MANUAL_STATUS_DOC_ID).set(
      {
        lastRunAt: new Date().toISOString(),
        lastRunMode: mode,
        lastRunStatus: "success",
        lastRunCounts: {
          fetched: result.stats.fetched,
          filtered: result.stats.filtered,
          created: result.stats.created,
          updated: result.stats.updated,
          deleted: result.stats.archived,
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
        counts: {
          fetched: result.stats.fetched,
          filtered: result.stats.filtered,
          created: result.stats.created,
          updated: result.stats.updated,
          deleted: result.stats.archived,
          archived: result.stats.archived,
          failed: result.stats.failed
        },
        result
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[mls-sync] Manual trigger failed", error);
    const detail = error instanceof Error ? error.message : "Unknown sync error";
    await firestore.collection(SETTINGS_COLLECTION).doc(MANUAL_STATUS_DOC_ID).set(
      {
        lastRunAt: new Date().toISOString(),
        lastRunMode: attemptedMode,
        lastRunStatus: "failed",
        lastError: detail
      },
      { merge: true }
    );
    return NextResponse.json({ error: "MLS sync failed.", detail }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const adminToken = await getServerConfigValue("MLS_SYNC_ADMIN_TOKEN");
  const requestToken = request.headers.get("x-admin-sync-token");

  if (!adminToken) {
    return NextResponse.json({ error: "MLS sync admin token is not configured." }, { status: 503 });
  }

  if (requestToken !== adminToken) {
    return NextResponse.json({ error: "Unauthorized sync trigger." }, { status: 401 });
  }

  try {
    await requestMLSSyncStop();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown stop error";
    return NextResponse.json({ error: "Failed to request sync stop.", detail }, { status: 500 });
  }
}
