import { PRIMARY_MARKET_PAGES } from "@/lib/locations/markets";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
] as const;

const now = new Date();
const currentYear = now.getUTCFullYear();
const currentMonthIndex = now.getUTCMonth();
const nextMonth = currentMonthIndex === 11 ? 0 : currentMonthIndex + 1;
const nextMonthYear = currentMonthIndex === 11 ? currentYear + 1 : currentYear;
const monthName = MONTH_NAMES[currentMonthIndex];

export const CURRENT_MARKET_REPORT = {
  year: currentYear,
  month: currentMonthIndex + 1,
  slug: `${monthName.toLowerCase()}-${currentYear}`,
  label: `${monthName} ${currentYear}`,
  monthStartIso: new Date(Date.UTC(currentYear, currentMonthIndex, 1)).toISOString(),
  nextMonthStartIso: new Date(Date.UTC(nextMonthYear, nextMonth, 1)).toISOString()
} as const;

export function getMarketReportParams() {
  return PRIMARY_MARKET_PAGES.map((market) => ({
    citySlug: market.slug,
    reportSlug: CURRENT_MARKET_REPORT.slug
  }));
}

export function isCurrentReportSlug(slug: string): boolean {
  return slug === CURRENT_MARKET_REPORT.slug;
}
