const assert = require('node:assert/strict');
const { test, beforeEach, after } = require('node:test');
const Module = require('node:module');

// Isolated Firestore/MLS fixtures: no credentials, network, production data or Meta calls.
const records = new Map();
const events = [];
const originalInfo = console.info;
console.info = (message, detail) => events.push({ message, detail });
after(() => { console.info = originalInfo; Module._load = originalLoad; });
let writes = [], reads = [], failCommit = null, feed, calls = [];
const clone = value => value === undefined ? undefined : structuredClone(value);
function ref(path) {
  return { path, id: path.split('/').at(-1), parent: { id: path.split('/').at(-2) }, collection: name => collection(`${path}/${name}`),
    get: async () => snap(path), set: async (data, opts) => apply(path, data, opts?.merge) };
}
function snap(path) {
  reads.push(path);
  const data = clone(records.get(path));
  return { ref: ref(path), id: path.split('/').at(-1), exists: data !== undefined, data: () => data };
}
function apply(path, data, merge) {
  writes.push({ path, data: clone(data) });
  records.set(path, merge ? { ...records.get(path), ...clone(data) } : clone(data));
}
function collection(path, predicates = []) {
  return { doc: id => ref(`${path}/${id}`),
    where: (field, op, value) => collection(path, [...predicates, d => op === '==' && d[field] === value]),
    select() { return this; },
    get: async () => {
      const docs = [...records.keys()].filter(key => key.startsWith(path + '/') && key.split('/').length === path.split('/').length + 1)
        .filter(key => predicates.every(predicate => predicate(records.get(key)))).map(snap);
      return { docs, size: docs.length, empty: !docs.length };
    }
  };
}
const db = {
  collection, getAll: async (...refs) => refs.map(r => snap(r.path)),
  runTransaction: async callback => {
    const pending = [];
    const result = await callback({ get: async r => snap(r.path), set: (r, data, opts) => pending.push([r.path, data, opts?.merge]) });
    if (failCommit?.(pending)) { failCommit = null; throw new Error('injected interrupted commit'); }
    for (const args of pending) apply(...args);
    return result;
  }
};
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === '@/lib/firebase/admin') return { getFirebaseAdminFirestore: () => db };
  if (request === '@/lib/server/secret-manager') return { ensureServerSecretsLoaded: async () => {}, getServerSecretValue: async () => 'test-token', getServerConfigValue: async () => 'test-admin' };
  if (request === '@/lib/mls/utils/logger') return { logSyncInfo() {}, logSyncError() {}, logSyncWarn() {} };
  if (request === '@/lib/mls/sync/createConnector') return { createMLSConnector: () => ({
    connectorName: 'mock', sourceSystem: 'approved-mls-ddf',
    fetchUpdatedListingsPage: async (since, options) => { calls.push({ mode: 'incremental', since: since.toISOString(), ...options }); return feed('incremental', options); },
    fetchAllListingsPage: async options => { calls.push({ mode: 'full', ...options }); return feed('full', options); },
    fetchActiveListingsPage: async options => { calls.push({ mode: 'cleanup', ...options }); return feed('cleanup', options); }
  }) };
  return originalLoad.call(this, request, parent, isMain);
};
const { normalizeListing } = require('../lib/mls/normalize/normalizeListing.ts');
const { mockMLSFeedListings } = require('../data/mockFeed/mls-listings.ts');
const { mlsSyncConfig } = require('../lib/mls/config.ts');
const { withSyncLease, writeSyncDocuments, SyncBusyError, syncOperationCounts, setSyncDeadline } = require('../lib/mls/sync/execution.ts');
const { upsertNormalizedListings } = require('../lib/mls/upsert/upsertListings.ts');
const { runIncrementalSync } = require('../lib/mls/sync/runIncrementalSync.ts');
const { runStaleCleanup } = require('../lib/mls/sync/runStaleCleanup.ts');
const { runFullSync } = require('../lib/mls/sync/runFullSync.ts');
const { runDailyMLSSync, MLS_DAILY_SCHEDULE } = require('../lib/mls/sync/dailySync.ts');
const old = '2026-01-01T00:00:00.000Z';
const raw = (id = 'one', changes = {}) => ({ ...mockMLSFeedListings[0], sourceListingKey: id, ...changes });
const normalized = (id = 'one', changes = {}, at = old) => normalizeListing(raw(id, changes), at);
const path = id => `listings/approved-mls-ddf:${id}`;
function seed(id, changes) {
  records.set(path(id), { ...normalized(id, changes), createdAt: old, updatedAt: old, lastSeenInSourceAt: old });
}
const listingWrites = () => writes.filter(w => w.path.startsWith('listings/'));
test('sync listing cache retains only one page and releases evicted documents', async () => {
  const { cacheListing, listingReadCache } = require('../lib/mls/sync/execution.ts');
  await withSyncLease(async () => {
    for (let i = 0; i < 250; i++) cacheListing(String(i), normalized(String(i)));
    assert.equal(listingReadCache().size, 100);
    assert.equal(listingReadCache().has('0'), false);
    assert.equal(listingReadCache().has('249'), true);
  });
});
const snapshotWrites = () => writes.filter(w => w.path.startsWith('listingSnapshots/'));
test('new eligible MLS listing creates one unapproved review draft atomically; updates preserve it', async () => {
  const item = normalized('review-home');
  item.listingOfficeKey = undefined;
  item.listingOfficeName = 'RE/MAX METROPOLIS REALTY';
  item.isVisible = true; item.status = 'active'; item.permToAdvertise = true;
  item.slug = 'review-home'; item.mlsNumber = 'C12345678';
  const { campaignId } = require('../lib/social/policy.ts');
  const key = `propertySocialPosts/${campaignId(item.listingId)}`;
  await withSyncLease(() => upsertNormalizedListings([item], old));
  const draft = records.get(key);
  assert.equal(draft.listingGroup, 'new');
  assert.equal(draft.publishApprovedAt, null);
  assert.equal(draft.dryRun, true);
  assert.equal(draft.listingCreatedAt, old);
  assert.equal(draft.nextAttemptAt, '9999-12-31T00:00:00.000Z');
  records.set(key, { ...draft, publishApprovedAt: old });
  await withSyncLease(() => upsertNormalizedListings([{ ...item, price: item.price + 1 }], old));
  assert.equal(records.get(key).publishApprovedAt, old);
  assert.equal(writes.filter(w => w.path === key).length, 1);
});
beforeEach(() => {
  records.clear(); writes = []; reads = []; failCommit = null; calls = [];
  mlsSyncConfig.incrementalMaxPagesPerRun = 10; mlsSyncConfig.fullSyncMaxPagesPerRun = 1;
  feed = () => ({ items: [], nextCursor: null });
});

