export const ADMIN_AUTH_COOKIE = "homescope_admin_token";

export function getAdminAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 60 * 60 * 12
  };
}

