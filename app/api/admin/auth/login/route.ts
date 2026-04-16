import { NextResponse } from "next/server";
import { getAdminAuthCookieOptions, ADMIN_AUTH_COOKIE } from "@/lib/admin/auth";
import { getServerConfigValue } from "@/lib/server/secret-manager";

export async function POST(request: Request) {
  try {
    const expectedToken = await getServerConfigValue("MLS_SYNC_ADMIN_TOKEN");
    if (!expectedToken) {
      return NextResponse.json({ error: "MLS sync admin token is not configured." }, { status: 503 });
    }

    const body = (await request.json()) as { token?: string; next?: string };
    const providedToken = body.token?.trim();

    if (!providedToken || providedToken !== expectedToken) {
      return NextResponse.json({ error: "Invalid admin token." }, { status: 401 });
    }

    const response = NextResponse.json(
      {
        success: true,
        redirectTo: body.next && body.next.startsWith("/admin") ? body.next : "/admin"
      },
      { status: 200 }
    );

    response.cookies.set(ADMIN_AUTH_COOKIE, expectedToken, getAdminAuthCookieOptions());
    return response;
  } catch (error) {
    console.error("[admin-auth] Login failed", error);
    return NextResponse.json({ error: "Unable to sign in." }, { status: 500 });
  }
}

