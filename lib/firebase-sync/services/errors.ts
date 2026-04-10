export interface SyncError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}

export function toSyncError(error: unknown, fallbackCode = "SYNC_UNKNOWN_ERROR"): SyncError {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: fallbackCode
    };
  }

  return {
    message: "Unknown sync error",
    code: fallbackCode,
    details: { raw: error as unknown }
  };
}
