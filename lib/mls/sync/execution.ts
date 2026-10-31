import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import type { DocumentReference, DocumentData } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type { MLSListingFirestoreDocument } from "@/lib/mls/types";
import type { MLSFeedConnector } from "@/lib/mls/connectors/MLSFeedConnector";

const context = new AsyncLocalStorage<{
  owner: string; reads: number; writes: number; failedOperations: number;
  cache: Map<string, DocumentData>;
  listingCache: Map<string, MLSListingFirestoreDocument | null>;
  connectors: Map<string, MLSFeedConnector>;
  deadline: number;
  listings: { retrieved: number; filtered: number; created: number; changed: number; unchanged: number; markedInactive: number };
}>();
// Writes renew this lease. A crashed worker must not block all daily retries.
// An expired or replaced worker is fenced from committing by writeSyncDocuments.
const LEASE_MS = 2 * 60 * 1000;
export function remainingSyncTime() { return Math.max(0, (context.getStore()?.deadline ?? Infinity) - Date.now()); }
export function setSyncDeadline(deadline: number) { const c = context.getStore(); if (c) c.deadline = deadline; }
// Leave headroom for the next feed page and concurrent website requests in the
// existing 512 MiB instance. Yield at a persisted page boundary, never mid-write.
export function syncMemoryPressure(): boolean {
  const rss = process.memoryUsage().rss;
  const limit = 400 * 1024 * 1024;
  if (rss < limit) return false;
  console.info(JSON.stringify({ event: "mls_sync_memory_yield", rss, limit }));
  return true;
}
export function releaseSyncPage() { context.getStore()?.listingCache.clear(); }
export function cachedSyncConnector(key: string, create: () => MLSFeedConnector): MLSFeedConnector {
  const cache = context.getStore()?.connectors;
  if (!cache) return create();
  if (!cache.has(key)) cache.set(key, create());
  return cache.get(key)!;
}
export function listingReadCache() { return context.getStore()?.listingCache; }
export function cacheListing(id: string, data: MLSListingFirestoreDocument | null) {
  const cache = listingReadCache(); if (!cache) return;
  cache.delete(id); cache.set(id, data);
  // Retain at most one feed page. Full documents contain image lists and
  // descriptions; keeping thousands across a daily sweep raises peak memory.
  if (cache.size > 100) cache.delete(cache.keys().next().value!);
}
export class SyncBusyError extends Error {}
export function recordReads(count: number) { const c = context.getStore(); if (c) c.reads += count; }
export function recordWrites(count: number) { const c = context.getStore(); if (c) c.writes += count; }
export function recordRetrieved(count: number) { const c = context.getStore(); if (c) c.listings.retrieved += count; }
export function recordFiltered(count: number) { const c = context.getStore(); if (c) c.listings.filtered += count; }
export function recordListingChanges(changes: { created?: number; updated?: number; unchanged?: number; hidden?: number }) {
  const c = context.getStore(); if (!c) return;
  c.listings.created += changes.created ?? 0; c.listings.changed += changes.updated ?? 0;
  c.listings.unchanged += changes.unchanged ?? 0; c.listings.markedInactive += changes.hidden ?? 0;
}
export function syncOperationCounts() {
  const c = context.getStore();
  return { documentReads: c?.reads ?? 0, documentWrites: c?.writes ?? 0,
    failedOperations: c?.failedOperations ?? 0,
    ...c?.listings,
    operationCountScope: "application-observed reads and acknowledged writes including lock/cursor/manifest; internal RPC retries, unacknowledged commits and billing/index charges excluded",
    failureCountScope: "terminal execution/storage failures; internally recovered retries excluded" };
}

