export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options?: {
    retries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    shouldRetry?: (error: unknown) => boolean;
  }
): Promise<T> {
  const retries = options?.retries ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 400;
  const maxDelayMs = options?.maxDelayMs ?? 4000;
  const shouldRetry = options?.shouldRetry ?? defaultShouldRetry;

  let attempt = 0;
  while (true) {
    try {
      return await operation(attempt);
    } catch (error) {
      if (attempt >= retries || !shouldRetry(error)) {
        throw error;
      }
      const delay = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
      await sleep(delay);
      attempt += 1;
    }
  }
}

function defaultShouldRetry(error: unknown): boolean {
  if (!(error instanceof Error)) return true;
  return /timeout|429|5\d\d|network|fetch/i.test(error.message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
