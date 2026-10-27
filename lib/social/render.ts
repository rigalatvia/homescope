import sharp from "sharp";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { SocialListing } from "./types";
import { BRAND, facts, priceLabel } from "./policy";
const W = 1080, H = 1350;
function escape(value: string) { return value.replace(/[<>&"']/g, char => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[char]!)); }
function line(value: string, x: number, y: number, size: number, color = "#102337", family = "sans-serif", weight = "400") {
    return `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-family="${family}" font-weight="${weight}">${escape(value)}</text>`;
}
function wrap(value: string, max = 35): string[] {
    const words = value.trim().split(/\s+/);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
        if ((current + " " + word).trim().length > max && current) {
            lines.push(current);
            current = word;
        }
        else
            current = (current + " " + word).trim();
    }
    if (current)
        lines.push(current);
    return lines.slice(0, 3);
}
async function svg(content: string) {
    // Explicit font files avoid depending on fonts installed in the server image.
    const tags = [...content.matchAll(/<text x="(\d+)" y="(\d+)" font-size="(\d+)" fill="([^"]+)" font-family="[^"]+" font-weight="([^"]+)">([^<]*)<\/text>/g)];
    for (const match of tags) {
        const [, x, y, size, color, weight, text] = match;
        const { data, info } = await sharp({ text: {
            text: `<span foreground="${color}" weight="${weight}">${text}</span>`,
            font: `Noto Sans ${size}`,
            fontfile: path.join(process.cwd(), "public", "fonts", "NotoSans-Regular.ttf"),
            dpi: 72, rgba: true
        } }).png().toBuffer({ resolveWithObject: true });
        content = content.replace(match[0], `<image x="${x}" y="${Number(y) - Number(size)}" width="${info.width}" height="${info.height}" href="data:image/png;base64,${data.toString("base64")}"/>`);
    }
    return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="navy" x2="1" y2="1"><stop stop-color="#0a1c2e"/><stop offset="1" stop-color="#234b65"/></linearGradient></defs>${content}</svg>`);
}
export async function renderCarousel(listing: SocialListing, photos: Buffer[], logo?: Buffer): Promise<Buffer[]> {
    if (photos.length < 2)
        throw new Error("A carousel requires at least two distinct property images.");
    const logoInput = logo || await readFile(path.join(process.cwd(), "public", "logo-header.png"));
    const logoBuffer = await sharp(logoInput).resize({ width: 235, height: 135, fit: "inside" }).png().toBuffer();
    const city = listing.municipality || "GREATER TORONTO AREA";
    const titles = ["JUST LISTED", "YOUR NEXT HOME?", "STEP INSIDE", "THE DETAILS MATTER", "LOVE THE LOCATION", "PICTURE YOUR LIFE HERE"];
    const details = facts(listing);
    const output: Buffer[] = [];
    // Two photos yield two distinct photographic slides + editorial location + CTA.
    // Three+ photos produce 5–7 slides without reusing photographs.
    for (let i = 0; i < Math.min(photos.length, 6); i++) {
        const backdrop = await sharp(photos[i]).resize(W, 870, { fit: "cover" }).blur(35).modulate({ brightness: .42 }).toBuffer();
        const photo = await sharp(photos[i]).resize(1000, 790, { fit: "contain", background: "#112b3b" }).toBuffer();
        const subtitle = i === 0 ? priceLabel(listing) : i === 1 ? details.slice(0, 2).join("  ·  ") : i === 2 ? listing.propertyType || city : i === 3 ? details.slice(2).join(" · ") || listing.address.fullAddress || city : i === 4 ? listing.area || city : city;
        const content = `<rect width="1080" height="1350" fill="#f7f4ed"/><rect width="1080" height="870" fill="url(#navy)"/><rect x="0" y="846" width="1080" height="8" fill="#d4b66b"/>${line(city.toUpperCase(), 60, 920, 24, "#73603c", "sans-serif", "600")}${line(titles[i], 60, 990, 58, "#102337", "serif")}${wrap(subtitle, 38).map((s, n) => line(s, 60, 1050 + n * 44, i === 0 ? 42 : 30)).join("")}${line("HomeScopeGTA.ca", 60, 1205, 25)}${line(BRAND.brokerage, 60, 1300, 25, "#fff")}<rect x="0" y="1250" width="1080" height="100" fill="#102337"/>${line(BRAND.brokerage, 60, 1310, 25, "#fff")}`;
        const base = await sharp(await svg(content)).composite([{ input: backdrop, left: 0, top: 0 }, { input: photo, left: 40, top: 28 }, { input: await svg(`<rect x="790" y="1090" width="270" height="154" rx="14" fill="#fff"/>`) }, { input: logoBuffer, left: 808, top: 1100 }]).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
        output.push(base);
    }
    if (photos.length < 4) {
        output.push(await sharp(await svg(`<rect width="1080" height="1350" fill="url(#navy)"/><path d="M-100 900 L1100 280 M-100 960 L1100 340" stroke="#d4b66b" opacity=".15" stroke-width="2"/><rect x="75" y="100" width="270" height="160" rx="16" fill="#fff"/>${line("A PLACE TO CALL HOME", 75, 430, 25, "#d4b66b")}${line("Love the location.", 75, 530, 64, "#fff", "serif")}${wrap(city.toUpperCase(), 22).map((s, i) => line(s, 75, 690 + i * 70, 50, "#fff")).join("")}${wrap(listing.area && listing.area !== city ? listing.area : "Ontario", 38).map((s, i) => line(s, 75, 890 + i * 45, 32, "#e1e9ed")).join("")}${line("Explore the property — first comment", 75, 1110, 32, "#d4b66b")}${line(BRAND.brokerage, 75, 1270, 25, "#fff")}`)).composite([{ input: logoBuffer, left: 93, top: 112 }]).jpeg({ quality: 90 }).toBuffer());
    }
    output.push(await sharp(await svg(`<rect width="1080" height="1350" fill="url(#navy)"/><circle cx="1100" cy="100" r="620" stroke="#d4b66b" stroke-width="2" fill="none" opacity=".3"/><rect x="75" y="80" width="270" height="160" rx="16" fill="#fff"/>${line("LOVE THIS HOME?", 75, 420, 69, "#fff", "serif")}${line("Explore the full listing.", 75, 505, 42, "#fff", "serif")}${line("Book a private showing.", 75, 565, 42, "#fff", "serif")}<rect x="75" y="635" width="140" height="5" fill="#d4b66b"/>${line(BRAND.website, 75, 760, 59, "#d4b66b", "serif")}${line("Property link in the first comment", 75, 825, 32, "#fff")}${line("More homes at HomeScopeGTA.ca", 75, 880, 29, "#dce7ed")}${line(BRAND.agent, 75, 1060, 40, "#fff")}${line(BRAND.phone, 75, 1120, 39, "#d4b66b")}${line(BRAND.brokerage, 75, 1260, 28, "#fff")}`)).composite([{ input: logoBuffer, left: 93, top: 92 }]).jpeg({ quality: 90, mozjpeg: true }).toBuffer());
    return output;
}
