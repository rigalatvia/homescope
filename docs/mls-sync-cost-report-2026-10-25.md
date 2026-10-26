# MLS synchronization cost optimization — October 25, 2026

## Status

Implemented and tested locally. **Not deployed; the production schedule has not been changed.** No production listing writes, deletions, full sync, social posts, or new cloud services were performed during this work.

Read-only inventory requests using the existing project credentials returned `403 PERMISSION_DENIED` for Cloud Scheduler in `northamerica-northeast2` and `us-central1`, and for project-wide Cloud Run and Cloud Functions listings. Deployed job names, duplicate jobs, service revisions, runtime configuration, and active triggers remain unverified. The application must be deployed and the existing scheduler updated by an operator with the appropriate IAM access.

## Existing implementation and schedule

- The live application code path is Next.js `/api/internal/mls-sync/scheduled` → `lib/mls` runners → DDF connector → Firestore `listings` and `listingSnapshots`.
- The documented previous MLS schedule was **hourly**, `0 * * * *`. The route identified itself as `hourly_incremental`, drained up to 20 incremental batches, and attempted a bounded reconciliation batch approximately every 24 hours. A successful HTTP response could still contain incomplete work.
- `scheduledJobs.ts` contained alternate callable entrypoints, including a three-hour full-sync description. These were declarations, not proof of deployed scheduler jobs. They now all delegate to the same daily gate and lease.
- `firebase/functions/src/index.ts` exports a lead-created logging trigger, not an MLS scheduler. It is unchanged. The legacy `lib/firebase-sync` scheduled scaffolding uses a mock connector and an unimplemented Admin adapter; it is not the application's production MLS path.
- Unchanged MLS documents previously received `lastSeenInSourceAt`, `syncedAt`, and server timestamp writes. Each incremental batch also ran repeated maintenance queries. Unavailable/missing records were physically deleted.

## New schedule and reliability

