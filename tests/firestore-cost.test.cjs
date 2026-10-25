const assert = require('node:assert/strict');
const { test } = require('node:test');
const Module = require('node:module');

test('market snapshot cache preserves exact as-of calculations and isolates cities', async () => {
  const originalLoad = Module._load;
  let reads = 0;
  let queries = 0;
  let now = 0;
  let fail = false;
  const createdAt = ['2026-09-30T00:00:00Z', '2026-10-01T00:00:00Z', '2026-10-23T12:00:00Z', '2026-11-01T00:00:00Z', 'invalid'];
  const query = {
    where() { return this; },
    count() { return { get: async () => { queries++; return { data: () => ({ count: 5 }) }; } }; },
    aggregate() { return { get: async () => { queries++; return { data: () => ({ averagePrice: 123.5 }) }; } }; },
    select() { return { get: async () => {
      queries++;
      if (fail) throw new Error('isolated test failure');
      reads += createdAt.length;
      return { docs: createdAt.map(value => ({ data: () => ({ createdAt: value }) })) };
    } }; }
  };
  Module._load = function(request, parent, isMain) {
    if (request === '@/lib/firebase/admin') return { getFirebaseAdminFirestore: () => ({ collection: () => query }) };
    if (request === 'next/cache') return { unstable_cache(fn, _key, options) {
      const entries = new Map();
      return async (...args) => {
        const key = JSON.stringify(args);
        const hit = entries.get(key);
        if (hit && now < hit.expires) return hit.value;
        const value = await fn(...args);
        entries.set(key, { value, expires: now + options.revalidate * 1000 });
        return value;
      };
    } };
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    const raw = require('../lib/mls/sync/publicQueries.ts');
    const data = require('../lib/listings/firestore-data.ts');
    const options = { municipality: 'Toronto', monthStartIso: '2026-10-01T00:00:00Z', nextMonthStartIso: '2026-11-01T00:00:00Z', asOfIso: '2026-10-23T11:59:59Z' };
    const inputs = [options, { ...options, asOfIso: '2026-10-23T12:00:01Z' }, { ...options, asOfIso: '2026-10-23T12:01:00Z' }];
    const baseline = [];
    for (const input of inputs) baseline.push(await raw.getMonthlyMarketStatsByMunicipality(input));
    assert.equal(queries, 18);
    assert.equal(reads, 15);
    queries = reads = 0;
    const actual = [];
    for (const input of inputs) actual.push(await data.getMonthlyMarketStatsByMunicipality(input));
    assert.deepEqual(actual, baseline);
    assert.equal(actual[0].newListingsCount, 2);
    assert.equal(actual[0].averageSalePrice, 124);
    assert.notEqual(actual[0].averageDaysOnMarket, actual[1].averageDaysOnMarket);
    assert.equal(queries, 6);
    assert.equal(reads, 5);
    await data.getMonthlyMarketStatsByMunicipality({ ...options, municipality: 'Vaughan' });
    assert.equal(queries, 12);
    now = 900001;
    await data.getMonthlyMarketStatsByMunicipality(options);
    assert.equal(queries, 18);
    const invalid = await data.getMonthlyMarketStatsByMunicipality({ ...options, municipality: 'invalid' });
    assert.equal(invalid.activeCount, 0);
    assert.equal(invalid.averageDaysOnMarket, null);
    assert.equal(queries, 18);
    fail = true;
    await assert.rejects(data.getMonthlyMarketStatsByMunicipality({ ...options, municipality: 'Aurora' }));
    fail = false;
    assert.equal((await data.getMonthlyMarketStatsByMunicipality({ ...options, municipality: 'Aurora' })).activeCount, 5);
    console.log('Market fixture: 3 renders, document reads 15 -> 5; query executions 18 -> 6; identical output. Cache expiry and city isolation pass.');
  } finally { Module._load = originalLoad; }
});

test('all-items map searches avoid unused indexed page query, preserving filters and order', async () => {
  const originalLoad = Module._load;
  let pages = 0;
  let scans = 0;
  const base = { mlsNumber: 'N123', title: 'Test', city: 'Toronto', area: 'Toronto', address: 'Test', bedrooms: 3, bathrooms: 2, propertyType: 'Detached', transactionType: 'sale', description: '', images: [], isPubliclyAdvertisable: true, status: 'active', createdAt: '2026-10-01', updatedAt: '2026-10-01', listingUrlSlug: 'test' };
  const listings = [{ ...base, id: 'a', price: 200 }, { ...base, id: 'b', price: 100 }, { ...base, id: 'c', price: 300, transactionType: 'lease' }];
  Module._load = function(request, parent, isMain) {
    if (request === '@/lib/listings/firestore-data') return {
      getPublicListings: async () => { scans++; return listings; },
      getPublicListingsPage: async () => { pages++; return { items: [listings[1]], total: 2, page: 1, pageSize: 1, totalPages: 2 }; },
      getPublicListingByMlsNumber: async () => listings[0],
      getListingsNearCoordinate: async () => listings
    };
    if (request === '@/lib/settings/site-settings') return {};
    if (request === '@/lib/schools/firestore-data') return { getSchoolDirectory: async () => [] };
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    const service = require('../lib/listings/service.ts');
    const { applyListingFilters } = require('../lib/listings/filters.ts');
    for (const sort of ['price_asc', 'price_desc', 'newest']) {
      const filters = { city: 'Toronto', transactionType: 'sale', sort, pageSize: 1 };
      const result = await service.getPublicListings(filters, { includeAllItems: true });
      const expected = applyListingFilters(listings, filters).sort((a,b) => sort === 'price_desc' ? b.price-a.price : sort === 'newest' ? 0 : a.price-b.price);
      assert.deepEqual(result.allItems, expected);
      assert.equal(result.total, 2);
    }
    assert.equal(pages, 0);
    assert.equal(scans, 3);
    await service.getPublicListings({ city: 'Toronto' });
    assert.equal(pages, 1);
    assert.equal(scans, 3);
    const exact = await service.getPublicListings({ mlsNumber: 'N123' }, { includeAllItems: true });
    assert.ok(Array.isArray(exact.allItems));
    assert.equal(scans, 3);
    console.log('Map fixture: 3 requests, unused indexed page/count calls 3 -> 0; full candidate loads unchanged; listing-page path retained.');
  } finally { Module._load = originalLoad; }
});
