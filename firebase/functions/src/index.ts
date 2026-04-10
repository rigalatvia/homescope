import {
  runScheduledFullSync,
  runScheduledIncrementalSync,
  runScheduledStaleCleanup
} from "../../../lib/firebase-sync/functions/scheduled-sync";
import {
  scheduledMLSFullSync,
  scheduledMLSIncrementalSync,
  scheduledMLSStaleCleanup
} from "../../../lib/mls/sync/scheduledJobs";

/**
 * Cloud Functions scheduler-ready handlers.
 *
 * When wiring in Firebase Functions:
 * - map `scheduledFullSync` to a daily cron
 * - map `scheduledIncrementalSync` to every 15 minutes
 * - map `scheduledStaleCleanup` to hourly
 *
 * Example (to add inside a dedicated Firebase Functions package):
 * onSchedule("every 24 hours", async () => scheduledFullSync());
 */

export async function scheduledFullSync(): Promise<void> {
  await runScheduledFullSync();
}

export async function scheduledIncrementalSync(): Promise<void> {
  await runScheduledIncrementalSync();
}

export async function scheduledStaleCleanup(): Promise<void> {
  await runScheduledStaleCleanup();
}

/**
 * MLS sync scheduler handlers (new modular sync layer).
 */
export async function mlsScheduledFullSync(): Promise<void> {
  await scheduledMLSFullSync();
}

export async function mlsScheduledIncrementalSync(): Promise<void> {
  await scheduledMLSIncrementalSync();
}

export async function mlsScheduledStaleCleanup(): Promise<void> {
  await scheduledMLSStaleCleanup();
}
