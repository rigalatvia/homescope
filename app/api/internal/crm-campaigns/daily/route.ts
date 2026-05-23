import { NextResponse } from "next/server";
import { runCrmDailyCampaigns } from "@/lib/crm/daily-campaigns";
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
    const summary = await runCrmDailyCampaigns();

    return NextResponse.json(
      {
        success: true,
        schedule: "daily_crm_campaigns",
        summary
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[crm-campaigns] Daily trigger failed", error);
    return NextResponse.json({ error: "Daily CRM campaign run failed." }, { status: 500 });
  }
}
