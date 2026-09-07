import { NextResponse } from "next/server";
import { unsubscribeSavedSearchFromEmailLink } from "@/lib/searches/unsubscribe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const formData = await request.formData();
  const searchId = String(formData.get("search") || "");
  const token = String(formData.get("token") || "");
  const redirectUrl = new URL("/saved-searches/unsubscribe", request.url);
  redirectUrl.searchParams.set("search", searchId);
  redirectUrl.searchParams.set("token", token);

  try {
    const result = await unsubscribeSavedSearchFromEmailLink({ searchId, token });
    redirectUrl.searchParams.set("status", result.alreadyPaused ? "already-paused" : "paused");
  } catch (error) {
    console.error("[savedSearchUnsubscribe] Confirmation failed", { searchId, error });
    redirectUrl.searchParams.set("status", "error");
  }

  return NextResponse.redirect(redirectUrl, { status: 303 });
}
