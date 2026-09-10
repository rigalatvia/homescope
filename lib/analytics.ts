type Primitive = string | number | boolean | null | undefined;
type EventParams = Record<string, Primitive | Primitive[]>;

import { hasTrackingConsent } from "@/lib/consent";

export interface PropertyViewPayload {
  propertyId: string;
  city?: string;
}

export interface SearchPerformedPayload {
  query?: string;
  city?: string;
  filters?: Record<string, Primitive>;
}

export interface ContactClickPayload {
  source: string;
  propertyId?: string;
}

export interface SaveListingPayload {
  propertyId: string;
}

export interface SaveSearchPayload {
  label: string;
  source: string;
  resultsTotal: number;
  isSchoolSearch?: boolean;
}

export interface LeadSubmittedPayload {
  source: string;
  propertyId?: string;
  visitorIntent?: string;
}

export interface RentalApplicationDownloadPayload {
  resourcePath: string;
}

const DEFAULT_GA_MEASUREMENT_ID = "G-1G84P57QZY";
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || DEFAULT_GA_MEASUREMENT_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

function canTrackGA(): boolean {
  return typeof window !== "undefined" && hasTrackingConsent() && !!GA_MEASUREMENT_ID && typeof window.gtag === "function";
}

function canTrackMeta(): boolean {
  return typeof window !== "undefined" && hasTrackingConsent() && !!META_PIXEL_ID && typeof window.fbq === "function";
}

export function trackPageView(url: string): void {
  if (canTrackGA()) {
    const gtag = window.gtag;
    if (gtag) {
      gtag("event", "page_view", {
        page_path: url,
        page_location: `${window.location.origin}${url}`,
        page_title: document.title
      });
    }
  }

  trackMetaPageView();
}

export function trackEvent(name: string, params?: EventParams): void {
  if (!canTrackGA()) return;
  const gtag = window.gtag;
  if (!gtag) return;
  gtag("event", name, params || {});
}

export function trackMetaPageView(): void {
  if (!canTrackMeta()) return;
  const fbq = window.fbq;
  if (!fbq) return;
  fbq("track", "PageView");
}

export function trackMetaEvent(name: string, params?: EventParams): void {
  if (!canTrackMeta()) return;
  const fbq = window.fbq;
  if (!fbq) return;
  fbq("track", name, params || {});
}

export function trackPropertyView({ propertyId, city }: PropertyViewPayload): void {
  trackEvent("property_view", { property_id: propertyId, city: city || "" });
  trackMetaEvent("ViewContent", {
    content_type: "property",
    content_ids: [propertyId],
    city: city || ""
  });
}

export function trackSearchPerformed({ query, city, filters }: SearchPerformedPayload): void {
  const payload: EventParams = {
    query: query || "",
    city: city || "",
    filters: JSON.stringify(filters || {})
  };

  trackEvent("search_performed", payload);
  trackMetaEvent("Search", payload);
}

export function trackContactClick({ source, propertyId }: ContactClickPayload): void {
  const payload: EventParams = {
    source,
    property_id: propertyId || ""
  };

  trackEvent("contact_click", payload);
  trackMetaEvent("Lead", payload);
}

export function trackSaveListing({ propertyId }: SaveListingPayload): void {
  const payload: EventParams = { property_id: propertyId };
  trackEvent("save_listing", payload);
  trackEvent("save_home_created", payload);
  trackMetaEvent("AddToWishlist", {
    content_type: "property",
    content_ids: [propertyId]
  });
}

export function trackSaveSearchCreated({ label, source, resultsTotal, isSchoolSearch }: SaveSearchPayload): void {
  const payload: EventParams = {
    search_label: label,
    source,
    results_total: resultsTotal,
    is_school_search: Boolean(isSchoolSearch)
  };

  trackEvent("save_search_created", payload);
  trackMetaEvent("Lead", {
    content_name: label,
    content_category: isSchoolSearch ? "school_search_alert" : "saved_search_alert",
    source,
    results_total: resultsTotal
  });
}

export function trackLeadSubmitted({ source, propertyId, visitorIntent }: LeadSubmittedPayload): void {
  const payload: EventParams = {
    source,
    property_id: propertyId || "",
    visitor_intent: visitorIntent || ""
  };

  trackEvent("lead_submitted", payload);
  trackMetaEvent("Lead", payload);
}

export function trackRentalApplicationDownload({ resourcePath }: RentalApplicationDownloadPayload): void {
  const payload: EventParams = {
    resource_type: "rental_application",
    resource_path: resourcePath
  };

  trackEvent("rental_application_download", payload);
  trackMetaEvent("Lead", {
    content_name: "Ontario Rental Application Form 410",
    content_category: "download",
    resource_path: resourcePath
  });
}