test('unchanged normalized data ignores sync/raw metadata, deduplicates reads, and writes nothing', async () => {
  seed('one');
  await withSyncLease(async () => {
    const item = normalized('one', {}, '2026-10-25T08:00:00Z');
    item.rawSourceHash = 'irrelevant feed metadata'; item.sourceUpdatedAt = '2026-10-25T08:00:00Z';
    const result = await upsertNormalizedListings([item, item], item.syncedAt);
    assert.equal(result.unchanged, 1); assert.equal(result.upserted, 0);
    assert.equal(syncOperationCounts().unchanged, 1);
  });
  assert.equal(reads.filter(p => p === path('one')).length, 1);
  assert.equal(listingWrites().length, 0); assert.equal(snapshotWrites().length, 0);
});

test('new and changed listings batch atomically with snapshots; retry preserves discovery and saved IDs', async () => {
  seed('one');
  const at = new Date().toISOString();
  const inputs = [normalized('one', { listPrice: 2000000 }, at), normalized('two', {}, at)];
  failCommit = pending => pending.some(([p]) => p.startsWith('listingSnapshots/'));
  await assert.rejects(withSyncLease(() => upsertNormalizedListings(inputs, at)), /interrupted/);
  assert.equal(listingWrites().length, 0); assert.equal(records.has(path('two')), false);
  await withSyncLease(() => upsertNormalizedListings(inputs, at));
  assert.equal(listingWrites().length, 2); assert.equal(snapshotWrites().length, 2);
  assert.equal(records.get(path('one')).price, 2000000);
  const discovery = records.get(path('two')).socialDiscoveryPendingAt;
  await withSyncLease(() => upsertNormalizedListings(inputs, at));
  assert.equal(listingWrites().length, 2); assert.equal(snapshotWrites().length, 2);
  assert.equal(records.get(path('two')).socialDiscoveryPendingAt, discovery);
});

test('sold, leased, expired and terminated records remain stored and hidden; reactivation does not rediscover', async () => {
  for (const status of ['Sold', 'Leased', 'Expired', 'Terminated']) {
    seed(status);
    const result = await withSyncLease(() => upsertNormalizedListings([normalized(status, { status })], old));
    assert.equal(result.hidden, 1); assert.equal(records.get(path(status)).isVisible, false);
    assert.equal(records.get(path(status)).status, status.toLowerCase());
    await withSyncLease(() => upsertNormalizedListings([normalized(status)], old));
    assert.equal(records.get(path(status)).isVisible, true);
    assert.equal(records.get(path(status)).socialDiscoveryPendingAt, undefined);
  }
});

