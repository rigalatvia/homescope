import { MockApprovedFeedConnector } from "@/lib/firebase-sync/connectors/mock-approved-feed-connector";
import { createFirebaseAdminSyncRepository } from "@/lib/firebase-sync/firestore/firebase-admin-repository";
import { runListingSync, runStaleCleanup } from "@/lib/firebase-sync/services/sync-runner";

export async function runScheduledFullSync(): Promise<void> {
  const repository = createFirebaseAdminSyncRepository();
  const connector = new MockApprovedFeedConnector();
  await runListingSync({
    mode: "full",
    repository,
    connector
  });
}

export async function runScheduledIncrementalSync(): Promise<void> {
  const repository = createFirebaseAdminSyncRepository();
  const connector = new MockApprovedFeedConnector();
  const sinceIso = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  await runListingSync({
    mode: "incremental",
    repository,
    connector,
    since: sinceIso
  });
}

export async function runScheduledStaleCleanup(): Promise<void> {
  const repository = createFirebaseAdminSyncRepository();
  const staleBeforeIso = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  await runStaleCleanup({
    repository,
    staleBeforeIso
  });
}
