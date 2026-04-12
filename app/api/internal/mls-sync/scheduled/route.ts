import { NextResponse } from "next/server";
import { runFullSync } from "@/lib/mls/sync/runFullSync";
import { getServerConfigValue } from "@/lib/server/secret-manager";

export async function POST(request: Request) {
  const schedulerToken = await getServerConfigValue("MLS_SCHEDULER_TOKEN");
  const requestToken = request.headers.get("x-scheduler-token");

  if (!schedulerToken) {
    return NextResponse.json({ error: "Scheduler token is not configured." }, { status: 503 });
  }

  if (requestToken !== schedulerToken) {
    return NextResponse.json({ error: "Unauthorized scheduler trigger." }, { status: 401 });
  }

  try {
    const result = await runFullSync("ddf-treb");
    return NextResponse.json(
      {
        success: true,
        schedule: "every_3_hours",
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
    return NextResponse.json({ error: "Scheduled MLS sync failed." }, { status: 500 });
  }
}