export async function withSyncLease<T>(work: () => Promise<T>): Promise<T> {
  if (context.getStore()) return work();
  const db = getFirebaseAdminFirestore();
  const ref = db.collection("settings").doc("mlsSyncLease");
  const state = { owner: randomUUID(), reads: 0, writes: 0, failedOperations: 0, cache: new Map<string, DocumentData>(),
    listingCache: new Map<string, MLSListingFirestoreDocument | null>(),
    connectors: new Map<string, MLSFeedConnector>(), deadline: Date.now() + 240_000,
    listings: { retrieved: 0, filtered: 0, created: 0, changed: 0, unchanged: 0, markedInactive: 0 } };
  return context.run(state, async () => {
    const startedAt = new Date().toISOString();
    await db.runTransaction(async tx => {
      const snap = await tx.get(ref); recordReads(1);
      if ((snap.data()?.expiresAt ?? 0) > Date.now()) throw new SyncBusyError("An MLS synchronization is already running.");
      tx.set(ref, { owner: state.owner, expiresAt: Date.now() + LEASE_MS });
    });
    state.writes++;
    console.info(JSON.stringify({ event: "mls_sync_started", startedAt, executionId: state.owner, memoryBytes: process.memoryUsage() }));
    try { return await work(); }
    catch (error) { state.failedOperations++; throw error; }
    finally {
      try {
        const released = await db.runTransaction(async tx => {
          const snap = await tx.get(ref); recordReads(1);
          if (snap.data()?.owner !== state.owner) return false;
          tx.set(ref, { owner: state.owner, expiresAt: 0 });
          return true;
        });
        if (released) state.writes++;
      } catch (error) {
        state.failedOperations++;
        throw error;
      } finally {
        state.cache.clear(); state.listingCache.clear(); state.connectors.clear();
        console.info(JSON.stringify({ event: "mls_sync_finished", startedAt, finishedAt: new Date().toISOString(),
          durationMs: Date.now() - Date.parse(startedAt), executionId: state.owner, memoryBytes: process.memoryUsage(), ...syncOperationCounts() }));
      }
    }
  });
}

// A transaction fences every write against an expired/replaced owner. Firestore
// retries transaction conflicts; deterministic writes make transport retries safe.
type SyncWrite = { ref: DocumentReference; data: DocumentData };
export async function writeSyncDocuments(writes: SyncWrite[], onCommitted?: (writes: SyncWrite[]) => void) {
  if (!writes.length) return;
  const state = context.getStore();
  if (!state) throw new Error("MLS writes require the shared sync lease.");
  const db = getFirebaseAdminFirestore();
  const lease = db.collection("settings").doc("mlsSyncLease");
  for (let i = 0; i < writes.length; i += 400) {
    const chunk = writes.slice(i, i + 400);
    await db.runTransaction(async tx => {
      const lock = await tx.get(lease); recordReads(1);
      if (lock.data()?.owner !== state.owner || lock.data()?.expiresAt <= Date.now()) {
        throw new Error("MLS synchronization lease expired; retry from the saved cursor.");
      }
      for (const item of chunk) tx.set(item.ref, item.data, { merge: true });
      tx.set(lease, { owner: state.owner, expiresAt: Date.now() + LEASE_MS });
    });
    state.writes += chunk.length + 1;
    onCommitted?.(chunk);
  }
}

export async function readCursor(id: string): Promise<DocumentData> {
  const cache = context.getStore()?.cache;
  if (cache?.has(id)) return cache.get(id)!;
  const snap = await getFirebaseAdminFirestore().collection("settings").doc(id).get(); recordReads(1);
  const data = snap.data() ?? {}; cache?.set(id, data); return data;
}
export async function writeCursor(id: string, data: DocumentData) {
  const cache = context.getStore()?.cache;
  const previous = cache?.get(id);
  if (previous && Object.entries(data).every(([key, value]) => isDeepStrictEqual(previous[key], value))) return;
  await writeSyncDocuments([{ ref: getFirebaseAdminFirestore().collection("settings").doc(id), data }]);
  cache?.set(id, { ...cache.get(id), ...data });
}
