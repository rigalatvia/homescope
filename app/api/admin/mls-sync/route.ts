import { NextResponse } from "next/server";
import type { MLSConnectorKind, MLSSyncMode } from "@/lib/mls/types";
import { runMLSSync } from "@/lib/mls/sync/runSync";
import { getServerConfigValue } from "@/lib/server/secret-manager";
import { getDefaultFullSyncStartPage, setFullSyncStartPage } from "@/lib/mls/sync/fullSyncCursor";
import { requestMLSSyncStop } from "@/lib/mls/sync/stopSignal";

interface ManualSyncBody {
  mode?: MLSSyncMode;
  connectorKind?: MLSConnectorKind;
  sinceIso?: string;
  resetCursorToFirstPage?: boolean;
}

export async function POST(request: Request) {
  const adminToken = await getServerConfigValue("MLS_SYNC_ADMIN_TOKEN");
  const requestToken = request.headers.get("x-admin-sync-token");

  if (!adminToken) {
    return NextResponse.json({ error: "MLS sync admin token is not configured." }, { status: 503 });
  }

  if (requestToken !== adminToken) {
    return NextResponse.json({ error: "Unauthorized sync trigger." }, { status: 401 });
  }

  try {
    const body = ((await request.json()) as ManualSyncBody) || {};
    const mode: MLSSyncMode = body.mode || "full";
    if (mode === "full" && body.resetCursorToFirstPage === true) {
      await setFullSyncStartPage(getDefaultFullSyncStartPage());
    }
    const result = await runMLSSync(mode, {
      connectorKind: body.connectorKind,
      sinceIso: body.sinceIso
    });

    return NextResponse.json(
      {
        success: true,
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
    console.error("[mls-sync] Manual trigger failed", error);
    const detail = error instanceof Error ? error.message : "Unknown sync error";
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