test('failed incremental resumes short pages without advancing checkpoint or hiding absent records', async () => {
  seed('absent'); records.set('settings/mlsIncrementalCursor', { sinceIso: old });
  let fail = true;
  feed = (_mode, options) => {
    if (options.page === 1) return { items: [raw('one')], nextCursor: 'page2' };
    if (fail) throw new Error('feed unavailable');
    return { items: [raw('two')], nextCursor: null };
  };
  await assert.rejects(runIncrementalSync(), /feed unavailable/);
  assert.equal(records.get('settings/mlsIncrementalCursor').sinceIso, old);
  assert.equal(records.get('settings/mlsIncrementalCursor').nextPage, 2);
  assert.equal(records.get(path('absent')).isVisible, true);
  const before = listingWrites().length; fail = false;
  const result = await runIncrementalSync();
  assert.equal(result.complete, true); assert.equal(calls.at(-1).page, 2);
  assert.equal(listingWrites().length - before, 1);
  assert.notEqual(records.get('settings/mlsIncrementalCursor').sinceIso, old);
  assert.equal(records.get('settings/mlsIncrementalCursor').nextPage, 1);
});

test('initial failure keeps a fixed lookback; manual override is resumable without changing successful checkpoint', async () => {
  feed = () => { throw new Error('feed unavailable'); };
  await assert.rejects(runIncrementalSync());
  const first = records.get('settings/mlsIncrementalCursor').initialSinceIso;
  await assert.rejects(runIncrementalSync());
  assert.equal(calls.at(-1).since, first);
  assert.equal(records.get('settings/mlsIncrementalCursor').sinceIso, undefined);
  records.set('settings/mlsIncrementalCursor', { sinceIso: old });
  const override = new Date('2025-12-01T00:00:00Z');
  await assert.rejects(runIncrementalSync({ since: override }));
  assert.equal(records.get('settings/mlsIncrementalCursor').sinceIso, old);
  await assert.rejects(runIncrementalSync());
  assert.equal(calls.at(-1).since, override.toISOString());
});

test('failed checkpoint commit retries without duplicate listing or snapshot writes', async () => {
  records.set('settings/mlsIncrementalCursor', { sinceIso: old });
  feed = () => ({ items: [raw()], nextCursor: null });
  failCommit = pending => pending.some(([p, d]) => p === 'settings/mlsIncrementalCursor' && d.sinceIso && d.sinceIso !== old);
  await assert.rejects(runIncrementalSync(), /interrupted/);
  assert.equal(records.get('settings/mlsIncrementalCursor').sinceIso, old);
  await runIncrementalSync();
  assert.equal(listingWrites().length, 1); assert.equal(snapshotWrites().length, 1);
});

test('reconciliation spans requests, handles empty final page, and hides only missing same-source records', async () => {
  seed('one'); seed('two'); seed('removed');
  records.set('listings/other:keep', { ...records.get(path('removed')), sourceSystem: 'other', listingId: 'other:keep' });
  feed = (_mode, options) => options.page === 1 ? { items: [raw('one'), raw('two')], nextCursor: 'page2' } : { items: [], nextCursor: null };
  const first = await runStaleCleanup(undefined, { maxPagesPerRun: 1 });
  assert.equal(first.complete, false); assert.equal(records.get(path('removed')).isVisible, true);
  const second = await runStaleCleanup(undefined, { maxPagesPerRun: 1 });
  assert.equal(second.complete, true); assert.equal(second.stats.hidden, 1);
  assert.equal(records.get(path('one')).isVisible, true); assert.equal(records.get(path('two')).isVisible, true);
  assert.equal(records.get(path('removed')).isVisible, false); assert.equal(records.get('listings/other:keep').isVisible, true);
  assert.equal(listingWrites().length, 1);
});

test('empty reconciliation and interrupted pages never hide inventory; legacy cursor restarts safely', async () => {
  seed('one'); seed('removed');
  await assert.rejects(runStaleCleanup(), /Empty MLS/);
  assert.equal(listingWrites().length, 0);
  records.set('settings/mlsCleanupCursor', { nextPage: 5, nextCursor: 'legacy', sweepStartedAt: old });
  feed = (_mode, options) => { assert.equal(options.page, 1); return { items: [raw('one')], nextCursor: 'page2' }; };
  await runStaleCleanup(undefined, { maxPagesPerRun: 1 });
  feed = () => { throw new Error('interrupted page'); };
  await assert.rejects(runStaleCleanup(), /interrupted page/);
  assert.equal(records.get(path('removed')).isVisible, true);
});

