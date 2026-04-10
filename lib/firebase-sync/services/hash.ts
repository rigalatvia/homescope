import { createHash } from "node:crypto";
import type { RawFeedListingPayload } from "@/types/firebase-sync";

export function computeRawSourceHash(raw: RawFeedListingPayload): string {
  const stable = JSON.stringify(raw, Object.keys(raw).sort());
  return createHash("sha256").update(stable).digest("hex");
}
