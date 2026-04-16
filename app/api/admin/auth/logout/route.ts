import { NextResponse } from "next/server";
import { getAdminAuthCookieOptions, ADMIN_AUTH_COOKIE } from "@/lib/admin/auth";

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });
  response.cookies.set(ADMIN_AUTH_COOKIE, "", {
    ...getAdminAuthCookieOptions(),
    maxAge: 0
  });
  return response;
}

