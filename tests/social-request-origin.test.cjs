const { test } = require('node:test');
const assert = require('node:assert/strict');
const { SITE_CONFIG } = require('../config/site.ts');
const { isValidSocialOrigin } = require('../lib/social/request-origin.ts');
const publicOrigin = new URL(SITE_CONFIG.baseUrl).origin;
function request(origin, extra = {}, url = 'http://internal-service:8080/api/admin/social') {
  return new Request(url, { method: 'POST', headers: { 'x-social-admin': '1', ...(origin === undefined ? {} : { origin }), ...extra } });
}
test('public origin is accepted behind a hosting proxy', () => {
  assert.equal(isValidSocialOrigin(request(publicOrigin)), true);
});
test('same-origin development requests remain supported', () => {
  assert.equal(isValidSocialOrigin(request('http://localhost:3000', {}, 'http://localhost:3000/api/admin/social')), true);
});
test('foreign, null, deceptive and forwarded origins are rejected', () => {
  for (const origin of ['https://attacker.example', 'null', `${publicOrigin}.attacker.example`]) {
    assert.equal(isValidSocialOrigin(request(origin, { 'x-forwarded-host': 'attacker.example', 'x-forwarded-proto': 'https' })), false);
  }
});
test('custom admin header is required even for trusted origins', () => {
  assert.equal(isValidSocialOrigin(request(publicOrigin, { 'x-social-admin': '' })), false);
});
