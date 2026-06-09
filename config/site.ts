export const SITE_CONFIG = {
  name: "HomeScope GTA",
  logoPath: "/logo.png",
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://homescopegta.ca",
  contactEmail: "info@homescopegta.ca",
  primaryMarkets: ["Vaughan", "Richmond Hill", "Aurora", "Newmarket", "King", "Toronto"] as const
};

export const ALLOWED_PUBLIC_CITIES = new Set(SITE_CONFIG.primaryMarkets);
