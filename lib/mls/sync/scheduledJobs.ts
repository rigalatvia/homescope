import { runDailyMLSSync } from "@/lib/mls/sync/dailySync";
// Compatibility names all use the same daily gate and lease. Only the existing
// HTTP endpoint should be wired to Cloud Scheduler, at 04:00 America/Toronto.
export async function scheduledMLSDailySync(): Promise<void> {
  const result = await runDailyMLSSync();
  if (!result.success) throw new Error("Daily MLS sync incomplete; retry saved cursor.");
}
export const scheduledMLSFullSync = scheduledMLSDailySync;
export const scheduledMLS3HourSync = scheduledMLSDailySync;
export const scheduledMLSIncrementalSync = scheduledMLSDailySync;
export const scheduledMLSStaleCleanup = scheduledMLSDailySync;
