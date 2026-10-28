export function logSyncInfo(message: string, meta?: Record<string, unknown>): void {
  console.info(JSON.stringify({ event: "mls_sync_progress", message, ...meta }));
}

export function logSyncWarn(message: string, meta?: Record<string, unknown>): void {
  console.warn(JSON.stringify({ event: "mls_sync_warning", message, ...meta }));
}

export function logSyncError(message: string, error: unknown, meta?: Record<string, unknown>): void {
  console.error(JSON.stringify({ event: "mls_sync_error", message,
    error: error instanceof Error ? error.message : String(error), ...meta }));
}
