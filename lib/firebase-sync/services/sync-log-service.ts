import { randomUUID } from "node:crypto";
import type { FirestoreSyncRepository } from "@/lib/firebase-sync/firestore/repository";
import type { FeedSourceSystem, SyncJobDocument, SyncMode } from "@/types/firebase-sync";

export function createRunningSyncJob(mode: SyncMode, sourceSystem: FeedSourceSystem, nowIso: string): SyncJobDocument {
  return {
    id: randomUUID(),
    mode,
    status: "running",
    startedAt: nowIso,
    finishedAt: null,
    sourceSystem,
    stats: {
      received: 0,
      normalized: 0,
      upserted: 0,
      hidden: 0,
      snapshotsWritten: 0,
      unchanged: 0,
      failed: 0
    },
    errorSummary: null
  };
}

export async function startSyncJob(repository: FirestoreSyncRepository, job: SyncJobDocument): Promise<void> {
  await repository.createSyncJob(job);
}

export async function completeSyncJob(
  repository: FirestoreSyncRepository,
  params: { jobId: string; finishedAt: string; stats: SyncJobDocument["stats"] }
): Promise<void> {
  await repository.updateSyncJob(params.jobId, {
    status: "completed",
    finishedAt: params.finishedAt,
    stats: params.stats
  });
}

export async function failSyncJob(
  repository: FirestoreSyncRepository,
  params: { jobId: string; finishedAt: string; stats: SyncJobDocument["stats"]; errorSummary: string }
): Promise<void> {
  await repository.updateSyncJob(params.jobId, {
    status: "failed",
    finishedAt: params.finishedAt,
    stats: params.stats,
    errorSummary: params.errorSummary
  });
}
