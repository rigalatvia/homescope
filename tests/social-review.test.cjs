const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const original = Module._load;
let campaign, saves = 0, metaCalls = 0;
Module._load = function(name, parent, main) {
  if (name === '@/lib/firebase/admin') return { getFirebaseAdminFirestore: () => ({ collection: () => ({ doc: () => ({ get: async () => ({ data: () => campaign }) }) }) }) };
  if (name === './store' && parent.filename.endsWith('worker.ts')) return {
    COLLECTION: 'propertySocialPosts', getSettings: async () => ({ enabled: true, baselineComplete: true }),
    withSocialLock: async work => work({ check: async () => {}, save: async () => { saves++; } }),
    getListing: async () => { throw new Error('Unapproved draft must not reach publication lookup'); }
  };
  if (name === './meta' && parent.filename.endsWith('worker.ts')) return { MetaClient: class { constructor() { metaCalls++; } } };
  if (['./render', './images', './storage'].includes(name) && parent.filename.endsWith('worker.ts')) return {};
  return original.call(this, name, parent, main);
};
after(() => { Module._load = original; });
const { runSocialWorker } = require('../lib/social/worker.ts');
test('legacy ready automatic campaign cannot publish without explicit approval', async () => {
  campaign = { id: 'legacy', state: 'ready', dryRun: false, nextAttemptAt: new Date().toISOString() };
  await runSocialWorker('legacy');
  assert.equal(metaCalls, 0);
  assert.equal(saves, 0);
});
test('review draft cannot publish through a manual queue step', async () => {
  campaign = { id: 'draft', state: 'ready', dryRun: true, publishApprovedAt: null, nextAttemptAt: '9999-12-31T00:00:00.000Z' };
  await runSocialWorker('draft');
  assert.equal(metaCalls, 0);
});
