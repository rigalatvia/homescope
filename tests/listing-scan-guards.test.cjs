const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const original = Module._load;
let scans = 0, pageCalls = 0;
Module._load = function(name, parent, main) {
  if (name === '@/lib/listings/firestore-data') return {
    getListingsNearCoordinate: async () => { throw new Error('index unavailable'); },
    getPublicListings: async () => { scans++; throw new Error('Unexpected inventory scan'); },
    getListingsByMunicipality: async () => [],
    getPublicListingsPage: async filters => { pageCalls++; assert.equal(filters.pageSize, 50); return { items: [] }; }
  };
  if (name === '@/lib/settings/site-settings') return { getSiteSettings: async () => ({ featuredListingIds: [] }) };
  if (name === '@/lib/schools/firestore-data') return {};
  return original.call(this, name, parent, main);
};
after(() => { Module._load = original; });
const service = require('../lib/listings/service.ts');
test('failed school query never expands into a municipality or whole-inventory read', async () => {
  const old = console.error; console.error = () => {};
  try {
    await assert.rejects(service.getNearbyListingCandidates({ latitude: 43, longitude: -79, radiusKm: 3, municipality: 'Toronto' }), /temporarily unavailable/);
    await assert.rejects(service.getNearbyListingCandidates({ latitude: 43, longitude: -79, radiusKm: 3 }), /temporarily unavailable/);
    assert.equal(scans, 0);
  } finally { console.error = old; }
});
test('similar-listing fallback fetches one bounded page instead of all listings', async () => {
  await service.getSimilarListingsForListing({ id: 'test', city: 'Toronto', transactionType: 'sale', bedrooms: 3, bathrooms: 2 });
  assert.equal(pageCalls, 1);
  assert.equal(scans, 0);
});
