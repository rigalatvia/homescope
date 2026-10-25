# HomeScope GTA Firestore cost investigation

## A. Executive summary

**Query reads are the dominant measured operation: 579,216,980 query document reads in the audited October window.** There were 151,707 writes and 9,302 deletes. This supports prioritizing query volume over removing sync writes or dashboard realtime behavior. It does not identify which route caused each read or reconcile the invoice by SKU.

Two local fixes are ready for review: make city market-statistics caching independent of the current render timestamp, and eliminate the unused indexed pagination query when loading all map results. No deployment or production mutation occurred. These changes address verified waste, but are not claimed to explain or eliminate the entire bill.

The initial audit is in `firestore-initial-audit-2026-10-23.md`. The accompanying query inventory lists 157 terminal SDK/transaction/batch call sites in 35 files, including enclosing function names and source expressions. Mock/placeholder adapters and indirect wrappers were inspected separately. Monitoring evidence is in `firestore-monitoring-2026-10-23.json`; it contains aggregate operational metrics, not customer records.

## B. Billing evidence and limits

User-supplied billing: Firestore **$256.17**, total **$274.22**, October 1–23. The screenshot's project filters, SKU allocation, credits and exact cutoff are not available. Cloud Billing access returned 403. Do not equate the metrics below to chargeable units or distribute the $256.17 across SKUs without the billing export.

Monitoring window: **October 1, 2026 00:00 through October 23, 2026 15:00 America/Toronto**, equivalent to 04:00Z and 19:00Z. Hourly aligned database-scoped series:

| Metric | Observed value | Interpretation |
|---|---:|---|
| Query document reads | 579,216,980 | Dominant observed usage |
| Lookup reads | 202,246 | Includes sync point lookups and other consumers |
| Not-found reads | 139,498 | Missing-document reads; separate from successful lookups |
| Creates / updates | 43,972 / 107,735 | Total writes 151,707 |
| Deletes | 9,302 | Existing application cleanup exists; audit executed none |
| Latest data + index storage | 5,174,922,951 bytes (~4.82 GiB) | Point-in-time size, not monthly storage billing |
| Successful RunQuery calls | 1,703,175 | Project/database traffic, no route dimension |
| FAILED_PRECONDITION RunQuery calls | 50,178 | Investigate error logs; not proof every failure is a missing index |
| Successful aggregation calls | 39,568 | Index charges require SKU/Query Explain evidence |
| Max observed listeners | 5 | Low observed concurrency; not proof of zero listener read costs |

Confirmed database: `homescope-ee781/(default)`, Native/Standard, `northamerica-northeast2`, PITR disabled at inspection. No backups returned by Toronto backup listing; no backup/PITR storage series returned. Absence of current resources does not rule out historical charges. Index storage is included in the combined storage metric. Network usage, backup history, restore operations, index-entry billing and SKU prices remain unknown.

