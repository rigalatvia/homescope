import { randomUUID } from "node:crypto";
import { FieldPath, FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { DEFAULT_SETTINGS, campaignId, eligibilityReason, newCampaign, nextSlot, torontoParts } from "./policy";
import { type SocialSettings, type SocialCampaign, type SocialListing } from "./types";
export const COLLECTION = "propertySocialPosts";
export const settingsRef = () => getFirebaseAdminFirestore().collection("settings").doc("socialAutomation");
export const campaignRef = (id: string) => {
    if (!/^[a-f0-9]{64}$/.test(id))
        throw new Error("Invalid campaign identifier.");
    return getFirebaseAdminFirestore().collection(COLLECTION).doc(id);
};
export async function getSettings(): Promise<SocialSettings> { return { ...DEFAULT_SETTINGS, ...(await settingsRef().get()).data() }; }
export async function getListing(id: string): Promise<SocialListing | null> {
    if (!id || id.length > 250 || id.includes("/"))
        throw new Error("Invalid listing identifier.");
    const snapshot = await getFirebaseAdminFirestore().collection("listings").doc(id).get();
    return snapshot.exists ? snapshot.data() as SocialListing : null;
}
export interface WorkerLock {
    check: () => Promise<void>;
    save: (campaign: SocialCampaign) => Promise<void>;
}
export async function withSocialLock<T>(operation: (lock: WorkerLock) => Promise<T>): Promise<T> {
    const db = getFirebaseAdminFirestore(), ref = db.collection("settings").doc("socialWorkerLease"), owner = randomUUID();
    const duration = 10 * 60000;
    await db.runTransaction(async (tx) => {
        const old = (await tx.get(ref)).data();
        if (old?.until && Date.parse(old.until) > Date.now())
            throw new Error("Social worker is busy. Try again shortly.");
        tx.set(ref, { owner, until: new Date(Date.now() + duration).toISOString() });
    });
    const verify = (data: FirebaseFirestore.DocumentData | undefined) => {
        if (data?.owner !== owner || Date.parse(data.until) <= Date.now())
            throw new Error("Social worker lease expired.");
    };
    const lock: WorkerLock = {
        check: async () => verify((await ref.get()).data()),
        save: async (campaign) => { await db.runTransaction(async (tx) => { verify((await tx.get(ref)).data()); campaign.updatedAt = new Date().toISOString(); tx.set(campaignRef(campaign.id), campaign); }); }
    };
    try {
        return await operation(lock);
    }
    finally {
        await db.runTransaction(async (tx) => {
            if ((await tx.get(ref)).data()?.owner === owner)
                tx.delete(ref);
        }).catch(() => undefined);
    }
}
export async function discover(settings: SocialSettings, lock: WorkerLock) {
    if (!settings.activatedAt)
        return { scanned: 0, queued: 0, baseline: false };
    const db = getFirebaseAdminFirestore();
    const baseline = !settings.baselineComplete;
    // An acknowledged marker, not a moving timestamp cursor: late sync commits
    // cannot fall behind the cursor and disappear from discovery.
    let query = baseline ? db.collection("listings").where("createdAt", "<=", settings.activatedAt).orderBy("createdAt").orderBy(FieldPath.documentId()) : db.collection("listings").where("socialDiscoveryPendingAt", ">", "").orderBy("socialDiscoveryPendingAt").orderBy(FieldPath.documentId());
    const cursor = baseline ? settings.baselineCursor : null;
    if (cursor)
        query = query.startAfter(...cursor);
    if (baseline) {
        const rows = await query.select("listingId", "createdAt").limit(400).get();
        await lock.check();
        const batch = db.batch();
        for (const row of rows.docs) {
            const listingId = row.get("listingId") || row.id;
            batch.set(db.collection("socialActivationExclusions").doc(campaignId(listingId)), { listingId, activatedAt: settings.activatedAt });
        }
        const last = rows.docs.at(-1);
        batch.set(settingsRef(), { baselineComplete: rows.size < 400, ...(last ? { baselineCursor: [last.get("createdAt"), last.id] } : {}) }, { merge: true });
        await batch.commit();
        return { scanned: rows.size, queued: 0, baseline: true };
    }
    const rows = await query.limit(40).get();
    let queued = 0, missingOffice = 0;
    for (const row of rows.docs) {
        const listing = row.data() as SocialListing;
        const id = campaignId(listing.listingId || row.id);
        const exclusion = db.collection("socialActivationExclusions").doc(id);
        const acknowledge = async () => { await lock.check(); await db.collection("listings").doc(row.id).update({ socialDiscoveryPendingAt: FieldValue.delete() }); };
        if (!listing.socialDiscoveredAt || listing.socialDiscoveredAt <= settings.activatedAt || eligibilityReason(listing)) {
            if (!listing.listingOfficeName)
                missingOffice++;
            await acknowledge();
            continue;
        }
        if ((await exclusion.get()).exists) {
            await acknowledge();
            continue;
        }
        const ref = campaignRef(id);
        if ((await ref.get()).exists) {
            await acknowledge();
            continue;
        }
        const now = new Date().toISOString();
        const campaign = newCampaign({ ...listing, listingId: listing.listingId || row.id }, now, false);
        await lock.check();
        // Deterministic document ID + create precondition is the uniqueness constraint.
        try {
            await ref.create(campaign);
            if (!baseline)
                queued++;
        }
        catch (error) {
            if ((error as {
                code?: number;
            }).code !== 6)
                throw error;
        }
        await acknowledge();
    }
    if (missingOffice)
        console.info("[social] discovery exclusions", { missingOffice, scanned: rows.size });
    return { scanned: rows.size, queued, baseline };
}
export async function reserveSchedule(campaign: SocialCampaign, settings: SocialSettings, lock: WorkerLock) {
    const db = getFirebaseAdminFirestore(), ref = db.collection("settings").doc("socialSchedule");
    await lock.check();
    await db.runTransaction(async (tx) => {
        const old = (await tx.get(ref)).data() || {};
        const counts = (old.counts || {}) as Record<string, number>;
        const date = nextSlot(new Date(), old.last || null, counts, settings);
        const day = torontoParts(new Date(date)).day;
        const today = torontoParts(new Date()).day;
        const retained = Object.fromEntries(Object.entries(counts).filter(([key]) => key >= today));
        retained[day] = (retained[day] || 0) + 1;
        campaign.scheduledAt = date;
        campaign.nextAttemptAt = date;
        campaign.state = "scheduled";
        tx.set(ref, { last: date, counts: retained });
        tx.set(campaignRef(campaign.id), campaign);
    });
}
export class DeferredPublication extends Error {
    constructor(public readonly until: string) { super("Waiting for the next permitted publishing slot."); }
}
export async function reserveActualPublication(campaign: SocialCampaign, settings: SocialSettings, lock: WorkerLock) {
    const db = getFirebaseAdminFirestore(), ref = db.collection("settings").doc("socialDispatch");
    await lock.check();
    const now = new Date(), local = torontoParts(now);
    await db.runTransaction(async (tx) => {
        const old = (await tx.get(ref)).data() || {};
        const campaigns: string[] = old.day === local.day ? old.campaigns || [] : [];
        const same = campaigns.includes(campaign.id);
        const counts = { [local.day]: campaigns.length };
        const slot = nextSlot(now, same ? null : old.last || null, same ? {} : counts, settings);
        // nextSlot rounds to the next minute. Current minute is acceptable.
        if (Date.parse(slot) > now.getTime() + 60000)
            throw new DeferredPublication(slot);
        if (!same)
            tx.set(ref, { day: local.day, campaigns: [...campaigns, campaign.id], last: now.toISOString() });
    });
}
