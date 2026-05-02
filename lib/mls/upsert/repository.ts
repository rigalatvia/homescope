import { randomUUID } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type {
  MLSHiddenReason,
  MLSListingFirestoreDocument,
  MLSListingSnapshotDocument,
  MLSListingStatus,
  MLSMunicipality
} from "@/lib/mls/types";

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

export async function deleteListingDocument(listingId: string): Promise<void> {
  const firestore = getFirebaseAdminFirestore();
  await firestore.collection(COLLECTIONS.listings).doc(listingId).delete();
}

export async function deleteExistingListingDocuments(listingIds: string[]): Promise<number> {
  const firestore = getFirebaseAdminFirestore();
  const uniqueIds = Array.from(new Set(listingIds.filter(Boolean)));
  if (uniqueIds.length === 0) return 0;

  let deleted = 0;
  const chunkSize = 250;

  for (let i = 0; i < uniqueIds.length; i += chunkSize) {
    const chunk = uniqueIds.slice(i, i + chunkSize);
    const refs = chunk.map((listingId) => firestore.collection(COLLECTIONS.listings).doc(listingId));
    const snapshots = await firestore.getAll(...refs);
    const existing = snapshots.filter((snapshot) => snapshot.exists);
    if (existing.length === 0) continue;

    const batch = firestore.batch();
    for (const snapshot of existing) {
      batch.delete(snapshot.ref);
    }
    await batch.commit();
    deleted += existing.length;
  }

  return deleted;
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

export async function listListingsNotSeenSince(staleBeforeIso: string): Promise<MLSListingFirestoreDocument[]> {
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore
    .collection(COLLECTIONS.listings)
    .where("lastSeenInSourceAt", "<", staleBeforeIso)
    .get();

  return snapshot.docs.map((doc) => doc.data() as MLSListingFirestoreDocument);
}

export async function listListingsByMunicipality(
  municipality: MLSMunicipality
): Promise<MLSListingFirestoreDocument[]> {
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore.collection(COLLECTIONS.listings).where("municipality", "==", municipality).get();
  return snapshot.docs.map((doc) => doc.data() as MLSListingFirestoreDocument);
}

export async function listHiddenListings(): Promise<MLSListingFirestoreDocument[]> {
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore.collection(COLLECTIONS.listings).where("isVisible", "==", false).get();
  return snapshot.docs.map((doc) => doc.data() as MLSListingFirestoreDocument);
}

export async function listListingsWithStatuses(
  statuses: MLSListingStatus[]
): Promise<MLSListingFirestoreDocument[]> {
  const uniqueStatuses = Array.from(new Set(statuses.filter(Boolean)));
  if (uniqueStatuses.length === 0) return [];

  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore.collection(COLLECTIONS.listings).where("status", "in", uniqueStatuses).get();
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
