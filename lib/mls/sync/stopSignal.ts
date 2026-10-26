import { recordReads, recordWrites } from "@/lib/mls/sync/execution";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";

const SETTINGS_COLLECTION = "settings";
const STOP_SIGNAL_DOC_ID = "mlsStopSignal";

interface StopSignalDocument {
  requested: boolean;
  requestedAt?: string | null;
  clearedAt?: string | null;
}

export async function requestMLSSyncStop(): Promise<void> {
  const firestore = getFirebaseAdminFirestore();
  await firestore.collection(SETTINGS_COLLECTION).doc(STOP_SIGNAL_DOC_ID).set(
    {
      requested: true,
      requestedAt: new Date().toISOString()
    } satisfies StopSignalDocument,
    { merge: true }
  );
  recordWrites(1);
}

export async function clearMLSSyncStop(): Promise<void> {
  const firestore = getFirebaseAdminFirestore();
  await firestore.collection(SETTINGS_COLLECTION).doc(STOP_SIGNAL_DOC_ID).set(
    {
      requested: false,
      clearedAt: new Date().toISOString()
    } satisfies StopSignalDocument,
    { merge: true }
  );
  recordWrites(1);
}

export async function isMLSSyncStopRequested(): Promise<boolean> {
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore.collection(SETTINGS_COLLECTION).doc(STOP_SIGNAL_DOC_ID).get();
  recordReads(1);
  if (!snapshot.exists) return false;
  const data = snapshot.data() as StopSignalDocument | undefined;
  return data?.requested === true;
}