test('manual full sync uses the same manifest and never rewrites unchanged listing documents', async () => {
  seed('one'); seed('removed'); feed = () => ({ items: [raw('one')], nextCursor: null });
  const result = await runFullSync();
  assert.equal(result.complete, true); assert.equal(result.stats.unchanged, 1);
  assert.equal(records.get(path('removed')).isVisible, false);
  assert.equal(listingWrites().length, 1);
});

test('overlapping workers are rejected and replaced/expired owners cannot commit', async () => {
  let release, entered;
  const ready = new Promise(resolve => entered = resolve);
  const held = withSyncLease(async () => {
    entered(); await new Promise(resolve => release = resolve);
    records.set('settings/mlsSyncLease', { owner: 'replacement', expiresAt: Date.now() + 100000 });
    await assert.rejects(writeSyncDocuments([{ ref: ref(path('one')), data: { isVisible: true } }]), /lease expired/);
  });
  await ready;
  await assert.rejects(runIncrementalSync(), SyncBusyError);
  release(); await held;
  assert.equal(records.get('settings/mlsSyncLease').owner, 'replacement');
  assert.equal(listingWrites().length, 0);
  records.set('settings/mlsSyncLease', { owner: 'crashed', expiresAt: 0 });
  await withSyncLease(async () => {});
});

test('daily schedule and successful duplicate delivery are idempotent', async () => {
  assert.deepEqual(MLS_DAILY_SCHEDULE, { cron: '0 4 * * *', timeZone: 'America/Toronto' });
  seed('one'); feed = () => ({ items: [raw('one')], nextCursor: null });
  const first = await runDailyMLSSync(); assert.equal(first.success, true);
  const beforeCalls = calls.length, beforeWrites = listingWrites().length;
  const repeated = await runDailyMLSSync();
  assert.equal(repeated.skipped, 'already_completed_today');
  assert.equal(calls.length, beforeCalls); assert.equal(listingWrites().length, beforeWrites);
});

test('100 unchanged fixtures eliminate 100 legacy touch writes with one read per distinct ID', async () => {
  const inputs = Array.from({ length: 100 }, (_, i) => { seed(String(i)); return normalized(String(i)); });
  await withSyncLease(() => upsertNormalizedListings(inputs, old));
  assert.equal(listingWrites().length, 0);
  assert.equal(reads.filter(p => p.startsWith('listings/')).length, 100);
  console.log('Fixture: unchanged listing writes 100 -> 0; listing reads 100; no snapshots or discovery writes.');
});

test('runtime limit returns a partial result without fetching or advancing the successful checkpoint', async () => {
  records.set('settings/mlsIncrementalCursor', { sinceIso: old });
  const result = await withSyncLease(async () => {
    setSyncDeadline(Date.now());
    return runIncrementalSync();
  });
  assert.equal(result.complete, false); assert.equal(calls.length, 0);
  assert.equal(records.get('settings/mlsIncrementalCursor').sinceIso, old);
});

test('missing middle manifest fails closed and automatically restarts the next sweep', async () => {
  seed('one'); seed('removed');
  feed = (_mode, options) => ({ items: [raw('one')], nextCursor: options.page < 3 ? 'next' : null });
  await runStaleCleanup(undefined, { maxPagesPerRun: 1 });
  await runStaleCleanup(undefined, { maxPagesPerRun: 1 });
  for (const key of records.keys()) if (key.includes('/pages/2')) records.delete(key);
  await assert.rejects(runStaleCleanup(undefined, { maxPagesPerRun: 1 }), /Incomplete MLS/);
  assert.equal(records.get(path('removed')).isVisible, true);
  assert.equal(records.get('settings/mlsCleanupCursor').nextPage, 1);
  feed = () => ({ items: [raw('one')], nextCursor: null });
  assert.equal((await runStaleCleanup()).complete, true);
});

