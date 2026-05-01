import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";

const SETTINGS_COLLECTION = "settings";
const FULL_SYNC_CURSOR_DOC_ID = "mlsFullSyncCursor";
const DEFAULT_START_PAGE = 1;

interface FullSyncCursorDocument {
  nextPage?: number;
  updatedAt?: string;
  sweepStartedAt?: string | null;
}

export async function getFullSyncStartPage(): Promise<number> {
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore.collection(SETTINGS_COLLECTION).doc(FULL_SYNC_CURSOR_DOC_ID).get();
  if (!snapshot.exists) return DEFAULT_START_PAGE;

  const data = snapshot.data() as FullSyncCursorDocument;
  const nextPage = Number(data.nextPage ?? DEFAULT_START_PAGE);
  if (!Number.isFinite(nextPage) || nextPage < DEFAULT_START_PAGE) return DEFAULT_START_PAGE;
  return Math.floor(nextPage);
}

export async function setFullSyncStartPage(nextPage: number): Promise<void> {
  const safePage = Number.isFinite(nextPage) && nextPage >= DEFAULT_START_PAGE ? Math.floor(nextPage) : DEFAULT_START_PAGE;
  const firestore = getFirebaseAdminFirestore();
  await firestore.collection(SETTINGS_COLLECTION).doc(FULL_SYNC_CURSOR_DOC_ID).set(
    {
      nextPage: safePage,
      updatedAt: new Date().toISOString(),
      updatedAtServer: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

export function getDefaultFullSyncStartPage(): number {
  return DEFAULT_START_PAGE;
}

export async function getFullSyncSweepStartedAt(): Promise<string | null> {
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore.collection(SETTINGS_COLLECTION).doc(FULL_SYNC_CURSOR_DOC_ID).get();
  if (!snapshot.exists) return null;

  const data = snapshot.data() as FullSyncCursorDocument;
  return typeof data.sweepStartedAt === "string" && data.sweepStartedAt.trim() ? data.sweepStartedAt : null;
}

export async function setFullSyncSweepStartedAt(sweepStartedAt: string | null): Promise<void> {
  const firestore = getFirebaseAdminFirestore();
  await firestore.collection(SETTINGS_COLLECTION).doc(FULL_SYNC_CURSOR_DOC_ID).set(
    {
      sweepStartedAt,
      updatedAt: new Date().toISOString(),
      updatedAtServer: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}
