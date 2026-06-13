import { NextResponse } from "next/server";
import { runSavedSearchAlerts } from "@/lib/searches/saved-search-alerts";
import { getServerSecretValue } from "@/lib/server/secret-manager";

export async function POST(request: Request) {
  const schedulerToken = await getServerSecretValue("MLS_SCHEDULER_TOKEN");
  const requestToken = request.headers.get("x-scheduler-token");

  if (!schedulerToken) {
    return NextResponse.json({ error: "Scheduler token is not configured." }, { status: 503 });
  }

  if (requestToken !== schedulerToken) {
    return NextResponse.json({ error: "Unauthorized scheduler trigger." }, { status: 401 });
  }

  try {
    const summary = await runSavedSearchAlerts();

    return NextResponse.json(
      {
        success: true,
        schedule: "saved_search_alerts",
        summary
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[savedSearchAlerts] Trigger failed", error);
    return NextResponse.json({ error: "Saved search alert run failed." }, { status: 500 });
  }
}
