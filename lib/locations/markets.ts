import { SITE_CONFIG } from "@/config/site";

export interface PrimaryMarketPage {
  city: (typeof SITE_CONFIG.primaryMarkets)[number];
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  highlights: string[];
}

export const PRIMARY_MARKET_PAGES: PrimaryMarketPage[] = [
  {
    city: "Vaughan",
    slug: "vaughan",
    title: "Vaughan Real Estate Listings",
    metaTitle: "Vaughan Real Estate Listings, Homes for Sale & Rentals",
    metaDescription:
      "Browse Vaughan real estate listings, homes for sale, rentals, townhomes, condos, and school-focused search tools on HomeScope GTA.",
    intro:
      "Search homes across Vaughan with listing photos, prices, school search tools, and buyer resources for communities such as Maple, Patterson, Thornhill, Kleinburg, and Woodbridge.",
    highlights: ["Detached homes, townhomes, condos, and rentals", "School search for Vaughan families", "Buyer and leasing guides for Ontario"]
  },
  {
    city: "Richmond Hill",
    slug: "richmond-hill",
    title: "Richmond Hill Real Estate Listings",
    metaTitle: "Richmond Hill Real Estate Listings, Homes for Sale & Rentals",
    metaDescription:
      "Find Richmond Hill homes for sale and lease, including school-focused searches near Bayview, Oak Ridges, Jefferson, and nearby communities.",
    intro:
      "Explore Richmond Hill listings and compare nearby homes around schools, parks, transit, and established neighbourhoods from Oak Ridges to Bayview and Jefferson.",
    highlights: ["Homes near Richmond Hill schools", "For sale and lease listings", "Local school rankings and nearby-home search"]
  },
  {
    city: "Aurora",
    slug: "aurora",
    title: "Aurora Real Estate Listings",
    metaTitle: "Aurora Real Estate Listings, Homes for Sale & Rentals",
    metaDescription:
      "Browse Aurora real estate listings, homes for sale, rentals, and school search tools for buyers and renters in York Region.",
    intro:
      "Search Aurora homes with a practical view of current listings, local schools, buyer documents, and neighbourhood options across the community.",
    highlights: ["Aurora homes for sale and lease", "School-aware home browsing", "Simple showing request flow"]
  },
  {
    city: "Newmarket",
    slug: "newmarket",
    title: "Newmarket Real Estate Listings",
    metaTitle: "Newmarket Real Estate Listings, Homes for Sale & Rentals",
    metaDescription:
      "Search Newmarket real estate listings, homes for sale, rentals, and school-area home matches on HomeScope GTA.",
    intro:
      "Browse Newmarket homes and compare listings by price, property type, schools, and location using a focused Greater Toronto Area search experience.",
    highlights: ["Newmarket houses, townhomes, condos, and rentals", "Nearby school matching", "Ontario buyer and renter resources"]
  },
  {
    city: "King",
    slug: "king",
    title: "King Real Estate Listings",
    metaTitle: "King Real Estate Listings, Homes for Sale & Rentals",
    metaDescription:
      "View King real estate listings, homes for sale, rural properties, rentals, and school-focused search tools on HomeScope GTA.",
    intro:
      "Explore King listings with a clean view of available homes, larger properties, nearby communities, and practical buyer resources.",
    highlights: ["King homes and estate properties", "Listings for sale and lease", "Local school and showing tools"]
  },
  {
    city: "Toronto",
    slug: "toronto",
    title: "Toronto Real Estate Listings",
    metaTitle: "Toronto Real Estate Listings, Homes for Sale & Rentals",
    metaDescription:
      "Search Toronto homes for sale and lease, including condos, freeholds, rentals, school search, and buyer resources on HomeScope GTA.",
    intro:
      "Browse Toronto listings with photos, prices, property details, school search, and buyer or renter resources for a faster home search.",
    highlights: ["Toronto condos, houses, and rentals", "School-focused home search", "Buyer and lease document guides"]
  }
];

export function getMarketBySlug(slug: string): PrimaryMarketPage | undefined {
  return PRIMARY_MARKET_PAGES.find((market) => market.slug === slug);
}

export function getMarketByCity(city: string): PrimaryMarketPage | undefined {
  return PRIMARY_MARKET_PAGES.find((market) => market.city === city);
}
