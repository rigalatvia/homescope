# Daily MLS reliability repair

## Evidence

The October 27 export shows a partial run at 04:08 Toronto time, a sync request killed for memory on the next attempt, a locked retry at 04:12, and another instance exceeding 512 MiB at 04:21. The partial run recorded 29,024 application-observed document reads and 1,139 writes. These are not the entire day's billing totals.

## Local changes

- Scheduled cleanup now builds the active-feed manifest without upserting each feed listing again. Incremental sync still creates/updates listings, including brokerageName. Social cards are created only through admin actions. Manual cleanup/full sync retains its repair behavior.
- This removes the second per-feed-record Firestore read in daily cleanup, including reads for nonpublic records that were never stored. It still fetches the source feed and performs one projected comparison of visible stored records to detect removals. This is not a zero-read cleanup.
- Final comparison reads at most 400 projected records per page instead of retaining the complete Firestore result.
- Renewable, fenced lease expires two minutes after the last write instead of twenty. A worker with an expired/replaced lease cannot commit. Long stalls may safely fail and resume.
- Execution caches are cleared at completion. Progress logs use single-line structured JSON, and batch logs explicitly distinguish partial work from full completion.
- No App Hosting memory or concurrency overrides are included. The proposed 1024 MiB/concurrency 8 configuration was removed before deployment at the user's request to prioritize lower cost. Reliability at the existing resource settings still requires production verification.
- A sourceSystem/isVisible/document-ID index is included for the paginated reconciliation query.

Daily cleanup no longer serves as a second full import: a listing arriving after the incremental cutoff is handled by the following incremental run. Manual full sync remains available for a deliberate backfill.

## Rollout

1. Deploy indexes: `firebase deploy --only firestore:indexes --project homescope-ee781`. Wait until the new listings index is Enabled.
2. Deploy the application through its normal Firebase App Hosting rollout, preserving existing memory and concurrency settings. This is not a Functions-only deployment. This repair includes no runtime capacity increase.
3. Verify/update the existing job's retries. The repository's configure-mls-daily-schedule.ps1 has a read-only preview by default and -Apply to apply the reviewed configuration: daily 04:00 America/Toronto, 900-second attempt deadline, retryCount 5 plus a six-hour retry duration (both limits must be reached), 300-second minimum and maximum backoff. It also pauses duplicate exact-target jobs, so review its preview first. The desired retry configuration is not confirmed live.
4. Retry the existing daily job, preserving its checkpoints. Do not delete the lease or advance cursors manually. Existing old-version leases can take twenty minutes to expire after a crash; new-version leases expire after two.
5. Confirm a structured mls_sync_daily_summary with complete:true and failed:0, and settings/mlsSchedulerStatus.completedDay for the Toronto date. A mls_sync_finished event alone only means an invocation ended.
6. Check system memory errors and Cloud Run memory utilization across the entire run and normal website traffic. Compare daily totals after successful runs; do not infer whole-day savings from one partial summary.

## Validation

24 isolated MLS tests pass, including interrupted checkpoints, missing manifests, partial reconciliation commits, overlap rejection, expired-owner fencing, absence of social draft writes during sync and zero listing-document reads during a daily cleanup feed page. Typecheck and lint pass. No production sync or live deployment was performed by this repair; gcloud is unavailable in the current shell.

Runtime setting reference: https://firebase.google.com/docs/app-hosting/configure

## Comparison with the pre-daily version (3d7e80b)

The prior route already had a 240-second incremental processing window and a 20-batch cap. The earlier explanation that multi-batch incremental processing was new was incorrect. The substantive change was repeatedly invoking cleanup in one request rather than processing one cleanup batch. Restored the 20-batch incremental cap and one cleanup batch of at most 10 pages per request. Kept partial retry responses: the old route returned success for incomplete work and marked cleanup attempted even when its sweep was incomplete. A literal rollback would preserve those defects and the old destructive cleanup behavior.

Regression test verifies a 12-page sweep stops at page 10, resumes at 11, and does not repeat incremental sync. More short requests are required to complete a daily sweep, so deployed retry settings must be verified; the schedule itself remains once daily. At the observed roughly 400-page sweep, expect about 40 cleanup attempts, not one invocation. No claim of lower total Cloud Run cost is made without production measurements.

The Scheduler helper previously proposed an invalid retryCount of 30. Corrected it to 5 with a six-hour duration and five-minute backoff; Google documents that both retry limits must be reached when both are configured: https://docs.cloud.google.com/scheduler/docs/configuring/retry-jobs .
