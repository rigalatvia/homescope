const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const original = Module._load;
let campaign, token = 'replacement', secretReads = 0;
const calls = [];
Module._load = function(name, parent, main) {
  if (name === '@/lib/server/secret-manager') return {
    getServerConfigValue: async key => ({ META_GRAPH_API_VERSION: 'v25.0', META_FACEBOOK_PAGE_ID: '1', META_INSTAGRAM_ACCOUNT_ID: '2', META_APP_ID: '3', META_APP_SECRET: 'secret', META_PAGE_ACCESS_TOKEN: 'stale' })[key],
    getServerSecretValue: async () => { secretReads++; return token; }
  };
  if (parent.filename.endsWith('admin.ts') && name === './store') return {
    campaignRef: () => ({ get: async () => ({ exists: true, data: () => campaign }) }),
    withSocialLock: async work => work({ save: async () => {}, check: async () => {} })
  };
  if (parent.filename.endsWith('admin.ts') && name === './worker') return {
    runSocialWorker: async (...args) => calls.push(args)
  };
  return original.call(this, name, parent, main);
};
after(() => { Module._load = original; });
const { socialAction } = require('../lib/social/admin');
const { metaConfig, MetaClient } = require('../lib/social/meta');
test('retry immediately starts only the selected platform; uncertain submissions remain protected', async () => {
  campaign = { id: 'draft', instagram: { status: 'failed' }, facebook: { status: 'failed' } };
  await socialAction({ action: 'retry', id: 'draft', platform: 'instagram' });
  assert.deepEqual(calls, [['draft', 'instagram']]);
  assert.equal(campaign.facebook.status, 'failed');
  campaign.instagram.submittedAt = '2026-10-28T00:00:00Z';
  await assert.rejects(socialAction({ action: 'retry', id: 'draft', platform: 'instagram' }), /Reconcile/);
  assert.equal(calls.length, 1);
});
test('Meta config reads rotated secret instead of stale environment token', async () => {
  assert.equal((await metaConfig()).token, 'replacement');
  token = 'rotated-again';
  assert.equal((await metaConfig()).token, 'rotated-again');
  assert.equal(secretReads, 2);
});
test('authentication error retains numeric subcode without echoing sensitive Meta text', async () => {
  const client = new MetaClient(await metaConfig(), async () => new Response(JSON.stringify({ error: { code: 190, error_subcode: 463, message: 'secret-token' } }), { status: 400 }));
  await assert.rejects(client.call('1'), error => error.subcode === 463 && error.message.includes('190/463') && !error.message.includes('secret-token'));
});
