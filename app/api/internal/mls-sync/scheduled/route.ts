import { NextResponse } from "next/server";
import { getServerSecretValue } from "@/lib/server/secret-manager";
import { runDailyMLSSync } from "@/lib/mls/sync/dailySync";
import { SyncBusyError } from "@/lib/mls/sync/execution";

export const maxDuration = 900;
export async function POST(request: Request) {
  const token = await getServerSecretValue("MLS_SCHEDULER_TOKEN");
  if (!token) return NextResponse.json({ error: "Scheduler token is not configured." }, { status: 503 });
  if (request.headers.get("x-scheduler-token") !== token) return NextResponse.json({ error: "Unauthorized scheduler trigger." }, { status: 401 });
  try {
    const result = await runDailyMLSSync();
    return NextResponse.json(result, { status: result.success ? 200 : 503 });
  } catch (error) {
    console.error("[mls-sync] Scheduled sync failed", error);
    return NextResponse.json({ error: error instanceof SyncBusyError ? error.message : "Scheduled MLS sync failed; saved cursor retained." },
      { status: error instanceof SyncBusyError ? 409 : 500 });
  }
}
