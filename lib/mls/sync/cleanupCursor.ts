import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";

const SETTINGS_COLLECTION = "settings";
const CLEANUP_CURSOR_DOC_ID = "mlsCleanupCursor";
const DEFAULT_START_PAGE = 1;

interface CleanupCursorDocument {
  nextPage?: number;
  nextCursor?: string | null;
  updatedAt?: string;
  sweepStartedAt?: string | null;
}

export function getDefaultCleanupStartPage(): number {
  return DEFAULT_START_PAGE;
}

export async function getCleanupStartPage(): Promise<number> {
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore.collection(SETTINGS_COLLECTION).doc(CLEANUP_CURSOR_DOC_ID).get();
  if (!snapshot.exists) return DEFAULT_START_PAGE;

  const data = snapshot.data() as CleanupCursorDocument;
  const nextPage = Number(data.nextPage ?? DEFAULT_START_PAGE);
  if (!Number.isFinite(nextPage) || nextPage < DEFAULT_START_PAGE) return DEFAULT_START_PAGE;
  return Math.floor(nextPage);
}

export async function setCleanupStartPage(nextPage: number): Promise<void> {
  const safePage = Number.isFinite(nextPage) && nextPage >= DEFAULT_START_PAGE ? Math.floor(nextPage) : DEFAULT_START_PAGE;
  const firestore = getFirebaseAdminFirestore();
  await firestore.collection(SETTINGS_COLLECTION).doc(CLEANUP_CURSOR_DOC_ID).set(
    {
      nextPage: safePage,
      updatedAt: new Date().toISOString(),
      updatedAtServer: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

export async function getCleanupNextCursor(): Promise<string | null> {
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore.collection(SETTINGS_COLLECTION).doc(CLEANUP_CURSOR_DOC_ID).get();
  if (!snapshot.exists) return null;

  const data = snapshot.data() as CleanupCursorDocument;
  return typeof data.nextCursor === "string" && data.nextCursor.trim() ? data.nextCursor : null;
}

export async function setCleanupNextCursor(nextCursor: string | null): Promise<void> {
  const firestore = getFirebaseAdminFirestore();
  await firestore.collection(SETTINGS_COLLECTION).doc(CLEANUP_CURSOR_DOC_ID).set(
    {
      nextCursor,
      updatedAt: new Date().toISOString(),
      updatedAtServer: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

export async function getCleanupSweepStartedAt(): Promise<string | null> {
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore.collection(SETTINGS_COLLECTION).doc(CLEANUP_CURSOR_DOC_ID).get();
  if (!snapshot.exists) return null;

  const data = snapshot.data() as CleanupCursorDocument;
  return typeof data.sweepStartedAt === "string" && data.sweepStartedAt.trim() ? data.sweepStartedAt : null;
}

export async function setCleanupSweepStartedAt(sweepStartedAt: string | null): Promise<void> {
  const firestore = getFirebaseAdminFirestore();
  await firestore.collection(SETTINGS_COLLECTION).doc(CLEANUP_CURSOR_DOC_ID).set(
    {
      sweepStartedAt,
      updatedAt: new Date().toISOString(),
      updatedAtServer: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}
