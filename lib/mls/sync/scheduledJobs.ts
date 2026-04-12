import type { MLSConnectorKind } from "@/lib/mls/types";
import { runFullSync } from "@/lib/mls/sync/runFullSync";
import { runIncrementalSync } from "@/lib/mls/sync/runIncrementalSync";
import { runStaleCleanup } from "@/lib/mls/sync/runStaleCleanup";

const scheduledConnector = (process.env.MLS_CONNECTOR_KIND as MLSConnectorKind | undefined) ?? "ddf-treb";

export async function scheduledMLSFullSync(): Promise<void> {
  await runFullSync(scheduledConnector);
}

/**
 * Primary production schedule target (every 3 hours).
 * Use this entrypoint for Cloud Scheduler / cron wiring.
 */
export async function scheduledMLS3HourSync(): Promise<void> {
  await runFullSync(scheduledConnector);
}

export async function scheduledMLSIncrementalSync(): Promise<void> {
  await runIncrementalSync({ connectorKind: scheduledConnector });
}

export async function scheduledMLSStaleCleanup(): Promise<void> {
  await runStaleCleanup(scheduledConnector);
}
