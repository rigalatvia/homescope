import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { getServerConfigValue } from "@/lib/server/secret-manager";
import { eligibilityReason, contentHash, stopCampaign, newCampaign } from "./policy";
import { getSettings, getListing, withSocialLock, discover, COLLECTION, settingsRef, type WorkerLock } from "./store";
import { renderCarousel } from "./render";
import { selectPhotos } from "./images";
import { storeCarousel } from "./storage";
import { advancePlatform, commentRetryAt, MetaClient, metaConfig } from "./meta";
import { NEVER, PLATFORMS, type SocialCampaign, type SocialSettings } from "./types";
export async function validatePropertyUrl(url: string) {
    const parsed = new URL(url);
    if (parsed.origin !== "https://homescopegta.ca" || !parsed.pathname.startsWith("/listings/"))
        throw new Error("Invalid canonical property URL.");
    const response = await fetch(url, { method: "GET", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(20000) });
    if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) {
        await response.body?.cancel();
        throw new Error("Property page is not publicly accessible.");
    }
    // A successful public detail page is required; do not publish a soft not-found page.
    const html = await response.text();
    if (!html.includes(parsed.pathname) || html.includes('"NEXT_HTTP_ERROR_FALLBACK;404"'))
        throw new Error("Property page identity could not be validated.");
}
export async function generateCampaign(campaign: SocialCampaign, lock: WorkerLock) {
    const listing = await getListing(campaign.listingId);
    const reason = eligibilityReason(listing);
    if (reason) {
        stopCampaign(campaign, reason);
        await lock.save(campaign);
        return;
    }
    campaign.state = "generating";
    const fresh = newCampaign(listing!, new Date().toISOString(), campaign.dryRun, campaign.manual);
    campaign.property = fresh.property;
    if (!campaign.editedCaptions?.length) {
        campaign.instagram = fresh.instagram;
        campaign.facebook = fresh.facebook;
    }
    await lock.save(campaign);
    await validatePropertyUrl(campaign.property.url);
    const photos = await selectPhotos(listing!.images);
    const slides = await renderCarousel(listing!, photos);
    await lock.check();
    const stored = await storeCarousel(campaign, slides);
    // Check the anonymous URLs Meta will fetch, not only the authenticated upload.
    await Promise.all(stored.urls.map(async (url) => {
        const response = await fetch(url, { method: "GET", redirect: "error", signal: AbortSignal.timeout(20000), cache: "no-store" });
        await response.body?.cancel();
        if (!response.ok || !response.headers.get("content-type")?.startsWith("image/jpeg"))
            throw new Error("Generated slide is not publicly accessible.");
    }));
    campaign.assets = stored.urls;
    campaign.assetPaths = stored.paths;
    campaign.contentHash = contentHash(listing!);
    campaign.generation++;
    campaign.generationFailures = 0;
    campaign.state = "ready";
    campaign.lastError = null;
    campaign.nextAttemptAt = campaign.dryRun ? NEVER : new Date().toISOString();
    await lock.save(campaign);
    if (campaign.dryRun)
        await settingsRef().set({ dryRunPassedAt: new Date().toISOString() }, { merge: true });
}
async function processCampaign(campaign: SocialCampaign, settings: SocialSettings, lock: WorkerLock) {
    if (["cancelled", "skipped"].includes(campaign.state))
        return;
    // Every platform publication requires an explicit approval on this campaign.
    // Legacy automatic jobs cannot publish merely because automation was enabled.
    if (campaign.state === "queued" || campaign.state === "generating") {
        await generateCampaign(campaign, lock);
        return;
    }
    if (campaign.dryRun || !campaign.publishApprovedAt)
        return;
    if (await getServerConfigValue("SOCIAL_AUTO_PUBLISH_ENABLED") !== "true")
        return;
    const listing = await getListing(campaign.listingId), reason = eligibilityReason(listing);
    if (reason) {
        stopCampaign(campaign, reason);
        await lock.save(campaign);
        return;
    }
    if (campaign.contentHash !== contentHash(listing!)) {
        if (PLATFORMS.some(p => campaign[p].postId || campaign[p].submittedAt)) {
            stopCampaign(campaign, "Listing facts changed after a publication attempt; remaining platform cancelled to avoid stale claims.");
            await lock.save(campaign);
            return;
        }
        if (campaign.editedCaptions?.length) {
            campaign.state = "failed";
            campaign.lastError = "Listing facts changed after a custom caption edit. Regenerate and review the caption.";
            campaign.nextAttemptAt = NEVER;
            await lock.save(campaign);
            return;
        }
        const refreshed = newCampaign(listing!, new Date().toISOString(), false, campaign.manual);
        campaign.instagram = refreshed.instagram;
        campaign.facebook = refreshed.facebook;
        campaign.property = refreshed.property;
        campaign.state = "queued";
        campaign.nextAttemptAt = new Date().toISOString();
        await lock.save(campaign);
        return;
    }
    const client = new MetaClient(await metaConfig());
    campaign.state = "publishing";
    for (const platform of PLATFORMS) {
        await lock.check();
        try {
            await advancePlatform(client, campaign, platform, () => lock.save(campaign), async () => {
                const current = await getListing(campaign.listingId);
                if (eligibilityReason(current) || !current || contentHash(current) !== campaign.contentHash)
                    throw new Error("Listing changed before publication; stop and regenerate.");
                if (!campaign.publishApprovedAt || await getServerConfigValue("SOCIAL_AUTO_PUBLISH_ENABLED") !== "true")
                    throw new Error("Live publishing is disabled.");
                await validatePropertyUrl(campaign.property.url);

            });
        }
        catch (error) {
            campaign[platform].lastError = "Publishing step interrupted. Check connection or current property data.";
            campaign[platform].status = campaign[platform].postId ? "published" : campaign[platform].submittedAt ? "uncertain" : "failed";
            campaign[platform].retryAt = null;
            await lock.save(campaign);
        }
    }
    const statuses = PLATFORMS.map(p => campaign[p].status);
    campaign.state = statuses.every(s => s === "published") ? "published" : statuses.every(s => ["published", "failed", "uncertain", "cancelled"].includes(s)) ? "failed" : "publishing";
    if (PLATFORMS.some(p => ["failed", "uncertain"].includes(campaign[p].firstComment?.status || "")))
        campaign.state = "failed";
    const retry = PLATFORMS.map(p => campaign[p].retryAt).filter((v): v is string => !!v).sort()[0];
    campaign.nextAttemptAt = campaign.state === "published" ? (commentRetryAt(campaign) || NEVER) : campaign.state === "failed" ? ([retry, commentRetryAt(campaign)].filter((v): v is string => !!v).sort()[0] || NEVER) : (retry || new Date().toISOString());
    await lock.save(campaign);
}
export async function runSocialWorker(targetId?: string) {
    return withSocialLock(async (lock) => {
        const settings = await getSettings();
        // Sync creates review drafts directly. Worker ticks only advance work;
        // they never discover listings for automatic publication.
        const discovery = null;
        const snapshot = targetId ? await getFirebaseAdminFirestore().collection(COLLECTION).doc(targetId).get() : null;
        const due = targetId ? null : await getFirebaseAdminFirestore().collection(COLLECTION).where("nextAttemptAt", "<=", new Date().toISOString()).orderBy("nextAttemptAt").limit(1).get();
        const campaign = (snapshot?.data() || due?.docs[0]?.data()) as SocialCampaign | undefined;
        if (!campaign)
            return { discovery, processed: 0 };
        if (!targetId && !campaign.publishApprovedAt) {
            campaign.dryRun = true;
            campaign.nextAttemptAt = NEVER;
            await lock.save(campaign);
            return { discovery, processed: 0 };
        }
        try {
            const deadline = Date.now() + 180000;
            for (let step = 0; step < 20; step++) {
                const before = JSON.stringify(campaign);
                await processCampaign(campaign, settings, lock);
                if (campaign.dryRun || Date.now() >= deadline || Date.parse(campaign.nextAttemptAt) > Date.now() || JSON.stringify(campaign) === before) break;
            }
        }
        catch {
            const generationFailed = campaign.state === "generating";
            if (generationFailed)
                campaign.generationFailures = (campaign.generationFailures || 0) + 1;
            campaign.state = "failed";
            campaign.lastError = "Generation or worker step failed. Check photo hosts, storage, property URL, and server configuration.";
            campaign.nextAttemptAt = NEVER;
            if (generationFailed && campaign.generationFailures! < 5) {
                campaign.state = "queued";
                campaign.nextAttemptAt = new Date(Date.now() + 300000 * 2 ** campaign.generationFailures!).toISOString();
            }
            await lock.save(campaign);
        }
        return { discovery, processed: 1, campaignId: campaign.id, state: campaign.state };
    });
}
