import { NextResponse } from "next/server";
import type { MLSConnectorKind, MLSSyncMode } from "@/lib/mls/types";
import { runMLSSync } from "@/lib/mls/sync/runSync";

interface ManualSyncBody {
  mode?: MLSSyncMode;
  connectorKind?: MLSConnectorKind;
  sinceIso?: string;
}

export async function POST(request: Request) {
  const isProduction = process.env.NODE_ENV === "production";
  const adminToken = process.env.MLS_SYNC_ADMIN_TOKEN;
  const requestToken = request.headers.get("x-admin-sync-token");

  if (isProduction && adminToken && requestToken !== adminToken) {
    return NextResponse.json({ error: "Unauthorized sync trigger." }, { status: 401 });
  }

  try {
    const body = ((await request.json()) as ManualSyncBody) || {};
    const mode: MLSSyncMode = body.mode || "full";
    const result = await runMLSSync(mode, {
      connectorKind: body.connectorKind,
      sinceIso: body.sinceIso
    });

    return NextResponse.json({ success: true, result }, { status: 200 });
  } catch (error) {
    console.error("[mls-sync] Manual trigger failed", error);
    return NextResponse.json({ error: "MLS sync failed." }, { status: 500 });
  }
}
