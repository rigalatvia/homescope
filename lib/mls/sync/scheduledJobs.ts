import type { MLSConnectorKind } from "@/lib/mls/types";
import { runFullSync } from "@/lib/mls/sync/runFullSync";
import { runIncrementalSync } from "@/lib/mls/sync/runIncrementalSync";
import { runStaleCleanup } from "@/lib/mls/sync/runStaleCleanup";

const scheduledConnector = (process.env.MLS_CONNECTOR_KIND as MLSConnectorKind | undefined) ?? "mock";

export async function scheduledMLSFullSync(): Promise<void> {
  await runFullSync(scheduledConnector);
}

export async function scheduledMLSIncrementalSync(): Promise<void> {
  await runIncrementalSync({ connectorKind: scheduledConnector });
}

export async function scheduledMLSStaleCleanup(): Promise<void> {
  await runStaleCleanup(scheduledConnector);
}