The required deployment configuration is **`0 4 * * *`, timezone `America/Toronto`**, on one existing MLS HTTP job. This is 04:00 every Toronto calendar day: the UTC interval is 23 or 25 hours on DST transitions, rather than exactly 24 hours. Cloud Scheduler supports IANA timezone configuration; see [Google's scheduling documentation](https://docs.cloud.google.com/scheduler/docs/configuring/cron-job-schedules).

- Keep `/api/internal/mls-sync/scheduled` and its existing scheduler-token authentication.
- Do not change saved-search alerts, social processing, CRM, or other unrelated schedules.
- Successful duplicate delivery on the same Toronto date skips MLS work. Manual admin sync remains available independently.
- All active manual/full/incremental/reconciliation entrypoints share a transactionally acquired, renewable 20-minute Firestore lease. Each listing, snapshot, manifest and cursor write checks ownership inside its transaction. An expired or replaced worker cannot commit. A crashed worker's lease eventually expires.
- Cursor fields change atomically. Each completed page saves its continuation, so an interrupted request resumes safely. A final failed checkpoint write replays records without duplicate listing or snapshot writes.
- Incremental completion advances its own checkpoint; the daily completion marker is written only after incremental processing **and** reconciliation succeed. A later reconciliation failure does not invalidate a successfully processed incremental stage.
- Incomplete daily requests return **503**, overlapping requests **409**, and failures **500**, allowing bounded retries of the same job. Defaults keep processing within a 240-second application budget; DDF timeouts/retries respect the remaining budget. The scheduler script allows a 900-second attempt deadline and retries within six hours. These retries are continuations, not additional recurring schedules.

## Firestore and MLS changes

**Incremental updates are supported in the existing connector.** It queries the current DDF endpoint using `ModificationTimestamp gt <checkpoint>`, follows the feed continuation links, and preserves non-active status handling when those records are returned. This was verified with an intercepted HTTP fixture, not a live MLS query.

- Compare all normalized listing fields, excluding synchronization time, raw hash metadata, and source-modification metadata alone. No listing write or snapshot is generated for unchanged business data. No blanket hash migration is needed.
- Deduplicate incoming IDs. Fetch stored documents with `getAll` in groups of 100. A bounded, execution-local 2,000-entry cache avoids repeated reads where possible; large sweeps may evict entries. Normal incremental comparison never loads the whole collection.
- Batch changed listing documents and their history snapshots atomically. Pages are capped at 100 listings; the fenced writer caps transaction chunks at 400 document writes plus one lease write. The installed Firestore SDK retries retryable transaction failures, including conflicts, deadline-exceeded and unavailable errors. Failed requests retain their cursors for later retries.
- Preserve stable listing IDs, creation dates, existing document fields, public visibility rules, and social discovery markers. Deep comparison also avoids snapshots caused solely by new array object instances.
- Remove repeated legacy King-area/hidden/non-active collection maintenance from active sync runners. Current visibility normalization and complete source reconciliation cover unavailable listings without physical deletion.
- Retain sold, leased, suspended, expired, terminated, and otherwise ineligible existing documents with `isVisible: false`. Never create every out-of-area or never-public feed record. A missing incremental row is never treated as removed.
- A full/reconciliation sweep records one compact ID manifest per feed page instead of touching every unchanged listing. Only after every page is verified does it query the source's visible listings with a field projection and hide missing IDs. Recently updated records from after the sweep began are preserved. Empty or incomplete manifests fail closed; missing manifest pages automatically reset the cursor for a safe restart.
- Reconciliation manifest page IDs are reused, so storage is bounded by the largest sweep per source/mode. These are recovery state, not historical logs. Legacy `lastSeenInSourceAt` is retained but no longer used for removal decisions.
- Keep a fixed initial lookback on first-run failure. Manual `since` overrides are stored separately from the successful checkpoint. After complete incremental processing, use the sweep start minus a five-minute overlap to catch boundary changes. Short/empty intermediate pages with a next link are not mistaken for completion.
- Reject malformed feed envelopes, malformed rows, and rows without stable IDs instead of advancing the checkpoint or inventing timestamp-based IDs. Reuse the connector/OAuth token during one execution.

## Social automation and website compatibility

The RE/MAX METROPOLIS REALTY eligibility rules and social worker code were not changed. No advertising authorization checks were added. New listings receive the existing durable discovery marker once. Existing/unchanged listings and reactivated documents do not receive a new discovery marker. Atomic listing/snapshot commits and stable IDs make retries idempotent.

Public UI, Firestore security rules, search/filter code, saved homes/searches, dashboards, comparisons, showing requests, and school-search code were not edited. Public queries continue using existing visibility fields. Retaining hidden documents also preserves stored IDs referenced by user data. This is source-level compatibility plus isolated regression coverage, not a claim that all authenticated production flows were exercised.

## Measured and estimated savings

| Area | Evidence or estimate |
| --- | --- |
| Recurring MLS invocations | Documented 24/day → configured 1/day: **95.8% fewer nominal starts**, once deployed. Continuation retries and manual runs add executions. This is not a measured total Cloud Run or billing reduction. |
| Unchanged listing writes | Isolated 100-listing fixture: **100 legacy touch writes → 0 listing writes**, 100 listing reads, no snapshots or discovery writes. The shared lease adds two writes for this isolated operation. |
| Repeated IDs | Two identical pages in one execution read the distinct listing once and write it zero times. Cache eviction can reduce that benefit on large sweeps. |
| Reconciliation bookkeeping | Approximately one manifest write per 100 returned rows replaces per-listing touch writes, with additional bounded cursor and lease operations. |
| Repeated maintenance | Collection maintenance queries no longer run before every incremental batch. Cursor documents are cached during an execution; redundant cursor writes are skipped. |

**Total Firestore-read or dollar savings cannot be guaranteed from these fixtures.** Complete reconciliation still reads the feed and matching stored documents, and its final projected visible-inventory query is billed per matching document. That final scan trades reads for avoiding per-listing timestamp writes. A complete daily sweep may do more work than the previous bounded/incomplete cleanup. Compare the new structured operation totals against production Monitoring after deployment.

Remaining cost sources include daily complete reconciliation, actual changed-listing/history writes, retained hidden records and snapshots, existing map/large candidate searches, saved-search alert queries, other website traffic, and independent social/CRM processing. Those workloads were not disabled or redesigned.

## Logging

JSON `mls_sync_started`, `mls_sync_finished`, and `mls_sync_daily_summary` events include start/end times, duration, retrieved/new/changed/unchanged/inactive counts, application-observed document reads and acknowledged writes, and terminal failures. Per-execution counts include lock/cursor/manifest work and committed portions of a later-failed reconciliation. Internally recovered RPC retries, unacknowledged server commits, index charges and billing totals are explicitly outside the measurement scope. The daily status document is overwritten; logs are not appended to Firestore.

## Tests and results

| Check | Result |
| --- | --- |
| `npm run test:mls-sync` | **19 passed**: unchanged/new/modified records, atomic history, status transitions, page/checkpoint failures, fixed lookback, manual overrides, short pages, empty/partial reconciliation, legacy/missing-manifest recovery, concurrent/replaced workers, daily duplicate suppression, runtime limits, retryable HTTP responses, logging counts, DDF filtering/validation/OAuth, and partial batch recovery. |
| `tests/scheduler-config.test.ps1` | Passed with intercepted cloud calls: read-only preview, exact-target duplicate pause, schedule/timezone/retry update, preserved unrelated HTTP/PubSub jobs, and redacted output. No real scheduler mutation. |
| `npm run test:social` | **14 passed**, including exact brokerage identity and duplicate publication/discovery protections. |
| `npm run test:firestore-cost` | **2 passed**, including map filtering/order and market-cache behavior. |
| Listing metadata / property-search landings / school sitemap / neighborhood filters | **4 / 3 / 3 / 1 passed**. |
| `npm run typecheck`; `npm run lint` | Passed; no ESLint warnings/errors. |
| Existing rental conversion source tests | **1 passed, 2 failed**: assertions expect `transactionType: "lease" as const` and `useSavedSearches` in the current rental experience source. The test and both inspected rental source files match HEAD and were not changed. These are pre-existing failures. |

The Node multiprocess test launcher initially returned sandbox `spawn EPERM`; direct per-file execution ran the tests successfully except the two pre-existing rental assertions above. No live full sync, database rewrite, Meta publish, or authenticated production-browser walkthrough was used for testing.

## Deployment handoff

1. Use an authenticated Google Cloud operator account able to list/update/pause/resume Scheduler jobs and inspect/deploy the existing application. `gcloud` is required by the supplied script. Identify the existing main MLS job's full resource name; inventory access was denied in this session.
2. Inspect all deployed scheduler/function targets, including alternate URLs and Pub/Sub-triggered legacy MLS jobs. Disable only verified obsolete MLS sync triggers. The script automatically handles duplicates of the **exact** supplied HTTP target; it cannot identify arbitrary legacy functions by intent.
3. Temporarily pause MLS schedules and wait for any old revision's in-flight MLS run to finish. Deploy the changed application through the existing release process. Verify hosting timeout supports the selected runtime budget. This avoids an old worker, which does not know the new lease, racing the new code.
4. Preview the existing job update (substitute its verified resource name):

   ```powershell
   ./scripts/configure-mls-daily-schedule.ps1 -JobName 'projects/homescope-ee781/locations/REGION/jobs/EXISTING_JOB'
   ```

   Review the sanitized inventory, then run the same command with `-Apply`. The script updates the existing job, preserves authentication headers, pauses exact-target duplicates, leaves unrelated schedules unchanged, and verifies one active exact-target job at `0 4 * * *` in `America/Toronto`. It creates no jobs or services.

5. Observe the next daily execution. Check all continuation attempts, the final `completedDay`, incremental checkpoint, no active lease after completion, and the structured summary. A legacy incomplete reconciliation cursor restarts safely from page 1; there is no required listing rewrite or schema backfill.
6. Verify search/detail pages, an authenticated user's saved homes/searches/dashboard/comparisons, showing requests, school search, and admin/manual sync against the deployed revision. Check social discovery/jobs for duplicates without introducing live test posts.
7. Compare at least several complete daily cycles in Monitoring and JSON summaries. If retries exhaust, resolve the feed/runtime error and retry the same job; do not advance the checkpoint manually to hide the failure.

Rollback caution: pause MLS jobs before any rollback. Do not run the old timestamp-based cleanup against records that stopped receiving timestamp touches; it could wrongly remove unchanged listings. Keep the safe reconciliation path until rollback data handling has been reviewed. Do not perform a blanket production rewrite as a deployment step.

## Files changed

- `app/api/internal/mls-sync/scheduled/route.ts` — daily runner and retryable responses.
- `app/api/admin/mls-sync/route.ts` — shared lease around cursor reset and manual execution; no physical-deletion counts.
- `lib/mls/sync/dailySync.ts` — daily gate, incremental/reconciliation orchestration, bounded runtime and status.
- `lib/mls/sync/execution.ts` — fenced transactions, operation counters, execution cache and runtime budget.
- `lib/mls/sync/reconciliation.ts` — bounded page manifests and safe source-scoped hiding.
- `lib/mls/sync/runFullSync.ts`, `runIncrementalSync.ts`, `runStaleCleanup.ts`, `runSync.ts` — existing runners adapted to shared safety/cost behavior.
- `lib/mls/sync/fullSyncCursor.ts`, `incrementalSyncCursor.ts`, `cleanupCursor.ts` — atomic, cached cursor state.
- `lib/mls/sync/createConnector.ts` — execution-local connector/token reuse.
- `lib/mls/sync/scheduledJobs.ts` — legacy callable names delegate to the daily runner.
- `lib/mls/sync/stopSignal.ts` — operation instrumentation.
- `lib/mls/connectors/DdfTrebFeedConnector.ts` — runtime-aware requests and malformed/unstable-record rejection.
- `lib/mls/upsert/upsertListings.ts` — meaningful comparisons, deduplicated/batched reads, atomic changed-only writes/history, retained hidden records.
- `lib/mls/types/index.ts` — explicit completion and legacy timestamp documentation.
- `scripts/configure-mls-daily-schedule.ps1` — preview/apply and verify the existing cloud job.
- `tests/mls-sync.test.cjs`, `tests/scheduler-config.test.ps1`, `package.json` — regression coverage and test command.
- `README.md`, `docs/INFRASTRUCTURE_GUIDE.md`, this report — schedule, operational behavior and deployment documentation.