test('scheduled endpoint authenticates and returns retryable partial status; next attempt recovers', async () => {
  const { POST } = require('../app/api/internal/mls-sync/scheduled/route.ts');
  const request = token => new Request('https://example.test/api/internal/mls-sync/scheduled', { method: 'POST', headers: { 'x-scheduler-token': token } });
  assert.equal((await POST(request('wrong'))).status, 401);
  assert.equal(reads.length, 0);
  records.set('settings/mlsStopSignal', { requested: true });
  assert.equal((await POST(request('test-token'))).status, 503);
  assert.equal(records.get('settings/mlsSchedulerStatus').completedDay, undefined);
  feed = () => ({ items: [raw('one')], nextCursor: null });
  assert.equal((await POST(request('test-token'))).status, 200);
});

test('JSON completion logging reports measured operations and partial work after a failure', async () => {
  const eventStart = events.length;
  records.set('settings/mlsIncrementalCursor', { sinceIso: old });
  feed = (_mode, options) => {
    if (options.page === 2) throw new Error('feed failed');
    return { items: [raw('one')], nextCursor: 'page2' };
  };
  await assert.rejects(runIncrementalSync());
  const summary = events.slice(eventStart).map(event => JSON.parse(event.message)).find(event => event.event === 'mls_sync_finished');
  assert.equal(summary.created, 1); assert.equal(summary.retrieved, 1); assert.equal(summary.failedOperations, 1);
  assert.equal(summary.documentWrites, writes.length); assert.equal(summary.documentReads, reads.length);
  assert.ok(summary.startedAt && summary.finishedAt && summary.durationMs >= 0);
});

test('duplicate pages within one execution reuse listing reads and do not add history', async () => {
  seed('one');
  await withSyncLease(async () => {
    await upsertNormalizedListings([normalized('one')], old);
    await upsertNormalizedListings([normalized('one')], old);
  });
  assert.equal(reads.filter(key => key === path('one')).length, 1);
  assert.equal(listingWrites().length, 0);
});

test('DDF emits a modified-since query, reuses OAuth and rejects malformed or unstable records', async () => {
  const keys = ['DDF_TOKEN_URL', 'DDF_LISTINGS_URL', 'DDF_CLIENT_ID', 'DDF_CLIENT_SECRET'];
  const previous = keys.map(key => process.env[key]);
  const originalFetch = global.fetch;
  Object.assign(process.env, { DDF_TOKEN_URL: 'https://feed.example.test/token', DDF_LISTINGS_URL: 'https://feed.example.test/Property', DDF_CLIENT_ID: 'fixture', DDF_CLIENT_SECRET: 'fixture' });
  const urls = [];
  let payload = { value: [{ ListingKey: 'stable-id' }] };
  global.fetch = async url => {
    urls.push(new URL(url));
    return new Response(JSON.stringify(String(url).endsWith('/token') ? { access_token: 'fixture-token' } : payload), { status: 200 });
  };
  try {
    const { DdfTrebFeedConnector } = require('../lib/mls/connectors/DdfTrebFeedConnector.ts');
    const connector = new DdfTrebFeedConnector();
    const first = await connector.fetchUpdatedListingsPage(new Date(old), { page: 1, pageSize: 100 });
    assert.equal(first.items[0].sourceListingKey, 'stable-id');
    assert.match(urls[1].searchParams.get('$filter'), /ModificationTimestamp gt 2026-01-01T00:00:00.000Z/);
    await connector.fetchUpdatedListingsPage(new Date(old));
    assert.equal(urls.filter(url => url.pathname === '/token').length, 1);
    for (const malformed of [{ unexpected: [] }, { value: [null] }, { value: [{}] }]) {
      payload = malformed;
      await assert.rejects(connector.fetchUpdatedListingsPage(new Date(old)), /checkpoint retained/);
    }
  } finally {
    global.fetch = originalFetch;
    keys.forEach((key, index) => previous[index] === undefined ? delete process.env[key] : process.env[key] = previous[index]);
  }
});

test('partial reconciliation batch failure reports committed hides and retries only the remainder', async () => {
  seed('one');
  for (let i = 0; i < 401; i++) seed('missing' + i);
  feed = () => ({ items: [raw('one')], nextCursor: null });
  failCommit = pending => pending.some(([key]) => key === path('missing400'));
  const eventStart = events.length;
  await assert.rejects(runStaleCleanup(), /interrupted/);
  const summary = events.slice(eventStart).map(event => JSON.parse(event.message)).find(event => event.event === 'mls_sync_finished');
  assert.equal(summary.markedInactive, 400);
  assert.equal(listingWrites().length, 400);
  assert.equal(records.get(path('missing400')).isVisible, true);
  const recovered = await runStaleCleanup();
  assert.equal(recovered.complete, true); assert.equal(recovered.stats.hidden, 1);
  assert.equal(listingWrites().length, 401);
});
