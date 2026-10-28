import { runIncrementalSync } from "@/lib/mls/sync/runIncrementalSync";
import { runStaleCleanup } from "@/lib/mls/sync/runStaleCleanup";
import { readCursor, writeCursor, withSyncLease, syncOperationCounts, setSyncDeadline } from "@/lib/mls/sync/execution";
import { ensureServerSecretsLoaded } from "@/lib/server/secret-manager";

export const MLS_DAILY_SCHEDULE = { cron: "0 4 * * *", timeZone: "America/Toronto" } as const;
const STATUS = "mlsSchedulerStatus";

export async function runDailyMLSSync() {
  await ensureServerSecretsLoaded();
  return withSyncLease(async () => {
    const startedAt = new Date().toISOString();
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: MLS_DAILY_SCHEDULE.timeZone }).format(new Date());
    const status = await readCursor(STATUS);
    if (status.completedDay === day) return { success: true, skipped: "already_completed_today", schedule: MLS_DAILY_SCHEDULE };
    const configuredSeconds = Number(process.env.MLS_SCHEDULED_SAFE_RUNTIME_SECONDS || 240);
    const budgetMs = Math.min(780, Math.max(30, Number.isFinite(configuredSeconds) ? configuredSeconds : 240)) * 1000;
    const deadline = Date.now() + budgetMs;
    setSyncDeadline(deadline);
    let incrementalComplete = status.incrementalCompletedDay === day;
    let cleanupComplete = false;
    let failure: unknown;
    try {
      // Preserve the previous incremental batch cap and runtime budget.
      // Partial responses continue the same daily job from its checkpoint.
      const configuredRuns = Number(process.env.MLS_SCHEDULED_INCREMENTAL_RUN_LIMIT || 20);
      const maxRuns = Number.isFinite(configuredRuns) ? Math.max(1, Math.floor(configuredRuns)) : 20;
      for (let run = 0; run < maxRuns && !incrementalComplete && Date.now() + 5000 < deadline; run++) {
        const result = await runIncrementalSync({ connectorKind: "ddf-treb" });
        incrementalComplete = result.complete === true;
        if (incrementalComplete) await writeCursor(STATUS, { incrementalCompletedDay: day });
        if (result.notes?.some(note => /stop requested/i.test(note))) break;
      }
      // As before the daily rewrite, run only ONE bounded cleanup batch.
      if (incrementalComplete && Date.now() + 5000 < deadline) {
        const result = await runStaleCleanup("ddf-treb", { maxPagesPerRun: 10, reconciliationOnly: true });
        cleanupComplete = result.complete === true;
      }
    } catch (error) { failure = error; }
    const complete = incrementalComplete && cleanupComplete && !failure;
    const measured = syncOperationCounts();
    const counts = { fetched: measured.retrieved ?? 0, filtered: measured.filtered ?? 0, created: measured.created ?? 0, updated: measured.changed ?? 0,
      unchanged: measured.unchanged ?? 0, hidden: measured.markedInactive ?? 0, failed: failure ? 1 : 0 };
    const finishedAt = new Date().toISOString();
    await writeCursor(STATUS, {
      lastRunAt: finishedAt, lastRunMode: "incremental+cleanup", lastRunStatus: complete ? "success" : failure ? "failed" : "partial",
      lastRunCounts: { ...counts, archived: counts.hidden, deleted: 0 },
      lastError: failure instanceof Error ? failure.message : null,
      lastNote: complete ? null : "Incomplete; checkpoint retained. Retry the same daily job.",
      ...(complete ? { completedDay: day, cleanupLastRunAt: finishedAt, cleanupLastRunStatus: "success" } : {})
    });
    console.info(JSON.stringify({ event: "mls_sync_daily_summary", startedAt, finishedAt, durationMs: Date.parse(finishedAt) - Date.parse(startedAt),
      complete, ...counts, ...syncOperationCounts() }));
    if (failure) throw failure;
    return { success: complete, partial: !complete, schedule: MLS_DAILY_SCHEDULE, counts };
  });
}
