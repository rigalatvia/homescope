import { SITE_CONFIG } from "@/config/site";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";

const MARKET_REPORTS_COLLECTION = "marketReports";

export interface MarketReportContent {
  id: string;
  citySlug: string;
  reportSlug: string;
  title: string;
  intro: string;
  marketSummary: string;
  buyerTakeaway: string;
  sellerTakeaway: string;
  notes: string[];
  updatedAt?: string;
}

export interface MarketReportContentInput {
  title?: unknown;
  intro?: unknown;
  marketSummary?: unknown;
  buyerTakeaway?: unknown;
  sellerTakeaway?: unknown;
  notes?: unknown;
}

export function buildMarketReportId(citySlug: string, reportSlug: string): string {
  return `${citySlug}__${reportSlug}`;
}

export function getDefaultMarketReportContent(input: {
  city: string;
  citySlug: string;
  reportSlug: string;
  reportLabel: string;
}): MarketReportContent {
  const title = `${input.city} Housing Market - ${input.reportLabel}`;

  return {
    id: buildMarketReportId(input.citySlug, input.reportSlug),
    citySlug: input.citySlug,
    reportSlug: input.reportSlug,
    title,
    intro: `A current snapshot of visible ${input.city} listings on ${SITE_CONFIG.name}, including sale and lease inventory, average listed prices, new listing activity, and active homes to review.`,
    marketSummary: `${input.city} market conditions can vary widely by property type, school area, condition, and exact location. Use this report as a listing-data snapshot before reviewing individual homes.`,
    buyerTakeaway: `Buyers in ${input.city} should compare price, property type, listing age, school context, and monthly carrying costs before booking showings or preparing an offer.`,
    sellerTakeaway: `Sellers in ${input.city} should compare their property against currently active listings, not only broad city averages, because buyers evaluate direct alternatives.`,
    notes: [
      "Average price is based on currently visible listing prices, not final sold prices.",
      "Days live is estimated from listing record creation dates because the public feed does not provide an official days-on-market field."
    ]
  };
}

export async function getMarketReportContent(input: {
  city: string;
  citySlug: string;
  reportSlug: string;
  reportLabel: string;
}): Promise<MarketReportContent> {
  const fallback = getDefaultMarketReportContent(input);
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore.collection(MARKET_REPORTS_COLLECTION).doc(fallback.id).get();

  if (!snapshot.exists) return fallback;

  return sanitizeMarketReportContent(fallback, snapshot.data() || {});
}

export async function saveMarketReportContent(input: {
  city: string;
  citySlug: string;
  reportSlug: string;
  reportLabel: string;
  body: MarketReportContentInput;
}): Promise<MarketReportContent> {
  const fallback = getDefaultMarketReportContent(input);
  const updatedAt = new Date().toISOString();
  const content = sanitizeMarketReportContent(fallback, input.body, updatedAt);
  const firestore = getFirebaseAdminFirestore();

  await firestore.collection(MARKET_REPORTS_COLLECTION).doc(fallback.id).set(content, { merge: true });

  return content;
}

function sanitizeMarketReportContent(
  fallback: MarketReportContent,
  input: MarketReportContentInput,
  updatedAt?: string
): MarketReportContent {
  return {
    ...fallback,
    title: sanitizeString(input.title, fallback.title),
    intro: sanitizeString(input.intro, fallback.intro),
    marketSummary: sanitizeString(input.marketSummary, fallback.marketSummary),
    buyerTakeaway: sanitizeString(input.buyerTakeaway, fallback.buyerTakeaway),
    sellerTakeaway: sanitizeString(input.sellerTakeaway, fallback.sellerTakeaway),
    notes: sanitizeNotes(input.notes, fallback.notes),
    updatedAt
  };
}

function sanitizeString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function sanitizeNotes(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const notes = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0)
    .slice(0, 8);
  return notes.length > 0 ? notes : fallback;
}
