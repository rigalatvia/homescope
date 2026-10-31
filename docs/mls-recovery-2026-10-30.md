# October 30 sync recovery

The 04:00 request on revision homescope-build-2026-10-29-003 was terminated for exceeding 512 MiB. Two retries encountered the lease. The fourth resumed incremental page 11, completed incremental work, and stopped cleanup after page 50 with `complete: false`.

## Local changes

- New incremental/cleanup sweeps request at most 50 rows per page. Existing opaque provider cursors are preserved exactly; an in-progress sweep can therefore retain its previous page size until it ends.
- Release the previous page's full-document listing cache before fetching another page.
- Check process RSS before each feed page. At 400 MiB, return partial with a saved cursor and release the lease. This is preventive headroom, not a guarantee against a large single response or concurrent website allocations. The new `mls_sync_memory_yield` event distinguishes this from an OOM kill.
- Continue cleanup in bounded ten-page batches within the existing runtime budget, instead of unconditionally ending the HTTP request after ten pages. Stop signals and memory/time pauses stop the outer loop too.
- Reduce Next.js's duplicate in-process cache budget from its 50 MiB default to 16 MiB. Filesystem caching and the existing revalidation intervals remain enabled.
- Memory allocation, concurrency, daily 04:00 Toronto schedule, brokerage saving, and manual-only social workflow are unchanged.

## Rollout and verification

Deploy the website through the existing App Hosting rollout. This is not a Firebase Functions change. Local tests simulate pressure and validate checkpoint recovery; they do not prove the production memory problem is eliminated.

The live Scheduler job also needs sufficient continuation retries. The existing `scripts/configure-mls-daily-schedule.ps1` prepares retry count 5, maximum retry duration 21600 seconds, minimum/maximum backoff 300 seconds, and attempt deadline 900 seconds. Keep cron `0 4 * * *` and timezone `America/Toronto`. These are retries of unfinished work, not additional daily cron schedules. Google retries until both the count and duration limits are reached when both are specified: https://docs.cloud.google.com/scheduler/docs/configuring/retry-jobs

Live settings could not be read from this machine: gcloud is absent and Application Default Credentials are unavailable. No cloud configuration was changed.

After rollout and retry configuration, resume the existing job. Verify `mls_sync_daily_summary` reaches `complete: true`, that saved cursors progress across memory yields, and that the new revision has no memory-limit termination. Do not reset cursors or run a new full import. If every attempt yields without progress, inspect the website's baseline memory rather than raising the limit blindly.
