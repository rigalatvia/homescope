# Firestore listing read audit — October 26, 2026

This is a source audit with local mocked regression checks, not a production billing measurement. No production inventory scan was run for this audit. Changes require application deployment.

## Fixed locally

| Path | Previous behavior | Change |
| --- | --- | --- |
| Social existing inventory import | Read unrelated listings before checking brokerage | Query `brokerageName == RE/MAX METROPOLIS REALTY`, paginate matching records only; retain existing drafts |
| School nearby lookup failure | Load municipality inventory or all public inventory after query error | Return an unavailable error; never expand the failed lookup into an inventory scan |
| Similar-listing fallback | Load all public inventory when city candidates were insufficient | Fetch at most 50 fallback candidates, then rank them |
| Map/advanced search candidate query | Fetch sale and lease candidates, then filter transaction type in memory | Apply requested transaction type in Firestore |
| Listing sitemap | Fetch and map full listing documents, including large photo arrays | Project only slug, date and ordering price, fetch in pages of 500, cache for an hour |

Projection reduces payload and memory; it does **not** reduce the number of billed document reads per cache refresh. Pagination alone also does not reduce total reads when every page is consumed. The sitemap deliberately still enumerates every public listing.

## Remaining broad reads and their consumers

| Code | Remaining behavior / implication |
| --- | --- |
| `lib/mls/sync/publicQueries.ts`: `getFilteredListings`, all-public and municipality loaders | Advanced searches and map candidates can still enumerate all matching public inventory. Bedrooms, bathrooms and some UI filters are applied after loading. Transaction type now narrows the database query. Further changes need indexed query design or a search backend; silently limiting these results would make search incomplete. |
| Coordinate lookup in the same file | Latitude narrows the database query; longitude is filtered in memory. A narrow requested longitude range can still cause many latitude-strip reads. |
| Market statistics in the same file | Counts/averages use aggregations, but days-on-market reads projected `createdAt` for all active listings in the municipality. Cached results reduce repetition, not reads per refresh. |
| Agent queries in the same file and `app/api/admin/featured/route.ts` | Equality queries fetch all matching agent records before local visibility filtering and slicing. These are agent-scoped, not full collection scans, but can grow. |
| `lib/mls/sync/reconciliation.ts` | Daily cleanup reads projected active records for the source to compare against the completed source inventory. This is intentional reconciliation, still proportional to active inventory. |
| `lib/social/store.ts` legacy baseline discovery | Contains a paginated older-inventory discovery scan. Manual draft workflow does not invoke that legacy discovery path. It should not be counted as current traffic without evidence it executes. |
| `lib/schools/firestore-data.ts` | Reads the whole schools directory with hourly caching and single-flight protection. Individual school lookups also consume that directory. This is a schools scan, not a listings scan. |
| Saved-search alerts | Matching uses listing search paths, so advanced saved searches inherit their broad-read behavior. Recipient enumeration is separate from listing enumeration. |

Normal indexed listing pagination, document-ID lookups and count aggregations are not full document collection loads. Offset pagination can still incur reads for skipped documents.

## Verification and limits

- Regression checks prove failed nearby queries perform zero full-inventory fallback calls.
- Regression checks prove similar listings use a bounded 50-candidate fallback.
- Existing Firestore cost regression tests and social tests exercise mocked database behavior; they do not measure live charges.
- Typecheck and lint validate code integration.
- The source confirms avoidable reads, but it cannot establish what fraction of the bill they caused. Compare production read counts, request volume and cache refresh frequency after deployment.
- This does not establish that the 512 MiB memory crashes are completely resolved.
