import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getServerConfigValue } from "@/lib/server/secret-manager";
import { runSocialWorker } from "@/lib/social/worker";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(request: Request) {
    const token = await getServerConfigValue("MLS_SCHEDULER_TOKEN");
    const supplied = request.headers.get("x-scheduler-token") || "";
    if (!token || Buffer.byteLength(token) !== Buffer.byteLength(supplied) || !timingSafeEqual(Buffer.from(token), Buffer.from(supplied)))
        return NextResponse.json({ error: "Unauthorized scheduler request." }, { status: 401 });
    try {
        return NextResponse.json(await runSocialWorker());
    }
    catch {
        return NextResponse.json({ error: "Social worker unavailable or busy; retry on the next scheduled run." }, { status: 503 });
    }
}
