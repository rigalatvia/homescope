import { PRIMARY_MARKET_PAGES } from "@/lib/locations/markets";
import type { ListingTransactionType } from "@/types/listing";

export interface PropertySearchLanding {
  city: string;
  citySlug: string;
  displayCity: string;
  transactionType: ListingTransactionType;
  intentSlug: "homes-for-sale" | "homes-for-rent";
  title: string;
  description: string;
  heading: string;
  intro: string;
  localContext: string;
}

const CITY_COPY: Record<string, { displayCity: string; sale: string; rent: string; context: string }> = {
  "richmond-hill": {
    displayCity: "Richmond Hill",
    sale: "Compare active houses, townhouses and condominiums across Richmond Hill with photos, prices and nearby-school research.",
    rent: "Explore current Richmond Hill rentals, from condominiums and townhouses to family homes, with practical school and neighbourhood links.",
    context: "Richmond Hill includes established and newer communities such as Oak Ridges, Jefferson and the Bayview corridor. Use neighbourhood and school pages as research starting points, then verify details that matter to your move."
  },
  vaughan: {
    displayCity: "Vaughan",
    sale: "Browse active Vaughan homes with current asking prices, photos, property details and links to local neighbourhood research.",
    rent: "Find active rental homes across Vaughan and compare monthly rent, bedrooms, property type and location before requesting a showing.",
    context: "Vaughan offers a varied housing mix across communities including Maple, Patterson, Thornhill, Kleinburg and Woodbridge. Compare listings alongside neighbourhood and school information."
  },
  newmarket: {
    displayCity: "Newmarket",
    sale: "Search active Newmarket homes for sale and compare houses, townhouses and condominiums using live listing information.",
    rent: "Browse current Newmarket homes for rent with monthly prices, photos, bedrooms, bathrooms and property details.",
    context: "Newmarket combines residential neighbourhoods with access to York Region services and transportation. Review current inventory and use local school pages as one part of your research."
  },
  aurora: {
    displayCity: "Aurora",
    sale: "Explore active Aurora real estate listings and compare homes by price, layout, property type and neighbourhood.",
    rent: "Compare available Aurora rentals, including houses, townhouses and condominiums, using current public listing data.",
    context: "Aurora has a range of established neighbourhoods and newer residential areas. Current listing inventory and local school research can help narrow a search before booking showings."
  },
  toronto: {
    displayCity: "Toronto",
    sale: "Browse active Toronto homes for sale, including condominiums, townhouses and freehold properties, with current listing details.",
    rent: "Search active Toronto rental listings and compare monthly prices, layouts, property types and neighbourhood locations.",
    context: "Toronto inventory varies considerably by neighbourhood and property type. Use specific listing details and neighbourhood pages to refine a broad city search."
  },
  king: {
    displayCity: "King City",
    sale: "Explore active homes for sale in King and King City, including detached houses and larger residential properties.",
    rent: "Browse available homes for rent in King and King City using current public listing information and property details.",
    context: "King includes King City and surrounding communities with a housing mix that differs from denser GTA markets. Compare current properties carefully and confirm location-specific needs before arranging a visit."
  }
};

export function getPropertySearchLanding(
  intentSlug: string,
  citySlug: string
): PropertySearchLanding | undefined {
  if (intentSlug !== "homes-for-sale" && intentSlug !== "homes-for-rent") return undefined;
  const market = PRIMARY_MARKET_PAGES.find((item) => item.slug === citySlug);
  const copy = CITY_COPY[citySlug];
  if (!market || !copy) return undefined;

  const isRent = intentSlug === "homes-for-rent";
  const transactionType: ListingTransactionType = isRent ? "lease" : "sale";
  const action = isRent ? "Rent" : "Sale";
  const heading = isRent
    ? `Houses and Homes for Rent in ${copy.displayCity}, Ontario`
    : `Homes for Sale in ${copy.displayCity}, Ontario`;

  return {
    city: market.city,
    citySlug,
    displayCity: copy.displayCity,
    transactionType,
    intentSlug,
    title: `${copy.displayCity} Homes for ${action} | HomeScope GTA`,
    description: isRent
      ? `Browse active homes for rent in ${copy.displayCity}, Ontario. Compare monthly rent, photos, bedrooms, property types and nearby schools on HomeScope GTA.`
      : `Browse active homes for sale in ${copy.displayCity}, Ontario. Compare prices, photos, bedrooms, property types and nearby schools on HomeScope GTA.`,
    heading,
    intro: isRent ? copy.rent : copy.sale,
    localContext: copy.context
  };
}

export function getAllPropertySearchLandings(): PropertySearchLanding[] {
  return ["homes-for-sale", "homes-for-rent"].flatMap((intent) =>
    PRIMARY_MARKET_PAGES.map((market) => getPropertySearchLanding(intent, market.slug)).filter(
      (item): item is PropertySearchLanding => Boolean(item)
    )
  );
}
