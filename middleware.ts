import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ADMIN_AUTH_COOKIE } from "@/lib/admin/auth";

const LOGIN_PATH = "/admin/login";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const expectedToken = process.env.MLS_SYNC_ADMIN_TOKEN;
  const cookieToken = request.cookies.get(ADMIN_AUTH_COOKIE)?.value;

  const isAuthenticated = Boolean(expectedToken && cookieToken === expectedToken);
  const isLoginPage = pathname === LOGIN_PATH;

  if (isLoginPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (isLoginPage) {
    return NextResponse.next();
  }

  if (!expectedToken || !isAuthenticated) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    if (!expectedToken) {
      loginUrl.searchParams.set("error", "missing_admin_token");
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};

