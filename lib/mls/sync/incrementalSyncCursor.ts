import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";

const SETTINGS_COLLECTION = "settings";
const INCREMENTAL_CURSOR_DOC_ID = "mlsIncrementalCursor";
const DEFAULT_LOOKBACK_MS = 24 * 60 * 60 * 1000;

interface IncrementalCursorDocument {
  sinceIso?: string;
  nextPage?: number;
  nextCursor?: string | null;
  sweepStartedAt?: string | null;
  updatedAt?: string;
}

const DEFAULT_START_PAGE = 1;

export async function getIncrementalSyncSince(defaultLookbackMs: number = DEFAULT_LOOKBACK_MS): Promise<Date> {
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore.collection(SETTINGS_COLLECTION).doc(INCREMENTAL_CURSOR_DOC_ID).get();

  if (!snapshot.exists) {
    return new Date(Date.now() - defaultLookbackMs);
  }

  const data = snapshot.data() as IncrementalCursorDocument;
  const raw = data?.sinceIso;
  if (!raw) {
    return new Date(Date.now() - defaultLookbackMs);
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(Date.now() - defaultLookbackMs);
  }

  return parsed;
}

export async function setIncrementalSyncSince(sinceIso: string): Promise<void> {
  const parsed = new Date(sinceIso);
  const safeIso = Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();

  const firestore = getFirebaseAdminFirestore();
  await firestore.collection(SETTINGS_COLLECTION).doc(INCREMENTAL_CURSOR_DOC_ID).set(
    {
      sinceIso: safeIso,
      updatedAt: new Date().toISOString(),
      updatedAtServer: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

export function getDefaultIncrementalStartPage(): number {
  return DEFAULT_START_PAGE;
}

export async function getIncrementalStartPage(): Promise<number> {
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore.collection(SETTINGS_COLLECTION).doc(INCREMENTAL_CURSOR_DOC_ID).get();
  if (!snapshot.exists) return DEFAULT_START_PAGE;

  const data = snapshot.data() as IncrementalCursorDocument;
  const nextPage = Number(data.nextPage ?? DEFAULT_START_PAGE);
  if (!Number.isFinite(nextPage) || nextPage < DEFAULT_START_PAGE) return DEFAULT_START_PAGE;
  return Math.floor(nextPage);
}

export async function setIncrementalStartPage(nextPage: number): Promise<void> {
  const safePage = Number.isFinite(nextPage) && nextPage >= DEFAULT_START_PAGE ? Math.floor(nextPage) : DEFAULT_START_PAGE;
  const firestore = getFirebaseAdminFirestore();
  await firestore.collection(SETTINGS_COLLECTION).doc(INCREMENTAL_CURSOR_DOC_ID).set(
    {
      nextPage: safePage,
      updatedAt: new Date().toISOString(),
      updatedAtServer: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

export async function getIncrementalNextCursor(): Promise<string | null> {
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore.collection(SETTINGS_COLLECTION).doc(INCREMENTAL_CURSOR_DOC_ID).get();
  if (!snapshot.exists) return null;

  const data = snapshot.data() as IncrementalCursorDocument;
  return typeof data.nextCursor === "string" && data.nextCursor.trim() ? data.nextCursor : null;
}

export async function setIncrementalNextCursor(nextCursor: string | null): Promise<void> {
  const firestore = getFirebaseAdminFirestore();
  await firestore.collection(SETTINGS_COLLECTION).doc(INCREMENTAL_CURSOR_DOC_ID).set(
    {
      nextCursor,
      updatedAt: new Date().toISOString(),
      updatedAtServer: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

export async function getIncrementalSweepStartedAt(): Promise<string | null> {
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore.collection(SETTINGS_COLLECTION).doc(INCREMENTAL_CURSOR_DOC_ID).get();
  if (!snapshot.exists) return null;

  const data = snapshot.data() as IncrementalCursorDocument;
  return typeof data.sweepStartedAt === "string" && data.sweepStartedAt.trim() ? data.sweepStartedAt : null;
}

export async function setIncrementalSweepStartedAt(sweepStartedAt: string | null): Promise<void> {
  const firestore = getFirebaseAdminFirestore();
  await firestore.collection(SETTINGS_COLLECTION).doc(INCREMENTAL_CURSOR_DOC_ID).set(
    {
      sweepStartedAt,
      updatedAt: new Date().toISOString(),
      updatedAtServer: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}
