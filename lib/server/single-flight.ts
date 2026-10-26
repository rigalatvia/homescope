// Share only work currently in flight. Completed values are left to the
// caller's existing cache, avoiding a second long-lived in-memory copy.
export function singleFlight<T>(load: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | undefined;
  return () => {
    if (!pending) {
      pending = Promise.resolve().then(load).finally(() => { pending = undefined; });
    }
    return pending;
  };
}
