import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";

const SETTINGS_COLLECTION = "settings";
const INCREMENTAL_CURSOR_DOC_ID = "mlsIncrementalCursor";
const DEFAULT_LOOKBACK_MS = 24 * 60 * 60 * 1000;

interface IncrementalCursorDocument {
  sinceIso?: string;
  updatedAt?: string;
}

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