The legacy `document/read_count` response omitted QUERY; the database-scoped `document/read_ops_count` supplied it. API/listener series appear under legacy and current resource types: **do not add mirrored copies**. Monitoring can lag and is not an invoice. Reference: [Firestore billing](https://firebase.google.com/docs/firestore/pricing).

Access succeeded for database metadata, indexes, backups and Monitoring. Billing, Cloud Run service listing, Scheduler listing and Logging returned IAM 403 after network access succeeded. These are IAM gaps, not evidence those services are absent. Existing credentials were used without printing private keys or tokens.

To reconcile billing, export [Billing Reports](https://docs.cloud.google.com/billing/docs/how-to/reports) for October 1–23, filter project `homescope-ee781` and service Firestore, group by SKU and day, and include usage quantity/unit, location, gross cost, credits and net cost. Compare against the screenshot's scope. Include all Firestore SKUs, not just document reads. Minimum suitable access: project cost-view permission where sufficient, otherwise Billing Account Viewer; Logs Viewer, Cloud Run Viewer and Cloud Scheduler Viewer for attribution. No administrator role is needed. Check other linked projects if the original screenshot was account-wide.

## C. Code findings and operation coverage

All paths below are relative to the repository root. Detailed file/line/function call sites are in the inventory. `N` means matching documents, `U` owner-specific records, `S` schools, `A` enabled saved searches. Counts below are **code-derived expectations**, not per-route production measurements. Aggregations charge according to indexed entries; projections reduce bytes, not per-document read counts. Offsets charge skipped documents. See [Firestore pricing](https://cloud.google.com/firestore/pricing).

| Rank | File / function / feature | Trigger, collection, potential result | Cause / cost implication | Security, risk and resolution |
|---|---|---|---|---|
| 1 | `lib/listings/firestore-data.ts`, monthly stats wrapper; `lib/mls/sync/publicQueries.ts`, monthly source; city market pages | Each rendered market page; listings; N city rows + 5 aggregates per cold load | `asOfIso = new Date().toISOString()` was part of cache argument; new render defeats reuse | Public aggregate data only. Fixed by caching source by city and calculating exact as-of fields outside cache. Low risk; 15-minute existing policy retained |
| 2 | `lib/listings/service.ts/getPublicListings`, map API | Map all-items request; listings; N candidates plus previously a page/count | Indexed result was unused by map response | Fixed duplicate query; full filtering and all candidates preserved. Ordinary paginated path unchanged |
| 3 | `lib/mls/sync/publicQueries.ts/getFilteredListings`, private scan helpers | Cold advanced search, map, sitemap/full-list consumer; all GTA or city price matches in 500-row cursor batches | Beds/baths, neighborhoods, property types and bounding boxes can be applied after large reads; candidate cache keys include post-read filters | High potential impact, actual share unknown. Index/filter design and cache payload measurements next. Do not truncate results to save reads |
| 4 | Same file `getFilteredListingsPage` | Cold basic search; page size default 6, max 24, max 50 pages; one count plus offset+limit | Deep numbered pages incur skipped reads; all pages have distinct cache keys | Cursor plan must preserve URLs and navigation; deferred rather than break numbered links |
| 5 | Same file `getListingsNearCoordinate` | School search/radius; latitude range in batches up to 500, accepted candidates up to 2,500 in service | Longitude filtering occurs after reads, so scanned rows can exceed accepted-candidate cap | Geo indexes/Explain needed; expanding radius preserves existing behavior; no arbitrary read cap introduced |
| 6 | `components/admin/mls-sync-panel.tsx`, stats effect; `app/api/admin/listings-stats/route.ts` | Every 30 seconds while mounted, including hidden tab; 5 settings docs + 2 counts | Background polling and potentially overlapping requests | Token protected; interval cleanup exists. Visibility-aware/deduplicated polling deferred, lower priority than measured query volume |
| 7 | `hooks/useSavedHomes.ts/SavedHomesProvider` | Root owner query `savedHomes where userId==uid`; U initial docs, updates/reconnects; latest 12 public listings | One shared listener, cleanup on dependency change/unmount. Notes change creates a new savedHomes array and refetches listing details | Keep realtime for notes/saves and owner isolation. No evidence of one listener per card. Do not cache private notes globally |
| 8 | `lib/mls/upsert/upsertListings.ts/upsertNormalizedListings` | Each normalized feed item; point read + write, optional snapshot | Unchanged data still writes lastSeen/syncedAt; necessary for cleanup survival | Deliberately unchanged. Removing writes can make reconciliation delete valid properties. Production writes are minor relative to reads |
| 9 | `lib/searches/saved-search-alerts.ts/runSavedSearchAlerts` | Documented hourly scheduler, not each login; reads A enabled searches, skips not-due searches locally, queries listings per due search, writes checkpoint | Similar searches can repeat processing; uses existing 24-result/top-8 alert scheme | Keep notification correctness. Existing checkpoint-before-send risks lost retry; finite result window can miss bursts. Requires isolated delivery/retry redesign, not cost-only edits |
| 10 | `app/api/searches/route.ts`, `lib/searches/store.ts`, public chat/forms | Public submission: search log write; chat transaction; lead/contact writes | Direct unauthenticated requests can generate cost; client search tracker dedups only same mounted signature | Input validation exists but no shared cost rate limiter found. Attribute abuse and choose limits before changing legitimate workflows |

### Remaining query families

| Files / functions | Paths and frequency / result bounds | Repetition, pagination/cache, risk and recommendation |
|---|---|---|
| publicQueries public/featured/slug/MLS/city/agent functions | `listings`; cold public calls; public 500 via wrapper, featured 18 candidates, slug/MLS <=1, city caller limit; two agent queries unbounded before slice | Existing 15-minute caches. Agent queries can overlap and read hidden records before filtering. Push visibility/limits only after preserving ordering and permissions. Cards consume supplied listing data, not independent Firestore listeners |
| `lib/listings/firestore-data.ts/getPublicListingsByIdsFromFirestore` | listings `listingId in` chunks of 10; API accepts max 24 IDs; saved-home provider uses 12 | Public eligibility filtering remains server-side. Array order affects cache reuse. No private note data in cache. Verify uniqueness before replacing field query with document ID reads |
| `lib/listings/service.ts/getSimilarListingsForListing` | Up to 250 city candidates, then potentially broad layout search if insufficient | No extra realtime; broad fallback could be expensive on sparse cities. Preserve comparable results when optimizing |
| `lib/schools/firestore-data.ts/getSchoolDirectory` | Full schools collection per cold cache; S docs; one-hour cache | Radius changes reuse reference directory. Stable IDs on import; actual duplicate-content records not audited. School ratings/coordinates/boundaries retained. Explicit tag invalidation on import, rankings and geocode endpoints |
| school admin import/rank/geocode routes | S reads for rankings/geocode; geocode processing limit doesn't bound initial collection read; import batches of 400 writes | Admin-triggered, not each public search. Keep controlled freshness; incremental import/change hashes would need migration and source comparison |
| `hooks/useSavedSearches.ts`, `app/api/saved-searches/route.ts`, `lib/savedSearches.ts` | GET: U savedSearches on auth transition; create 1 write; patch/delete owner lookup + write/delete; legacy client add/update/delete helpers | API verifies token/ownership; no listener or login-triggered listing evaluation. Context avoids card-level queries; private cache must be per-user and cleared on signout |
| `lib/savedHomes.ts` | savedHomes deterministic owner/listing ID; save/notes 1 write, remove 1 delete; getUserSavedHomeIds reads U | Never share-cache user records. Notes capped at 3,000 chars. Keep rules and listener behavior. Offline pending write acknowledgements may refetch public details |
| `lib/showings.ts` | leads where userId; U docs per dashboard load, filtered for showings after retrieval | Authorized owner only, no listener. Add compound filtering only with rule/index and legacy-record parity checks; do not reduce freshness |
| `lib/admin/queries.ts` | Overview: 4 aggregate queries, 8 leads, 8 contacts, 1 scheduler doc. Detail limits: 300 leads/500 contacts | Overview already bounded, no entire collection just to count. Admin auth boundary important because Admin SDK bypasses rules. Detail pagination later if records approach limits |
| `app/admin/leads/page.tsx` update action | leads/{leadId}: 1 read, status write | Preserve auth, showing state and revalidation; low cost versus public scans |
| `lib/crm/contacts-store.ts` | crmContacts; list default 500, campaigns 5,000; import batches; save/upsert read+write, transactional consent changes | No shared cache; admin/private. Campaign cap may omit contacts at scale; pagination requires correctness work. Preserve deterministic IDs and consent |
| `lib/crm/templates-store.ts`, campaigns-store | crmTemplates entire list, individual read/write; crmSendLog bounded recent list; settings status doc | Templates few in expected design but actual size unknown. Authenticated admin only; cache only with mutation invalidation and no recipient leakage |
| `lib/crm/daily-campaigns.ts` | Templates + up to 5,000 contacts per run; deterministic send-log lookup per eligible contact/template, log writes + scheduler status | Checks existing sends, paced delivery, but read-then-send isn't a transactionally claimed job; overlapping execution risk. No audit emails sent. Distributed lock requires delivery-recovery tests |
| `lib/leads/store.ts`, contact-store, communications-store, contacts-store | leads/contactMessages: create + email status update; communications write; contacts transaction read+write for profile | Per submitted inquiry/contact; transaction retries may add reads. Preserve customer/consent data. Do not remove read-before-write where merging depends on it |
| `lib/chat/store.ts/appendChatConversation` | chatConversations/{id}; transaction read+write per exchange | Growing messages array rewritten, indexes/storage can grow. No retention deletion proposed. Authenticate ownership/validate conversation access before broader changes |
| `lib/settings/site-settings.ts`, `lib/market/report-content.ts` | settings/site cached; marketReports/{reportId} read/write for editorial reports | Existing site tag invalidation; editorial data caching must invalidate on edits. No new private cache |
| `app/api/admin/featured/route.ts` | listing ID chunks, two agent queries, 250-row fallback, single-doc validation; settings writes | Admin-only. Potential overlapping reads; cache/limit changes require preserving featured selection |
| `lib/mls/sync/*Cursor.ts`, stopSignal, scheduled/manual routes | settings cursor/status docs, read/write per batch/start/stop; stop check per feed page | Reads repeat but small; consolidation might reduce round trips, not necessarily document charges. Preserve resumability, backoff and recovery |
| `lib/mls/upsert/repository.ts`, staleCleanup and cleanupMisclassifiedKingstonListings | listings all-ID projection, stale/hidden/status/city scans; getAll in 250-ID deletion batches; listingSnapshots UUID writes | Projection still incurs reads. Existing cleanup deletes data; never invoked during audit. No TTL, retention or destructive schema change applied |
| `lib/firebase-sync/*`, `lib/mls/sync/scheduledJobs.ts` | Legacy abstraction/mock repository and alternate callable entrypoints | Admin adapter throws; no proof of active deployment. Three-hour comment conflicts with hourly documented HTTP schedule. Deployed scheduler inventory required before scheduling changes |

Map movement updates draft bounds locally in `listings-map-search-inner.tsx`; do not assume every move directly runs Firestore. Inspect the user-triggered navigation/request chain and request logs before implementing a debounce. No uncontrolled UI effect loop was established. `withRetry` has bounded exponential delays (default 3 retries); admin full-sync loop is bounded at 5,000 iterations but can perform substantial intentional work. No queue consumer was found in source. Deployed external workers remain unknown.

### Database, indexes and security

Large images/remarks/arrays and snapshots warrant index/storage review. `fieldOverrides` is empty locally; seven deployed listing composites are READY. Do not delete apparent unused indexes. Missing geo composite and 50,178 failed-precondition queries warrant log inspection, but error cause isn't proven. Single-field configs, historical index usage, individual document sizes and duplicate data were not exported.

Rules owner-scope saved homes/searches/leads, restrict public listings and deny unmatched paths. Server Admin SDK bypasses rules, so route authentication/eligibility checks remain essential. Local server and browser use the production project with no emulator configured. Keep integration tests disconnected from that project. No rules, indexes, schemas or production permissions were changed.

## D. Changes implemented

| File | Change |
|---|---|
| `lib/mls/sync/publicQueries.ts` | Split market database snapshot from pure month/as-of calculations; retain compatibility function |
| `lib/listings/firestore-data.ts` | Cache market source by municipality with new key and existing 900-second revalidation; compute exact requested dates after cache retrieval |
| `lib/listings/service.ts` | All-items callers go through the existing full-candidate filtering/sorting path without unused indexed page/count query |
| `tests/firestore-cost.test.cjs` | Isolated SDK/cache doubles; operation counts, output equivalence, expiry, city isolation, invalid city, failed-query recovery, regular pagination, map order and MLS branch |
| `package.json` | Add `test:firestore-cost` command; no new dependency |
| `docs/firestore-initial-audit-2026-10-23.md` | Pre-optimization findings and baseline |
| `docs/firestore-query-inventory-2026-10-23.md` | SDK call-site index |
| `docs/firestore-monitoring-2026-10-23.json` | Read-only aggregate cloud evidence |
| This report | Findings, verification, remaining work and rollout gates |

Cache policy: only **public market statistics source** cache changed. No property status/price/availability cache lifetime was extended. Market source uses established 15-minute revalidation, not an arbitrarily longer TTL. The timestamp still affects calculations, just not snapshot identity. Next.js stale-while-revalidate behavior can serve stale aggregate data during refresh/failure; this is not a guarantee of a strict 15-minute bound. Existing property caches lack reliable sync invalidation and can already show stale state; that pre-existing risk is unresolved and must be addressed before claiming guaranteed current availability. Private user data and showing state have no new shared cache.

## E. Before / after comparison

Measured using deterministic test doubles, **not emulator or production billing**:

| Equivalent scenario | Before | After |
|---|---:|---:|
| 3 city market renders, different as-of times, 5 source rows, within cache lifetime: document reads | 15 | 5 |
| Same scenario: query executions (5 aggregates + 1 row query per load) | 18 | 6 |
| Same scenario: result values | Reference results | Identical, including time-boundary changes |
| 3 all-items map searches: unused page/count helper calls | 3 | 0 |
| Same map scenario: full candidate loads | 3 | 3 |
| Writes/deletes by changed paths | 0 | 0 |
| Listener behavior | Unchanged | Unchanged |

Each eliminated cold page helper represents one count and one document query; actual billed savings depend on cache hits, result count and offsets. Map HTTP request frequency is unchanged. No credible response-time delta or production latency comparison was measured. Test runtime is not a network latency benchmark. Do not extrapolate the fixture's 66.7% reduction to the whole bill.

## F. Estimated savings

Dollar scenarios are **not supportable yet**: no billed SKU prices, per-route read attribution, cache hit rates or production after-period. A conservative lower bound is zero realized savings until deployment; even afterward low traffic on changed paths can make savings small.

For capacity planning only: if a city has N source rows, K renders during one effective cache interval, and one refresh suffices, source document reads change from K*N to N, saving (K-1)*N plus repeated aggregate work. Independent cache instances, evictions, revalidation failures and concurrent misses can reduce this benefit. Map savings are the removed page/offset read and count on cold calls, not the full scan. Obtain actual usage and SKU prices before assigning conservative/realistic/optimistic monthly dollar figures. The requested 60–80% target remains unverified.

## G. Verification

- Baseline and post-change TypeScript checks pass; lint passes without warnings; `git diff --check` passes.
- New regression suite: 2 tests pass, with multiple isolated scenarios and explicit operation counters. No live credentials or customer documents used.
- Existing listing metadata: 4 pass; neighborhood: 1 pass; SEO landings: 3 pass; school sitemap: 3 pass.
- Existing Form 410 tests: 1 pass, **2 fail**. Assertions expect `transactionType: "lease" as const` and the old `useSavedSearches`/`saveSearch` implementation in an unchanged rental component. Both test and component match HEAD; these are unrelated pre-existing source-contract failures and remain unresolved.
- Initial multi-file `node --test` launch hit sandbox `spawn EPERM`; direct per-file execution worked. Initial new map fixture lacked mlsNumber; corrected fixture and rerun passed.
- No production build or live browser mutation journey was run: this checkout's environment targets production, and build-time data fetching can hit it. No emulator was configured/launched. No claim of full end-to-end certification.

Before deployment, use an isolated Firebase project/emulator and test: basic sale/lease search, cities/neighborhoods, beds/baths/property type, pagination, detail links/metadata, map bounds, school 1/2/5-km searches, save/unsave, comparisons, login/logout/account switching, dashboard notes, saved-search alerts, showing requests, admin functions and mobile layout. Verify aggregate cache expiry in the actual Next runtime and market date boundaries. Do not use real customer accounts or send test alerts to customers. Existing SEO URLs, canonical metadata, sitemap code, calculators and guides were not edited.

## H. Outstanding risks and deployment readiness

1. Individual request attribution for 579 million reads is still missing. Full scans, cache payload failures, bots, alternate clients or workers may dominate. The two fixes are not a complete remedy for runaway usage.
2. 50,178 failed-precondition queries need Logs Viewer investigation. Avoid blind index deployment.
3. Property freshness already lacks reliable cache invalidation after sync. Design tags/invalidation for every writer (including failures/partial sync), and protect showing flows with current server checks before changing listing cache strategy.
4. Cleanup depends on lastSeen and includes deletes. No heartbeat write suppression or cleanup changes were made.
5. Scheduler overlap and alert delivery checkpoint ordering need separate correctness tests. Existing limits/caps may affect completeness at scale.
6. Production inventory, other consumers/environments, network charges, billing SKU mix and storage/index breakdown remain unverified.
7. Live Next cache persistence/size behavior and browser journeys require staging validation. No release approval or deployment was performed.

Review the diff; run staging checks above; resolve/rebaseline unrelated Form 410 assertions separately. Deploy only after explicit authorization. Rollback: revert the three application files and redeploy the prior application revision; no data migration or index rollback is required. The new market cache namespace can remain unused safely after rollback. Compare equivalent traffic periods before/after; do not use raw daily cost alone when traffic changes.

## I. Recommendations and monitoring plan

1. **Highest priority:** get SKU export and Logs Viewer. Group read volume/error trends by route/service where logs permit. Check cache oversize errors, cache hit/miss behavior, repeat parameter signatures and crawler traffic. Log only normalized route/query fingerprints and counts, not contacts, notes, tokens or raw private filters.
2. Inspect large full-search queries using Query Explain in a controlled environment, including scanned index/document counts. Validate result parity before pushing more filters to Firestore or introducing cursors. Separate map requirements from card pagination. Keep existing URLs.
3. Resolve listing freshness/invalidation with all sync writers before increasing caching. Consider deduplication of identical in-flight public queries without a new caching library. Avoid indefinite caches and client-private shared persistence.
4. Then address hidden admin polling, saved-note-triggered refetches and redundant per-job metadata reads. Keep realtime where product value exists; do not replace it with aggressive polling.
5. Review index exemptions for large unqueried payloads, snapshot retention and duplicate school records only with source evidence and explicit migration/retention approval. Do not delete data automatically.
6. Establish an initial **$100 USD monthly monitoring budget**, alerts at **50%, 75%, 90%, 100%**, optionally forecast notifications. This is a warning target, not a spending cap; [Google Cloud budgets](https://docs.cloud.google.com/billing/docs/how-to/budgets) do not automatically stop services. No budget or infrastructure configuration was applied; explicit authorization is required.

Suggested daily dashboard: Firestore net cost and quantity by SKU; database-scoped read/write/delete trends; storage/index growth; listener counts; RunQuery failures; Cloud Run requests/latency/errors and spending; scheduled job completion/failure and freshness. Compare hourly read/request baselines and flag sustained deviations, with thresholds tuned to observed traffic. Do not automatically disable billing, synchronization, or production services. Reconcile cost daily accounting for reporting delay; verify savings over at least one representative traffic/sync cycle after an approved rollout.
