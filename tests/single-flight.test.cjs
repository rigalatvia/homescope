const { test } = require('node:test');
const assert = require('node:assert/strict');
const { singleFlight } = require('../lib/server/single-flight.ts');
test('concurrent directory callers share work without retaining completed results', async () => {
  let calls = 0;
  const load = singleFlight(async () => { calls++; return [{ id: calls }]; });
  const results = await Promise.all(Array.from({ length: 30 }, () => load()));
  assert.equal(calls, 1);
  assert.ok(results.every(value => value === results[0]));
  await load();
  assert.equal(calls, 2);
});
test('a failed shared load can be retried', async () => {
  let calls = 0;
  const load = singleFlight(async () => { if (++calls === 1) throw new Error('temporary'); return 42; });
  const results = await Promise.allSettled([load(), load()]);
  assert.ok(results.every(result => result.status === 'rejected'));
  assert.equal(await load(), 42);
  assert.equal(calls, 2);
});
