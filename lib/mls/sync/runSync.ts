import type { MLSConnectorKind, MLSSyncMode, MLSSyncResult } from "@/lib/mls/types";
import { runFullSync } from "@/lib/mls/sync/runFullSync";
import { runIncrementalSync } from "@/lib/mls/sync/runIncrementalSync";
import { runStaleCleanup } from "@/lib/mls/sync/runStaleCleanup";
import { clearMLSSyncStop } from "@/lib/mls/sync/stopSignal";

export async function runMLSSync(mode: MLSSyncMode, params?: { connectorKind?: MLSConnectorKind; sinceIso?: string }): Promise<MLSSyncResult> {
  await clearMLSSyncStop();
  if (mode === "full") return runFullSync(params?.connectorKind);
  if (mode === "incremental") {
    return runIncrementalSync({
      connectorKind: params?.connectorKind,
      since: params?.sinceIso ? new Date(params.sinceIso) : undefined
    });
  }
  return runStaleCleanup(params?.connectorKind);
}
