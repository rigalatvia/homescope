import { createHmac } from "node:crypto";
import { getServerConfigValue } from "@/lib/server/secret-manager";
import type { Platform, SocialCampaign, Publication } from "./types";
import { reference } from "./policy";
export interface MetaConfig {
    version: string;
    pageId: string;
    instagramId: string;
    token: string;
    appId: string;
    appSecret: string;
}
export class MetaError extends Error {
    constructor(public readonly code: number, public readonly transient = false, public readonly ambiguous = false) {
        super(ambiguous ? "Meta publication outcome is uncertain; reconciliation required." : code === 190 ? "Meta token expired or invalid. Reconnect before retrying." : `Meta request failed (code ${code}). Check permissions, media and connection health.`);
    }
}
export async function metaConfig(): Promise<MetaConfig> {
    const keys = ["META_GRAPH_API_VERSION", "META_FACEBOOK_PAGE_ID", "META_INSTAGRAM_ACCOUNT_ID", "META_PAGE_ACCESS_TOKEN", "META_APP_ID", "META_APP_SECRET"];
    const values = await Promise.all(keys.map(key => getServerConfigValue(key)));
    if (values.some(value => !value))
        throw new Error("Configure all Meta server-side credentials and an explicitly supported API version.");
    if (!/^v\d+\.0$/.test(values[0]!))
        throw new Error("Invalid Meta API version.");
    if (![values[1], values[2], values[4]].every(value => /^\d+$/.test(value!)))
        throw new Error("Meta account identifiers must be numeric.");
    return { version: values[0]!, pageId: values[1]!, instagramId: values[2]!, token: values[3]!, appId: values[4]!, appSecret: values[5]! };
}
export class MetaClient {
    constructor(public readonly config: MetaConfig, private readonly transport: typeof fetch = fetch) { }
    async call<T>(path: string, params: Record<string, string> = {}, method = "GET", publication = false): Promise<T> {
        const url = new URL(`https://graph.facebook.com/${this.config.version}/${path}`);
        const body = new URLSearchParams({ ...params, appsecret_proof: createHmac("sha256", this.config.appSecret).update(this.config.token).digest("hex") });
        if (method === "GET")
            url.search = body.toString();
        try {
            const response = await this.transport(url, { method, headers: { Authorization: `Bearer ${this.config.token}`, ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) }, body: method === "POST" ? body : undefined, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20000) });
            let result: {
                error?: {
                    code?: number;
                    is_transient?: boolean;
                };
            };
            try {
                result = await response.json();
            }
            catch {
                throw new MetaError(response.status, true, publication);
            }
            if (!response.ok || result.error) {
                const code = result.error?.code || response.status;
                const transient = response.status === 429 || response.status >= 500 || [1, 2, 4, 17, 32, 613].includes(code) || result.error?.is_transient === true;
                throw new MetaError(code, transient, publication && response.status >= 500);
            }
            return result as T;
        }
        catch (error) {
            if (error instanceof MetaError)
                throw error;
            throw new MetaError(0, true, publication);
        }
    }
    async health() {
        const page = await this.call<{
            id: string;
            name?: string;
            instagram_business_account?: {
                id: string;
            };
        }>(this.config.pageId, { fields: "id,name,instagram_business_account" });
        const instagram = await this.call<{
            id: string;
            username?: string;
        }>(this.config.instagramId, { fields: "id,username" });
        const quota = await this.call<{
            data?: Array<{
                quota_usage: number;
                config?: {
                    quota_total: number;
                };
            }>;
        }>(`${this.config.instagramId}/content_publishing_limit`, { fields: "quota_usage,config" });
        const url = new URL(`https://graph.facebook.com/${this.config.version}/debug_token`);
        url.searchParams.set("input_token", this.config.token);
        const response = await this.transport(url, { headers: { Authorization: `Bearer ${this.config.appId}|${this.config.appSecret}` }, cache: "no-store", signal: AbortSignal.timeout(20000), redirect: "error" });
        const debug = await response.json() as {
            data?: {
                is_valid?: boolean;
                app_id?: string;
                expires_at?: number;
                data_access_expires_at?: number;
                scopes?: string[];
            };
        };
        const required = ["instagram_basic", "instagram_content_publish", "instagram_manage_comments", "pages_read_engagement", "pages_manage_posts", "pages_manage_engagement"];
        const missingScopes = required.filter(scope => !debug.data?.scopes?.includes(scope));
        const expires = debug.data?.expires_at || 0;
        const dataExpires = debug.data?.data_access_expires_at || 0;
        const now = Date.now() / 1000;
        const ok = response.ok && debug.data?.is_valid === true && debug.data.app_id === this.config.appId && !missingScopes.length && (!expires || expires > now) && (!dataExpires || dataExpires > now) && page.instagram_business_account?.id === this.config.instagramId && instagram.id === this.config.instagramId;
        return { ok, pageId: page.id, pageName: page.name || "", instagramId: instagram.id, username: instagram.username || "", missingScopes, expiresAt: expires ? new Date(expires * 1000).toISOString() : null, quota: quota.data?.[0] || null, checkedAt: new Date().toISOString() };
    }
}
type Save = () => Promise<void>;
export async function advanceFirstComment(client: MetaClient, campaign: SocialCampaign, platform: Platform, save: Save) {
    if (campaign.dryRun)
        throw new Error("Dry-run comments cannot be published.");
    const state = campaign[platform];
    if (!state.postId || state.status !== "published")
        return;
    const comment = state.firstComment ||= {
        message: `Explore this property on HomeScope GTA:\n${campaign.property.url}`,
        status: "queued", id: null, submittedAt: null, retryAt: null, attempts: 0, checks: 0, lastError: null
    };
    if (comment.id || comment.status === "published" || (comment.retryAt && Date.parse(comment.retryAt) > Date.now()) || (comment.status === "failed" && !comment.retryAt))
        return;
    if (comment.submittedAt) {
        // A timeout may have created the comment. Read back; never blindly repeat POST.
        comment.status = "uncertain";
        comment.checks++;
        comment.retryAt = comment.checks < 5 ? new Date(Date.now() + 300000).toISOString() : null;
        await save();
        let after = "";
        for (let page = 0; page < 3; page++) {
            const result = await client.call<{
                data?: Array<{
                    id: string;
                    text?: string;
                    message?: string;
                    from?: {
                        id?: string;
                    };
                }>;
                paging?: {
                    next?: string;
                    cursors?: {
                        after?: string;
                    };
                };
            }>(`${state.postId}/comments`, {
                fields: platform === "instagram" ? "id,text,from" : "id,message,from", limit: "100", ...(after ? { after } : {})
            });
            const author = platform === "instagram" ? client.config.instagramId : client.config.pageId;
            const matches = (result.data || []).filter(c => (c.text || c.message) === comment.message && c.from?.id === author);
            if (matches.length === 1) {
                comment.id = matches[0].id;
                comment.status = "published";
                comment.retryAt = null;
                comment.lastError = null;
                await save();
                return;
            }
            if (matches.length > 1 || !result.paging?.next || !result.paging.cursors?.after)
                return;
            after = result.paging.cursors.after;
        }
        return;
    }
    comment.submittedAt = new Date().toISOString();
    comment.status = "uncertain";
    comment.retryAt = new Date(Date.now() + 300000).toISOString();
    comment.attempts++;
    await save();
    try {
        const result = await client.call<{
            id: string;
        }>(`${state.postId}/comments`, { message: comment.message }, "POST", true);
        comment.id = requireId(result, true);
        comment.status = "published";
        comment.retryAt = null;
        comment.lastError = null;
    }
    catch (error) {
        if (!(error instanceof MetaError))
            throw error;
        comment.lastError = error.message;
        if (!error.ambiguous) {
            comment.submittedAt = null;
            comment.status = "failed";
            comment.retryAt = error.transient && comment.attempts < 5 ? new Date(Date.now() + 60000 * 2 ** comment.attempts).toISOString() : null;
        }
    }
    await save();
}
export function commentRetryAt(campaign: SocialCampaign): string | null {
    return (["instagram", "facebook"] as const).flatMap(p => {
        const state = campaign[p], comment = state.firstComment;
        if (state.status !== "published")
            return [];
        if (!comment || comment.status === "queued")
            return [new Date().toISOString()];
        return comment.retryAt ? [comment.retryAt] : [];
    }).sort()[0] || null;
}
function requireId(result: {
    id?: string;
}, publication = false): string {
    if (!result.id)
        throw new MetaError(0, true, publication);
    return result.id;
}
async function permalink(client: MetaClient, platform: Platform, state: Publication) {
    const result = await client.call<{
        permalink?: string;
        permalink_url?: string;
    }>(state.postId!, { fields: platform === "instagram" ? "permalink" : "permalink_url" });
    const value = result.permalink || result.permalink_url;
    if (value && /^https:\/\/(www\.)?(instagram|facebook)\.com\//.test(value))
        state.permalink = value;
}
export async function reconcile(client: MetaClient, campaign: SocialCampaign, platform: Platform, save: Save) {
    const state = campaign[platform];
    if (state.postId) {
        state.status = "published";
        await permalink(client, platform, state);
        await save();
        return;
    }
    if (!state.submittedAt)
        return;
    const target = platform === "instagram" ? client.config.instagramId : client.config.pageId;
    const edge = platform === "instagram" ? "media" : "feed";
    const fields = platform === "instagram" ? "id,caption,timestamp,permalink" : "id,message,created_time,permalink_url";
    const matches: Array<{
        id: string;
        time: string;
        url: string | null;
    }> = [];
    let after = "";
    for (let page = 0; page < 3; page++) {
        const result = await client.call<{
            data?: Array<{
                id: string;
                caption?: string;
                message?: string;
                timestamp?: string;
                created_time?: string;
                permalink?: string;
                permalink_url?: string;
            }>;
            paging?: {
                cursors?: {
                    after?: string;
                };
                next?: string;
            };
        }>(`${target}/${edge}`, { fields, limit: "100", ...(after ? { after } : {}) });
        for (const post of result.data || []) {
            const time = post.timestamp || post.created_time || "";
            if ((post.caption || post.message || "").includes(reference(campaign.id)) && Date.parse(time) >= Date.parse(state.submittedAt) - 60000)
                matches.push({ id: post.id, time, url: post.permalink || post.permalink_url || null });
        }
        if (matches.length || !result.paging?.next || !result.paging.cursors?.after)
            break;
        after = result.paging.cursors.after;
    }
    if (matches.length === 1) {
        state.postId = matches[0].id;
        state.permalink = matches[0].url;
        state.publishedAt = matches[0].time;
        state.status = "published";
        state.lastError = null;
        await save();
    }
    // Zero or multiple matches is NOT proof that publication failed. Never repost.
}
export async function advancePlatform(client: MetaClient, campaign: SocialCampaign, platform: Platform, save: Save, beforePublish: () => Promise<void>) {
    if (campaign.dryRun)
        throw new Error("Dry-run campaigns cannot call Meta publishing endpoints.");
    const state = campaign[platform];
    if (state.status === "published") {
        await advanceFirstComment(client, campaign, platform, save);
        if (!state.permalink) {
            try {
                await permalink(client, platform, state);
                await save();
            }
            catch { /* Published ID remains authoritative. */ }
        }
        return;
    }
    if (state.retryAt && Date.parse(state.retryAt) > Date.now())
        return;
    if (state.submittedAt) {
        state.status = "uncertain";
        state.reconciliationChecks = (state.reconciliationChecks || 0) + 1;
        state.retryAt = state.reconciliationChecks < 5 ? new Date(Date.now() + 300000).toISOString() : null;
        await save();
        await reconcile(client, campaign, platform, save);
        return;
    }
    if (state.status === "cancelled" || (state.status === "failed" && !state.retryAt))
        return;
    if (state.retryAt && Date.parse(state.retryAt) > Date.now())
        return;
    try {
        if (state.preparedAt && Date.now() - Date.parse(state.preparedAt) > 20 * 3600000) {
            state.mediaIds = [];
            state.containerId = null;
            state.preparedAt = null;
        }
        state.status = "publishing";
        const target = platform === "instagram" ? client.config.instagramId : client.config.pageId;
        if (state.mediaIds.length < campaign.assets.length) {
            if (platform === "instagram" && state.mediaIds.length === 0) {
                const quota = await client.call<{
                    data?: Array<{
                        quota_usage: number;
                        config?: {
                            quota_total: number;
                        };
                    }>;
                }>(`${target}/content_publishing_limit`, { fields: "quota_usage,config" });
                const q = quota.data?.[0];
                if (!q?.config?.quota_total || q.quota_usage >= q.config.quota_total)
                    throw new MetaError(4, true);
            }
            const url = campaign.assets[state.mediaIds.length];
            const result = await client.call<{
                id: string;
            }>(`${target}/${platform === "instagram" ? "media" : "photos"}`, platform === "instagram" ? { image_url: url, is_carousel_item: "true" } : { url, published: "false" }, "POST");
            state.mediaIds.push(requireId(result));
            state.preparedAt ||= new Date().toISOString();
            await save();
            return;
        }
        if (platform === "instagram" && !state.containerId) {
            state.containerId = requireId(await client.call<{
                id: string;
            }>(`${target}/media`, { media_type: "CAROUSEL", children: state.mediaIds.join(","), caption: state.caption }, "POST"));
            await save();
            return;
        }
        if (platform === "instagram") {
            const status = await client.call<{
                status_code: string;
            }>(state.containerId!, { fields: "status_code" });
            if (status.status_code === "IN_PROGRESS") {
                state.processingChecks = (state.processingChecks || 0) + 1;
                if (state.processingChecks >= 10)
                    throw new MetaError(9007);
                state.retryAt = new Date(Date.now() + 60000).toISOString();
                await save();
                return;
            }
            if (status.status_code !== "FINISHED")
                if (status.status_code === "PUBLISHED")
                    state.submittedAt ||= state.preparedAt || new Date().toISOString();
            if (status.status_code !== "FINISHED")
                throw new MetaError(9007, false, status.status_code === "PUBLISHED");
        }
        await beforePublish();
        // Persist intent BEFORE the irreversible POST, including on crash/restart.
        state.submittedAt = new Date().toISOString();
        state.status = "uncertain";
        await save();
        const result = await client.call<{
            id: string;
        }>(`${target}/${platform === "instagram" ? "media_publish" : "feed"}`, platform === "instagram" ? { creation_id: state.containerId! } : { message: state.caption, attached_media: JSON.stringify(state.mediaIds.map(id => ({ media_fbid: id }))) }, "POST", true);
        state.postId = requireId(result, true);
        state.status = "published";
        state.publishedAt = new Date().toISOString();
        state.lastError = null;
        state.retryAt = null;
        await save();
        if (state.status === "published")
            await advanceFirstComment(client, campaign, platform, save);
        try {
            await permalink(client, platform, state);
            await save();
        }
        catch { /* Do not turn a confirmed publication into a retry. */ }
    }
    catch (error) {
        // A comment or permalink failure must never downgrade a confirmed post.
        if (state.postId)
            return;
        if (!(error instanceof MetaError))
            throw error;
        state.lastError = error.message;
        if (error.ambiguous) {
            state.status = "uncertain";
            state.retryAt = new Date(Date.now() + 300000).toISOString();
        }
        else {
            state.submittedAt = null;
            state.status = "failed";
            state.retries++;
            state.retryAt = error.transient && state.retries < 5 ? new Date(Date.now() + Math.min(6 * 3600000, 60000 * 2 ** state.retries)).toISOString() : null;
        }
        await save();
    }
}
