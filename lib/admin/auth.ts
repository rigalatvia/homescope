export const ADMIN_AUTH_COOKIE = "homescope_admin_token";

function getBaseAdminAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12
  };
}

export function getAdminAuthCookieOptions() {
  return {
    ...getBaseAdminAuthCookieOptions(),
    path: "/"
  };
}

export function getLegacyAdminAuthCookieOptions() {
  return {
    ...getBaseAdminAuthCookieOptions(),
    path: "/admin"
  };
}
