import type { MLSConnectorKind, MLSSyncMode, MLSSyncResult } from "@/lib/mls/types";
import { runFullSync } from "@/lib/mls/sync/runFullSync";
import { runIncrementalSync } from "@/lib/mls/sync/runIncrementalSync";
import { runStaleCleanup } from "@/lib/mls/sync/runStaleCleanup";

export async function runMLSSync(mode: MLSSyncMode, params?: { connectorKind?: MLSConnectorKind; sinceIso?: string }): Promise<MLSSyncResult> {
  if (mode === "full") return runFullSync(params?.connectorKind);
  if (mode === "incremental") {
    return runIncrementalSync({
      connectorKind: params?.connectorKind,
      since: params?.sinceIso ? new Date(params.sinceIso) : undefined
    });
  }
  return runStaleCleanup(params?.connectorKind);
}
