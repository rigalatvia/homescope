import type { FirestoreSyncRepository } from "@/lib/firebase-sync/firestore/repository";

/**
 * Adapter placeholder for a real Firestore Admin SDK repository.
 * Integrate here once firebase-admin credentials and project wiring are ready.
 */
export function createFirebaseAdminSyncRepository(): FirestoreSyncRepository {
  throw new Error(
    "createFirebaseAdminSyncRepository is not implemented. Wire firebase-admin here for project HomeScope."
  );
}
