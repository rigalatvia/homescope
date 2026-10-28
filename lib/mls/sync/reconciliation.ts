import { createHash } from "node:crypto";
import { FieldPath } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { listingReadCache, recordReads, recordListingChanges, writeSyncDocuments } from "@/lib/mls/sync/execution";

export class IncompleteReconciliationError extends Error {}

function pages(mode: string, source: string) {
  const key = createHash("sha256").update(`${mode}:${source}`).digest("hex");
  return getFirebaseAdminFirestore().collection("settings").doc(`mlsSeen-${key}`).collection("pages");
}

export async function hasReconciliationManifest(mode: string, source: string, sweep: string | null) {
  if (!sweep) return false;
  const snap = await pages(mode, source).doc("1").get(); recordReads(1);
  return snap.data()?.sweep === sweep;
}

// One small document per API page instead of a timestamp write to each listing.
// Fixed page IDs bound storage to the largest sweep; sweep markers isolate retries.
export async function recordReconciliationPage(mode: string, source: string, sweep: string, page: number, ids: string[], fetched: number) {
  await writeSyncDocuments([{ ref: pages(mode, source).doc(String(page)), data: { sweep, ids, fetched } }]);
}

export async function reconcileMissing(mode: string, source: string, sweep: string, lastPage: number): Promise<number> {
  const db = getFirebaseAdminFirestore();
  const seen = new Set<string>();
  let fetched = 0;
  for (let offset = 1; offset <= lastPage; offset += 100) {
    const refs = Array.from({ length: Math.min(100, lastPage - offset + 1) }, (_, i) => pages(mode, source).doc(String(offset + i)));
    const snapshots = await db.getAll(...refs); recordReads(snapshots.length);
    for (const snap of snapshots) {
      const data = snap.data();
      if (!data || data.sweep !== sweep || !Array.isArray(data.ids)) {
        // An old cursor, interrupted page, or missing manifest is never proof of removal.
        throw new IncompleteReconciliationError("Incomplete MLS reconciliation manifest; restart this sweep from page 1.");
      }
      data.ids.forEach((id: string) => seen.add(id)); fetched += data.fetched;
    }
  }
  if (!fetched || !seen.size) throw new Error("Empty MLS reconciliation; refusing to hide inventory.");
  let query = db.collection("listings").where("sourceSystem", "==", source).where("isVisible", "==", true)
    .orderBy(FieldPath.documentId()).select("listingId", "isVisible", "updatedAt").limit(400);
  let hidden = 0;
  while (true) {
    const candidates = await query.get();
    recordReads(Math.max(1, candidates.size));
    const missing = candidates.docs.filter(doc => doc.data().isVisible && !seen.has(doc.id)
      // A manual/incremental update after this sweep started must survive it.
      && (!doc.data().updatedAt || doc.data().updatedAt < sweep));
    const now = new Date().toISOString();
    await writeSyncDocuments(missing.map(doc => ({ ref: doc.ref, data: {
      isVisible: false, hiddenReason: "connector_not_returned", updatedAt: now
    } })), committed => {
      recordListingChanges({ hidden: committed.length });
      for (const item of committed) listingReadCache()?.delete(item.ref.id);
    });
    hidden += missing.length;
    if (candidates.size < 400) break;
    query = query.startAfter(candidates.docs[candidates.docs.length - 1]);
  }
  return hidden;
}
