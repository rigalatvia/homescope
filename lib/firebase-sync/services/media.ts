import type { RawFeedListingPayload } from "@/types/firebase-sync";

export function mapPublicImages(raw: RawFeedListingPayload): string[] {
  const items = raw.media ?? [];

  return items
    .filter((item) => !!item.url && (!item.type || item.type.toLowerCase() === "photo"))
    .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999))
    .map((item) => item.url!.trim())
    .filter((url, index, arr) => arr.indexOf(url) === index);
}
