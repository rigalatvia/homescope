import type { MLSListingFirestoreDocument } from "@/lib/mls/types";
export type Platform = "instagram" | "facebook";
export type PublicationState = "queued" | "publishing" | "published" | "failed" | "uncertain" | "cancelled";
export interface Publication {
    firstComment?: {
        message: string;
        status: "queued" | "published" | "failed" | "uncertain";
        id: string | null;
        submittedAt: string | null;
        retryAt: string | null;
        attempts: number;
        checks: number;
        lastError: string | null;
    };
    status: PublicationState;
    caption: string;
    mediaIds: string[];
    containerId: string | null;
    preparedAt: string | null;
    submittedAt: string | null;
    postId: string | null;
    permalink: string | null;
    publishedAt: string | null;
    retries: number;
    retryAt: string | null;
    lastError: string | null;
    reconciliationChecks?: number;
    processingChecks?: number;
}
export interface SocialCampaign {
    id: string;
    listingId: string;
    mlsNumber: string | null;
    campaignType: "just_listed";
    discoveredAt: string;
    createdAt: string;
    updatedAt: string;
    scheduledAt: string | null;
    startedAt: string | null;
    nextAttemptAt: string;
    state: "queued" | "generating" | "ready" | "scheduled" | "publishing" | "published" | "failed" | "skipped" | "cancelled";
    dryRun: boolean;
    manual: boolean;
    assets: string[];
    assetPaths: string[];
    generation: number;
    generationFailures?: number;
    editedCaptions?: Platform[];
    contentHash: string | null;
    lastError: string | null;
    property: {
        city: string;
        address: string;
        price: number | null;
        brokerage: string;
        photo: string | null;
        url: string;
    };
    instagram: Publication;
    facebook: Publication;
}
export interface SocialSettings {
    enabled: boolean;
    activatedAt: string | null;
    baselineComplete: boolean;
    baselineCursor: [
        string,
        string
    ] | null;
    discoveryCursor: [
        string,
        string
    ] | null;
    dailyLimit: number;
    minimumHours: number;
    windowStart: number;
    windowEnd: number;
    timezone: "America/Toronto";
    template: "navy-editorial-v1";
    notifications: "dashboard" | "failures";
    dryRunPassedAt: string | null;
}
export type SocialListing = MLSListingFirestoreDocument & {
    listingOfficeName?: string | null;
    listingOfficeKey?: string | null;
    socialRestricted?: boolean;
    socialDiscoveredAt?: string;
    socialDiscoveryPendingAt?: string;
};
export const NEVER = "9999-12-31T00:00:00.000Z";
export const PLATFORMS: Platform[] = ["instagram", "facebook"];
