import { verifiedDdfOffice } from "@/lib/mls/config/listing-offices";
import { createHash } from "node:crypto";
import type { SocialListing, SocialSettings, SocialCampaign, Publication } from "./types";
import { NEVER } from "./types";
export const BROKERAGE = "RE/MAX METROPOLIS REALTY";
export const BRAND = { agent: "Yan Ginzburg", phone: "416-577-0691", brokerage: `${BROKERAGE}, Brokerage`, website: "HomeScopeGTA.ca" };
export const DEFAULT_SETTINGS: SocialSettings = {
    enabled: false, activatedAt: null, baselineComplete: false, baselineCursor: null, discoveryCursor: null,
    dailyLimit: 0, minimumHours: 0, windowStart: 0, windowEnd: 24, timezone: "America/Toronto",
    template: "navy-editorial-v1", notifications: "failures", dryRunPassedAt: null
};
export function matchesOfficeName(value: unknown): boolean {
    if (typeof value !== "string")
        return false;
    const normalized = value.normalize("NFKC").toUpperCase().replace(/[^A-Z0-9]/g, "");
    return normalized === "REMAXMETROPOLISREALTY" || normalized === "REMAXMETROPOLISREALTYBROKERAGE";
}
export function isMetropolisRealtyListing(listing: Pick<SocialListing, "brokerageName" | "listingOfficeName" | "listingOfficeKey" | "sourceSystem">): boolean {
    return listing.listingOfficeKey ? !!verifiedDdfOffice(listing.listingOfficeKey, listing.sourceSystem) : matchesOfficeName(listing.brokerageName || listing.listingOfficeName);
}
export function eligibilityReason(listing: SocialListing | null): string | null {
    if (!listing)
        return "Listing no longer exists.";
    if (!listing.brokerageName && !listing.listingOfficeName && !listing.listingOfficeKey)
        return "Source listing-office identity is unavailable; sync this listing first.";
    if (!isMetropolisRealtyListing(listing))
        return "Listing office does not match RE/MAX METROPOLIS REALTY.";
    if (listing.status !== "active" || !listing.isVisible)
        return "Listing is no longer active and public.";
    if (listing.socialRestricted || listing.permToAdvertise === false)
        return "Source listing-specific display restriction.";
    if (!listing.slug || !listing.mlsNumber)
        return "Public property identity is unavailable.";
    return null;
}
export function campaignId(listingId: string): string {
    return createHash("sha256").update(`just_listed:${listingId}`).digest("hex");
}
export function reference(id: string): string { return `HS-${id.slice(0, 12).toUpperCase()}`; }
export function propertyUrl(listing: Pick<SocialListing, "slug">): string {
    return `https://homescopegta.ca/listings/${encodeURIComponent(listing.slug)}`;
}
export function trackedUrl(listing: SocialListing): string {
    const url = new URL(propertyUrl(listing));
    url.search = new URLSearchParams({ utm_source: "facebook", utm_medium: "organic_social", utm_campaign: "brokerage_new_listing", utm_content: reference(campaignId(listing.listingId)) }).toString();
    return url.toString();
}
export function facts(listing: SocialListing): string[] {
    return [
        listing.bedrooms != null ? `${listing.bedrooms} bedrooms` : null,
        listing.bathrooms != null ? `${listing.bathrooms} bathrooms` : null,
        listing.propertyType,
        listing.livingArea != null && listing.livingAreaUnits ? `${listing.livingArea} ${listing.livingAreaUnits}` : null
    ].filter((v): v is string => !!v);
}
export function priceLabel(listing: SocialListing): string {
    return listing.price == null ? "Explore the listing" : new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(listing.price) + (listing.transactionType === "lease" ? " · For lease" : "");
}
export function buildCaptions(listing: SocialListing, id: string) {
    const city = listing.municipality || "GTA";
    const hashtag = city.replace(/[^A-Za-z]/g, "");
    const openings = ["A new place to call home? Take a closer look.", "Your next chapter could start here. Explore this new listing.", "New to the market: discover this property with HomeScope GTA."];
    const opening = openings[parseInt(id.slice(0, 2), 16) % openings.length];
    const details = [`📍 ${city}, Ontario`, listing.price != null ? `💰 ${priceLabel(listing)}` : null, ...facts(listing)].filter(Boolean).join("\n");
    const identity = reference(id);
    return {
        instagram: `JUST LISTED IN ${city.toUpperCase()}\n\n${opening}\n\n${details}\n\nSwipe to explore. Property link in the first comment. You can also explore HomeScopeGTA.ca — link in bio. Book a private showing or send us a message.\n\n${BRAND.agent}\n${BRAND.brokerage}\n${BRAND.phone}\n${identity}\n\n#HomeScopeGTA #${hashtag}RealEstate #GTARealEstate #OntarioHomes #JustListed`,
        facebook: `JUST LISTED | ${city.toUpperCase()}\n\nDiscover this property with HomeScope GTA.\n\n${details}\n\nProperty link in the first comment. View the full listing and request a private showing.\n\n${BRAND.agent}\n${BRAND.brokerage}\n${BRAND.phone}\n${BRAND.website}\n${identity}\n\n#HomeScopeGTA #${hashtag}RealEstate #GTAHomes`
    };
}
export function newCampaign(listing: SocialListing, now: string, dryRun: boolean, manual = false): SocialCampaign {
    const id = campaignId(listing.listingId);
    const captions = buildCaptions(listing, id);
    const platform = (caption: string): Publication => ({ status: "queued", caption, mediaIds: [], containerId: null, preparedAt: null, submittedAt: null, postId: null, permalink: null, publishedAt: null, retries: 0, retryAt: null, lastError: null });
    return { id, listingGroup: "existing", listingCreatedAt: listing.createdAt, publishApprovedAt: null, listingId: listing.listingId, mlsNumber: listing.mlsNumber, campaignType: "just_listed", discoveredAt: listing.socialDiscoveredAt || listing.createdAt, createdAt: now, updatedAt: now, scheduledAt: null, startedAt: null, nextAttemptAt: now, state: "queued", dryRun, manual, assets: [], assetPaths: [], generation: 0, contentHash: null, lastError: null,
        property: { city: listing.municipality || "GTA", address: listing.address.fullAddress || "", price: listing.price, brokerage: listing.brokerageName || listing.listingOfficeName || BROKERAGE, photo: listing.images[0] || null, url: propertyUrl(listing) }, instagram: platform(captions.instagram), facebook: platform(captions.facebook) };
}
export function contentHash(listing: SocialListing): string {
    return createHash("sha256").update(JSON.stringify(["first-comment-v2", listing.slug, listing.mlsNumber, listing.price, listing.transactionType, listing.municipality, listing.area, listing.address.fullAddress, facts(listing), listing.images])).digest("hex");
}
export function torontoParts(date: Date) {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(date);
    const get = (key: string) => parts.find(p => p.type === key)!.value;
    return { day: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) };
}
export function nextSlot(now: Date, last: string | null, counts: Record<string, number>, settings: SocialSettings): string {
    // Immediate publishing: legacy schedule fields no longer delay discoveries.
    return now.toISOString();
}

export function validateSettings(input: Partial<SocialSettings>): Partial<SocialSettings> {
    const result: Partial<SocialSettings> = {};
    for (const key of ["dailyLimit", "minimumHours", "windowStart", "windowEnd"] as const) {
        const value = input[key];
        if (value === undefined)
            continue;
        const bounds = key === "dailyLimit" ? [0, 10] : key === "minimumHours" ? [0, 24] : [0, 24];
        if (!Number.isInteger(value) || value < bounds[0] || value > bounds[1])
            throw new Error(`Invalid ${key}.`);
        result[key] = value;
    }
    if (input.notifications !== undefined) {
        if (!["dashboard", "failures"].includes(input.notifications))
            throw new Error("Invalid notification setting.");
        result.notifications = input.notifications;
    }
    return result;
}
export function stopCampaign(c: SocialCampaign, reason: string) {
    c.state = "cancelled";
    c.lastError = reason;
    c.nextAttemptAt = NEVER;
    for (const key of ["instagram", "facebook"] as const)
        if (c[key].status !== "published" && c[key].status !== "uncertain")
            c[key].status = "cancelled";
}
