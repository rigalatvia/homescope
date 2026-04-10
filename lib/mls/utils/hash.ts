import { createHash } from "node:crypto";
import type { RawMLSFeedListing } from "@/lib/mls/types";

export function computeRawListingHash(raw: RawMLSFeedListing): string {
  const stable = JSON.stringify(raw);
  return createHash("sha256").update(stable).digest("hex");
}
