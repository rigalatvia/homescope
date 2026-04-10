export const SITE_CONFIG = {
  name: "HomeScope GTA",
  logoPath: "/homescope-gta-logo.png",
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  primaryMarkets: ["Vaughan", "Richmond Hill", "Aurora", "Newmarket", "King", "Toronto"] as const
};

export const ALLOWED_PUBLIC_CITIES = new Set(SITE_CONFIG.primaryMarkets);
