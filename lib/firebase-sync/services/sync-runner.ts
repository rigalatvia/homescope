import type { ListingFeedConnector } from "@/lib/firebase-sync/connectors/feed-connector";
import type { FirestoreSyncRepository } from "@/lib/firebase-sync/firestore/repository";
import { toSyncError } from "@/lib/firebase-sync/services/errors";
import { cleanupStaleListings, hideMissingListings } from "@/lib/firebase-sync/services/hide-service";
import { normalizeRawListing } from "@/lib/firebase-sync/services/normalizer";
import {
  completeSyncJob,
  createRunningSyncJob,
  failSyncJob,
  startSyncJob
} from "@/lib/firebase-sync/services/sync-log-service";
import { upsertNormalizedListings } from "@/lib/firebase-sync/services/upsert-service";
import type { SyncContext, SyncMode } from "@/types/firebase-sync";

export async function runListingSync(params: {
  mode: Extract<SyncMode, "full" | "incremental">;
  repository: FirestoreSyncRepository;
  connector: ListingFeedConnector;
  since?: string;
}): Promise<{ jobId: string; stats: ReturnType<typeof emptyStats> }> {
  const context: SyncContext = {
    mode: params.mode,
    sourceSystem: params.connector.sourceSystem,
    nowIso: new Date().toISOString()
  };

  const job = createRunningSyncJob(context.mode, context.sourceSystem, context.nowIso);
  const stats = emptyStats();
  await startSyncJob(params.repository, job);

  try {
    const raw =
      params.mode === "full"
        ? await params.connector.fetchFull()
        : await params.connector.fetchIncremental({ since: params.since });

    stats.received = raw.length;
    const normalized = raw.map((item) => normalizeRawListing(item, context.nowIso));
    stats.normalized = normalized.length;

    const upsert = await upsertNormalizedListings({
      repository: params.repository,
      listings: normalized,
      nowIso: context.nowIso
    });

    stats.upserted = upsert.upserted;
    stats.unchanged = upsert.unchanged;
    stats.snapshotsWritten = upsert.snapshotsWritten;

    if (params.mode === "full") {
      const seenSourceKeys = new Set(normalized.map((item) => item.sourceListingKey));
      stats.hidden = await hideMissingListings({
        repository: params.repository,
        seenSourceKeys,
        nowIso: context.nowIso
      });
    }

    await completeSyncJob(params.repository, {
      jobId: job.id,
      finishedAt: new Date().toISOString(),
      stats
    });

    return { jobId: job.id, stats };
  } catch (error) {
    stats.failed += 1;
    const syncError = toSyncError(error, "SYNC_RUNNER_ERROR");
    await failSyncJob(params.repository, {
      jobId: job.id,
      finishedAt: new Date().toISOString(),
      stats,
      errorSummary: syncError.message
    });
    throw error;
  }
}

export async function runStaleCleanup(params: {
  repository: FirestoreSyncRepository;
  staleBeforeIso: string;
}): Promise<{ hidden: number }> {
  const hidden = await cleanupStaleListings({
    repository: params.repository,
    staleBeforeIso: params.staleBeforeIso,
    nowIso: new Date().toISOString()
  });

  return { hidden };
}

function emptyStats() {
  return {
    received: 0,
    normalized: 0,
    upserted: 0,
    hidden: 0,
    snapshotsWritten: 0,
    unchanged: 0,
    failed: 0
  };
}
