import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_AUTH_COOKIE } from "@/lib/admin/auth";
import { getServerConfigValue } from "@/lib/server/secret-manager";

export async function authorizeAdminRequest(): Promise<NextResponse | null> {
  const expectedToken = await getServerConfigValue("MLS_SYNC_ADMIN_TOKEN");
  const cookieToken = cookies().get(ADMIN_AUTH_COOKIE)?.value?.trim();

  if (!expectedToken) {
    return NextResponse.json({ error: "MLS sync admin token is not configured." }, { status: 503 });
  }

  if (!cookieToken || cookieToken !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized admin request." }, { status: 401 });
  }

  return null;
}
