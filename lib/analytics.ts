type Primitive = string | number | boolean | null | undefined;
type EventParams = Record<string, Primitive | Primitive[]>;

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

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

function canTrackGA(): boolean {
  return typeof window !== "undefined" && !!GA_MEASUREMENT_ID && typeof window.gtag === "function";
}

function canTrackMeta(): boolean {
  return typeof window !== "undefined" && !!META_PIXEL_ID && typeof window.fbq === "function";
}

export function trackPageView(url: string): void {
  if (canTrackGA()) {
    const gtag = window.gtag;
    if (gtag) {
      gtag("config", GA_MEASUREMENT_ID!, { page_path: url });
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
  trackMetaEvent("AddToWishlist", {
    content_type: "property",
    content_ids: [propertyId]
  });
}
