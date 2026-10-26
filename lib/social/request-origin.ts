import { SITE_CONFIG } from "@/config/site";

// Hosting proxies may expose an internal request URL. Trust the configured
// public origin, never arbitrary forwarded host headers supplied by a client.
export function isValidSocialOrigin(request: Request): boolean {
    if (request.headers.get("x-social-admin") !== "1") return false;
    const origin = request.headers.get("origin");
    if (!origin) return true; // Non-browser admin clients still require authentication.
    const allowed = new Set([new URL(request.url).origin]);
    try { allowed.add(new URL(SITE_CONFIG.baseUrl).origin); } catch { /* Invalid configuration grants no extra origin. */ }
    return allowed.has(origin);
}
