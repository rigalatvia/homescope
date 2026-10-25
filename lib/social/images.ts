import sharp from "sharp";
import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { request } from "node:https";
export function allowedPhotoUrl(value: string, hosts: string[]): URL {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || !hosts.includes(url.hostname.toLowerCase()))
        throw new Error("Photo host is not configured for social downloads.");
    return url;
}
function publicIPv4(address: string) {
    const [a, b] = address.split(".").map(Number);
    return a > 0 && a < 224 && a !== 10 && a !== 127 && !(a === 169 && b === 254) && !(a === 172 && b >= 16 && b <= 31) && !(a === 192 && b === 168) && !(a === 100 && b >= 64 && b <= 127) && !(a === 198 && (b === 18 || b === 19));
}
export async function downloadPhoto(value: string, hosts: string[], redirects = 0): Promise<Buffer> {
    const url = allowedPhotoUrl(value, hosts);
    const addresses = await lookup(url.hostname, { all: true, family: 4 });
    if (!addresses.length || addresses.some(a => !publicIPv4(a.address)))
        throw new Error("Photo address is not public.");
    // Pin the validated address to prevent DNS rebinding; TLS still verifies hostname.
    return new Promise((resolve, reject) => {
        const req = request(url, { lookup: (_hostname, options, callback) => {
                if (options.all)
                    callback(null, [addresses[0]]);
                else
                    callback(null, addresses[0].address, 4);
            } }, response => {
            if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                response.resume();
                if (redirects >= 3)
                    return reject(new Error("Photo redirect limit exceeded."));
                downloadPhoto(new URL(response.headers.location, url).toString(), hosts, redirects + 1).then(resolve, reject);
                return;
            }
            if (response.statusCode !== 200 || !/^image\/(jpeg|png|webp)/i.test(response.headers["content-type"] || "")) {
                response.resume();
                reject(new Error("Photo unavailable or unsupported."));
                return;
            }
            const chunks: Buffer[] = [];
            let size = 0;
            response.on("data", (chunk: Buffer) => {
                size += chunk.length;
                if (size > 15 * 1024 * 1024)
                    req.destroy(new Error("Photo exceeds download limit."));
                else
                    chunks.push(chunk);
            });
            response.on("end", () => resolve(Buffer.concat(chunks)));
            response.on("error", () => reject(new Error("Photo download failed.")));
        });
        const deadline = setTimeout(() => req.destroy(new Error("Photo download timed out.")), 15000);
        req.on("close", () => clearTimeout(deadline));
        req.on("error", () => reject(new Error("Photo download failed.")));
        req.end();
    });
}
export async function selectPhotos(urls: string[], load: (url: string) => Promise<Buffer> = url => downloadPhoto(url, (process.env.SOCIAL_PHOTO_HOSTS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean))): Promise<Buffer[]> {
    const selected: Buffer[] = [];
    const hashes = new Set<string>();
    for (const url of [...new Set(urls)].slice(0, 12)) {
        try {
            const input = await load(url);
            const metadata = await sharp(input, { limitInputPixels: 40000000 }).metadata();
            if (!metadata.width || !metadata.height || Math.max(metadata.width, metadata.height) < 1000 || Math.min(metadata.width, metadata.height) < 600)
                continue;
            const normalized = await sharp(input, { limitInputPixels: 40000000 }).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 92 }).toBuffer();
            const hash = createHash("sha256").update(await sharp(normalized).resize(64, 64, { fit: "fill" }).raw().toBuffer()).digest("hex");
            if (hashes.has(hash))
                continue;
            hashes.add(hash);
            selected.push(normalized);
            if (selected.length === 6)
                break;
        }
        catch { /* A broken source photo must not prevent selecting the remaining feed photos. */ }
    }
    if (selected.length < 2)
        throw new Error("Fewer than two accessible, distinct high-resolution photos. Check source images and SOCIAL_PHOTO_HOSTS.");
    return selected;
}
