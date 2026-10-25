import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { socialAction, socialOverview } from "@/lib/social/admin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
export async function GET(request: Request) {
    const denied = await authorizeAdminRequest();
    if (denied)
        return denied;
    try {
        return NextResponse.json(await socialOverview(new URL(request.url).searchParams.get("before") || undefined), { headers: { "Cache-Control": "private, no-store" } });
    }
    catch {
        return NextResponse.json({ error: "Social dashboard could not load. Check database configuration." }, { status: 500 });
    }
}
export async function POST(request: Request) {
    const denied = await authorizeAdminRequest();
    if (denied)
        return denied;
    if (request.headers.get("x-social-admin") !== "1" || (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin))
        return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    try {
        if (Number(request.headers.get("content-length") || 0) > 16000)
            return NextResponse.json({ error: "Request too large." }, { status: 413 });
        const text = await request.text();
        if (text.length > 16000)
            throw new Error("Request too large.");
        const input = JSON.parse(text);
        if (!input || typeof input !== "object" || Array.isArray(input))
            throw new Error("Invalid request.");
        return NextResponse.json(await socialAction(input), { headers: { "Cache-Control": "private, no-store" } });
    }
    catch (error) {
        // Only controlled application errors; never return raw SDK/HTTP credential payloads.
        const message = error instanceof Error && !/https?:|token=|private.key|credential|at /i.test(error.message) && error.message.length < 220 ? error.message : "Social action failed. Check server configuration and campaign status.";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
