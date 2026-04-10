import { randomUUID } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type { MLSHiddenReason, MLSListingFirestoreDocument, MLSListingSnapshotDocument } from "@/lib/mls/types";

const COLLECTIONS = {
  listings: "listings",
  listingSnapshots: "listingSnapshots"
} as const;

export async function getListingById(listingId: string): Promise<MLSListingFirestoreDocument | null> {
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore.collection(COLLECTIONS.listings).doc(listingId).get();
  if (!snapshot.exists) return null;
  return snapshot.data() as MLSListingFirestoreDocument;
}

export async function upsertListingDocument(doc: MLSListingFirestoreDocument): Promise<void> {
  const firestore = getFirebaseAdminFirestore();
  await firestore.collection(COLLECTIONS.listings).doc(doc.listingId).set(
    {
      ...doc,
      updatedAtServer: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

export async function hideListingDocument(listingId: string, hiddenReason: MLSHiddenReason, nowIso: string): Promise<void> {
  const firestore = getFirebaseAdminFirestore();
  await firestore.collection(COLLECTIONS.listings).doc(listingId).set(
    {
      isVisible: false,
      hiddenReason,
      syncedAt: nowIso,
      updatedAt: nowIso,
      updatedAtServer: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

export async function listAllListingIds(): Promise<string[]> {
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore.collection(COLLECTIONS.listings).select().get();
  return snapshot.docs.map((doc) => doc.id);
}

export async function listStaleVisibleListings(staleBeforeIso: string): Promise<MLSListingFirestoreDocument[]> {
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore
    .collection(COLLECTIONS.listings)
    .where("isVisible", "==", true)
    .where("lastSeenInSourceAt", "<", staleBeforeIso)
    .get();

  return snapshot.docs.map((doc) => doc.data() as MLSListingFirestoreDocument);
}

export async function createListingSnapshot(
  listingId: string,
  sourceListingKey: string,
  changedFields: string[],
  before: Partial<MLSListingFirestoreDocument> | null,
  after: Partial<MLSListingFirestoreDocument>,
  reason: MLSListingSnapshotDocument["reason"],
  capturedAt: string
): Promise<void> {
  const firestore = getFirebaseAdminFirestore();
  const snapshotDoc: MLSListingSnapshotDocument = {
    snapshotId: randomUUID(),
    listingId,
    sourceListingKey,
    capturedAt,
    changedFields,
    before,
    after,
    reason
  };

  await firestore.collection(COLLECTIONS.listingSnapshots).doc(snapshotDoc.snapshotId).set(snapshotDoc);
}
