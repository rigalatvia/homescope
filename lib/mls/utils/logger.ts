export function logSyncInfo(message: string, meta?: Record<string, unknown>): void {
  console.info(`[mls-sync] ${message}`, meta ?? {});
}

export function logSyncWarn(message: string, meta?: Record<string, unknown>): void {
  console.warn(`[mls-sync] ${message}`, meta ?? {});
}

export function logSyncError(message: string, error: unknown, meta?: Record<string, unknown>): void {
  console.error(`[mls-sync] ${message}`, { error, ...(meta ?? {}) });
}
