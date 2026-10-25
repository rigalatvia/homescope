import { randomUUID } from "node:crypto";
import { getFirebaseAdminStorage } from "@/lib/firebase/admin";
import type { SocialCampaign } from "./types";
export async function storeCarousel(campaign: SocialCampaign, slides: Buffer[]) {
    const bucket = getFirebaseAdminStorage().bucket();
    const urls: string[] = [], paths: string[] = [];
    for (let i = 0; i < slides.length; i++) {
        const objectPath = `social/${campaign.id}/navy-editorial-v1/slide-${i + 1}.jpg`;
        const token = randomUUID();
        await bucket.file(objectPath).save(slides[i], { resumable: false, metadata: { contentType: "image/jpeg", cacheControl: "public,max-age=300", metadata: { firebaseStorageDownloadTokens: token } } });
        paths.push(objectPath);
        urls.push(`https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket.name)}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`);
    }
    return { urls, paths };
}
