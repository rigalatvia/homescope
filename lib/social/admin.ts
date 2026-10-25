import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { getServerConfigValue } from "@/lib/server/secret-manager";
import { campaignRef, getListing, getSettings, withSocialLock, settingsRef, COLLECTION } from "./store";
import { eligibilityReason, newCampaign, validateSettings, reference, stopCampaign } from "./policy";
import { MetaClient, metaConfig, reconcile, advanceFirstComment, commentRetryAt } from "./meta";
import { generateCampaign, runSocialWorker } from "./worker";
import { NEVER, PLATFORMS, type SocialCampaign, type SocialSettings, type Platform } from "./types";
export async function socialOverview(before?: string) {
    const db = getFirebaseAdminFirestore(), collection = db.collection(COLLECTION);
    let query = collection.orderBy("createdAt", "desc");
    if (before) {
        const pivot = await campaignRef(before).get();
        if (pivot.exists)
            query = query.startAfter(pivot);
    }
    const [settings, rows, queued, scheduled, instagram, facebook, failed, discovered] = await Promise.all([
        getSettings(), query.limit(30).get(), collection.where("state", "==", "queued").count().get(), collection.where("state", "==", "scheduled").count().get(), collection.where("instagram.status", "==", "published").count().get(), collection.where("facebook.status", "==", "published").count().get(), collection.where("state", "==", "failed").count().get(), collection.where("state", "!=", "skipped").count().get()
    ]);
    return { settings, campaigns: rows.docs.map(d => d.data()), nextCursor: rows.size === 30 ? rows.docs.at(-1)!.id : null, counts: { discovered: discovered.data().count, queued: queued.data().count, scheduled: scheduled.data().count, instagram: instagram.data().count, facebook: facebook.data().count, failed: failed.data().count }, liveEnvironmentEnabled: await getServerConfigValue("SOCIAL_AUTO_PUBLISH_ENABLED") === "true" };
}
export async function socialAction(input: Record<string, unknown>) {
    const action = String(input.action || "");
    if (action === "health")
        return new MetaClient(await metaConfig()).health();
    if (action === "process")
        return runSocialWorker(typeof input.id === "string" ? campaignRef(input.id).id : undefined);
    const result = await withSocialLock(async (lock) => {
        if (action === "settings") {
            const settings = await getSettings();
            const update = validateSettings(input.settings as Partial<SocialSettings> || {});
            const requested = input.settings as Partial<SocialSettings>;
            const merged = { ...settings, ...update };
            if (merged.windowEnd <= merged.windowStart)
                throw new Error("Publishing window must end after it starts.");
            if (requested?.enabled !== undefined) {
                if (typeof requested.enabled !== "boolean")
                    throw new Error("Invalid activation setting.");
                if (requested.enabled && !settings.enabled) {
                    if (!settings.dryRunPassedAt)
                        throw new Error("Complete an eligible listing dry run before activation.");
                    if (await getServerConfigValue("SOCIAL_AUTO_PUBLISH_ENABLED") !== "true")
                        throw new Error("Set the server-side live publishing switch before activation.");
                    if (!(await new MetaClient(await metaConfig()).health()).ok)
                        throw new Error("Meta connection, linked accounts or permissions require attention.");
                    if (!merged.activatedAt) {
                        merged.activatedAt = new Date().toISOString();
                        merged.baselineComplete = false;
                        merged.baselineCursor = null;
                        merged.discoveryCursor = null;
                    }
                }
                merged.enabled = requested.enabled;
            }
            await settingsRef().set(merged);
            return { settings: merged };
        }
        if (action === "dryRun") {
            const listing = await getListing(String(input.listingId || ""));
            const reason = eligibilityReason(listing);
            if (reason)
                throw new Error(reason);
            const campaign = newCampaign(listing!, new Date().toISOString(), true, true);
            const existing = (await campaignRef(campaign.id).get()).data() as SocialCampaign | undefined;
            if (existing && existing.state !== "skipped")
                throw new Error("This listing already has a campaign. Open it to regenerate or review.");
            await lock.save(campaign);
            await generateCampaign(campaign, lock);
            return { id: campaign.id };
        }
        const ref = campaignRef(String(input.id || ""));
        const snap = await ref.get();
        if (!snap.exists)
            throw new Error("Campaign not found.");
        const campaign = snap.data() as SocialCampaign;
        const platform = input.platform as Platform;
        if (["caption", "retry", "reconcile", "retryComment", "reconcileComment"].includes(action) && !PLATFORMS.includes(platform))
            throw new Error("Select a platform.");
        if (action === "caption") {
            const state = campaign[platform];
            if (state.submittedAt || state.postId || state.mediaIds.length || state.containerId)
                throw new Error("Caption is locked once Meta preparation starts. Regenerate an unpublished campaign first.");
            let caption = String(input.caption || "").trim();
            if (/\bMLS\b|\blisting agent\b|\bmy listing\b/i.test(caption) || (campaign.mlsNumber && caption.toLowerCase().includes(campaign.mlsNumber.toLowerCase())))
                throw new Error("Public captions cannot include an MLS number or imply listing-agent representation.");
            if (!caption.includes(reference(campaign.id)))
                caption += `\n${reference(campaign.id)}`;
            if (caption.length < 20 || caption.length > (platform === "instagram" ? 2200 : 6000))
                throw new Error("Caption length is invalid.");
            if (!caption.includes("RE/MAX METROPOLIS REALTY"))
                throw new Error("Keep the brokerage identification in the caption.");
            state.caption = caption;
            campaign.editedCaptions = [...new Set([...(campaign.editedCaptions || []), platform])];
        }
        else if (action === "cancel") {
            if (PLATFORMS.some(p => campaign[p].submittedAt && !campaign[p].postId))
                throw new Error("Reconcile the uncertain publication before cancelling; it may already be public.");
            stopCampaign(campaign, "Cancelled by administrator.");
        }
        else if (action === "regenerate") {
            if (PLATFORMS.some(p => campaign[p].postId || campaign[p].submittedAt))
                throw new Error("Published or uncertain campaigns cannot be regenerated.");
            const listing = await getListing(campaign.listingId), reason = eligibilityReason(listing);
            if (reason)
                throw new Error(reason);
            const fresh = newCampaign(listing!, new Date().toISOString(), campaign.dryRun, campaign.manual);
            campaign.instagram = fresh.instagram;
            campaign.facebook = fresh.facebook;
            campaign.property = fresh.property;
            campaign.editedCaptions = [];
            campaign.state = "queued";
            await lock.save(campaign);
            await generateCampaign(campaign, lock);
            return { id: campaign.id };
        }
        else if (action === "publishNow") {
            const settings = await getSettings();
            if (!settings.enabled || await getServerConfigValue("SOCIAL_AUTO_PUBLISH_ENABLED") !== "true")
                throw new Error("Activate publishing first.");
            if (!campaign.assets.length || !["ready", "scheduled"].includes(campaign.state))
                throw new Error("Generate a ready carousel first.");
            const reason = eligibilityReason(await getListing(campaign.listingId));
            if (reason)
                throw new Error(reason);
            campaign.dryRun = false;
            campaign.scheduledAt = new Date().toISOString();
            campaign.nextAttemptAt = campaign.scheduledAt;
            campaign.state = "scheduled";
        }
        else if (action === "retry") {
            const state = campaign[platform];
            if (state.status !== "failed" || state.submittedAt || state.postId)
                throw new Error("Only definitively failed, unpublished attempts can be retried. Reconcile uncertain outcomes.");
            state.status = "queued";
            state.retries = 0;
            state.retryAt = null;
            state.lastError = null;
            campaign.state = "publishing";
            campaign.nextAttemptAt = new Date().toISOString();
        }
        else if (action === "retryComment" || action === "reconcileComment") {
            const comment = campaign[platform].firstComment;
            if (!comment || campaign[platform].status !== "published")
                throw new Error("No published-post comment to recover.");
            if (action === "retryComment") {
                if (comment.status !== "failed" || comment.submittedAt || comment.id)
                    throw new Error("Only definitely failed comments can be retried.");
                comment.status = "queued";
                comment.attempts = 0;
                comment.retryAt = null;
                comment.lastError = null;
            }
            else {
                if (!comment.submittedAt || comment.id)
                    throw new Error("No uncertain comment to reconcile.");
                comment.retryAt = null;
                await advanceFirstComment(new MetaClient(await metaConfig()), campaign, platform, () => lock.save(campaign));
            }
            campaign.nextAttemptAt = commentRetryAt(campaign) || NEVER;
            campaign.state = campaign.nextAttemptAt === NEVER ? campaign.state : "publishing";
        }
        else if (action === "reconcile") {
            await reconcile(new MetaClient(await metaConfig()), campaign, platform, () => lock.save(campaign));
            campaign.state = PLATFORMS.every(p => campaign[p].status === "published") ? "published" : "failed";
            campaign.nextAttemptAt = new Date().toISOString();
        }
        else
            throw new Error("Unsupported social action.");
        await lock.save(campaign);
        return { id: campaign.id };
    });
    if (action === "publishNow" && "id" in result)
        await runSocialWorker(result.id);
    return result;
}
