# HomeScope GTA social automation — development report

Date: October 23, 2026 (America/Toronto)

## Delivery status

Implemented locally, with live publishing OFF. No application deployment, production Firestore writes, Storage uploads, scheduler changes, Meta posts, or Meta comments were performed in this session. Meta publishing is tested with mocked HTTP responses, not certified against a live account.

The earlier Firestore investigation and two cost fixes remain in this working tree; see [Firestore report](firestore-cost-report-2026-10-23.md). They have not been deployed, and actual billing savings have not been measured.

## Public content requirements

- Public caption and slide templates do not print MLS numbers. MLS identity remains internal for administrative lookup and duplicate prevention.
- Captions do not include the source listing agent's name or describe Yan as the listing agent. Yan's name and telephone are contact branding.
- Both platforms receive a separate property-link comment immediately after the confirmed post, before the optional permalink lookup.
- The property URL is absent from the main caption. The first comment uses the existing canonical HomeScope GTA property URL. Existing website slugs may themselves contain the listing identifier; canonical routes were preserved.
- Source image watermarks are preserved. No AI photo editing, invented room labels, or fabricated property facts.
- A non-MLS HS reference in each caption supports recovery after a publication timeout.
- Admin caption edits reject MLS wording, the actual MLS identifier, “listing agent,” and “my listing.”

## Verified feed fields and matching

Read-only live inspection of the configured DDF feed established that Property has ListOfficeKey and ListOfficeNationalAssociationId, but no ListOfficeName. The old connector assumed a field unavailable in this connection.

The Office resource returned these exact records:

| OfficeKey | OfficeNationalAssociationId | OfficeName |
| --- | --- | --- |
| 282777 | 1321336 | RE/MAX METROPOLIS REALTY |
| 298485 | 1470118 | RE/MAX METROPOLIS REALTY |

The checked-in resolver accepts those listing-office keys only for sourceSystem toronto-board-ddf. When a key exists, it takes precedence; an unknown key is rejected even if the supplied name looks correct. Without a key, the name matcher accepts only the normalized exact name or that name followed by “Brokerage,” ignoring punctuation and case. Buyer-office fields, co-listing-office fields, agent names, and remarks are never used for eligibility.

The normalizer retains office identity and explicit source display restrictions. Active status, public visibility, canonical identity, and source permission checks are required again before publication. Changing a provider/source identifier requires reviewing the scoped resolver; do not reuse numeric keys across providers.

## MLS integration and durable discovery

On a newly inserted listing, the existing listing write includes socialDiscoveredAt and socialDiscoveryPendingAt. Existing-listing updates do not reset these fields. No Meta calls, image downloads, or Storage writes run inside MLS synchronization.

The separate worker consumes up to 40 pending markers per run in discovery order. It creates a deterministic SHA-256 job ID for just_listed plus listing ID, then removes the pending marker. A crash after job creation but before acknowledgement is safe: the next run finds the same job and acknowledges it. Late sync commits cannot fall behind a moving discovery cursor.

First activation records an immutable watermark. A one-time baseline scans existing IDs in bounded pages of 400, projecting only listingId and createdAt. It stores minimal exclusion tombstones, including for legacy documents with no brokerage data. Automatic jobs wait for baseline completion. Pre-watermark discoveries are excluded; deleting and reimporting an excluded ID does not make it a new campaign. Manual dry runs of existing eligible listings are allowed.

No full duplicate listing database is maintained. The baseline does incur one initial read and one small exclusion write per existing listing. Discovery acknowledgement adds one small update per newly discovered listing. At five-minute cadence, baseline duration depends on inventory size (400 IDs per run).

## Database and storage

New server-only collections:
- propertySocialPosts: durable campaign, independent platform state, assets, captions, retries, post IDs, comment IDs, errors and timestamps.
- socialActivationExclusions: hashed listing ID, original listing ID, activation timestamp.

New settings documents:
- settings/socialAutomation
- settings/socialWorkerLease
- settings/socialSchedule
- settings/socialDispatch

New optional listing fields: listingOfficeName, listingOfficeKey, socialRestricted, socialDiscoveredAt, socialDiscoveryPendingAt.

Existing Firestore rules deny unmatched collections to browser clients. All social access goes through the existing authenticated admin API. No new composite index is expected: pending discovery and due-job selection use single ordered fields, with document ID tie breaking. Confirm this in staging before rollout. No index or data migration was run. The first routine feed sync backfills new office fields through normal upserts; no forced full resync is required.

Assets use the existing Firebase Storage bucket under social/{campaign-id}/navy-editorial-v1/slide-N.jpg. Download-token HTTPS URLs are stored in the job and anonymously fetched for validation before marking generation ready. Paths are reused for unpublished regeneration, with at most seven slide objects per campaign. No bucket-wide public rules were introduced.

## Carousel generation

Sharp renders JPEGs at 1080 × 1350 using the actual public/logo-header.png, navy, cream, and gold styling. Original photos are contained without cropping property content; blurred framing fills unused space. Feed photo order is retained because reliable room-classification metadata is unavailable.

Selection examines at most 12 source URLs, rejects broken/low-resolution images, normalizes orientation, and deduplicates decoded thumbnails. Two photos produce a four-slide fallback; three or more produce five to seven slides. Two distinct usable images are required. Downloads require exact HTTPS host allowlisting, validated public DNS addresses pinned to the connection, restricted redirects, size limits and deadlines.

Facts come from normalized source fields: price, city, bedroom/bathroom counts, type and area where known. Generation failures receive bounded worker retries; administrators can regenerate after correcting the source/configuration.

## Instagram, Facebook and comments

Instagram creates carousel children, creates a parent container, polls readiness with a bounded limit, then calls media_publish. Facebook uploads unpublished photos and attaches all of them to one feed post.

Both preserve intent before an irreversible publish call. Uncertain responses enter read-back reconciliation instead of automatic reposting. Confirmed IDs remain authoritative, even if a later comment/permalink request fails. Token errors, rate limits and transient errors have separate bounded retry behavior. Per-platform recovery does not repost the other platform.

First comments have their own persisted intent, outcome, attempt count, retry time and ID. Uncertain comments are reconciled against matching text and account identity; a missing result is not treated as proof that the comment failed. Up to three pages are inspected per reconciliation, and automatic reconciliation stops after five checks. The dashboard exposes comment retry/reconciliation separately.

The system submits the property comment immediately, but cannot guarantee that another person will not comment first during the publication-to-comment interval. Instagram comment URLs may need to be copied into a browser. Link-in-bio language remains available for Instagram discovery.

## Scheduling and admin

Admin route: /admin/social, linked from the existing admin navigation.

Controls include dry-run generation, carousel and caption review, caption edits, regeneration, scheduling settings, enable/disable, publish now, cancellation, per-platform retry/reconciliation, first-comment recovery, connection health, manual refresh, and a bounded queue step. Pagination loads 30 campaigns. There is no automatic dashboard polling.

Defaults: two property campaigns per Toronto calendar day, minimum four-hour spacing, 09:00–20:00 America/Toronto. Publish now still obeys these limits. Slot reservation and actual dispatch are persisted separately. Both platform posts for the same property share a dispatch allowance. A ten-minute fenced worker lease prevents concurrent workers from saving the same job; endpoint duration is capped at five minutes.

Notifications are dashboard-only: failures are visible; choosing all updates also shows success notices. No email, SMS or external notification provider was introduced.

## Meta setup and environment

Use a Meta app connected to the intended Facebook Page and its linked Instagram professional account. Supply credentials through server environment variables or the existing Secret Manager mechanism; never NEXT_PUBLIC variables.

Required:
- META_APP_ID
- META_APP_SECRET
- META_GRAPH_API_VERSION — explicitly choose a supported version for the app
- META_FACEBOOK_PAGE_ID
- META_INSTAGRAM_ACCOUNT_ID
- META_PAGE_ACCESS_TOKEN
- SOCIAL_AUTO_PUBLISH_ENABLED=false initially
- SOCIAL_PHOTO_HOSTS — exact comma-separated feed/CDN hosts; this connection's verified preview used ddfcdn.realtor.ca
- Existing FIREBASE_STORAGE_BUCKET and server Firebase credentials
- Existing MLS_SCHEDULER_TOKEN for the worker endpoint

The connection check requests instagram_basic, instagram_content_publish, instagram_manage_comments, pages_read_engagement, pages_manage_posts, and pages_manage_engagement. Account roles, business asset assignment, app review/access level, and any additional permissions required by the selected API version must be verified with the actual app. The check validates token validity, app identity, expiration, linked Page/Instagram IDs and Instagram quota.

Official reference entry points:
- [Meta's Instagram API collection](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api)
- [Instagram media comments](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-media/comments/)
- [Graph object comments](https://developers.facebook.com/docs/graph-api/reference/object/comments/)
- [Instagram content publishing](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/content-publishing/)

Meta developer reference pages returned HTTP 429 during this investigation. No current API version is guessed or hard-coded. The collection description was accessible, but full endpoint/version/permission verification remains an activation prerequisite. No live Meta credentials or app permissions were verified.

## Tests and preview

Passed:
- npm run typecheck
- npm run lint
- npm run test:social — 14 focused tests
- npm run test:firestore-cost — 2 tests
- npm run test:seo — 4 tests

Social tests cover exact and negative brokerage matches, source scope, public-content requirements, visibility/restrictions, deterministic IDs, 20-listing scheduling across Toronto DST, host validation, photo deduplication and dimensions, one multi-photo/carousel post, first comments, uncertain outcomes, account-checked comment reconciliation, independent platform failure, token failure, bounded rate-limit retry, dry-run exclusion, legacy baseline/reimport exclusion, late sync arrival, concurrent workers and expired-lease fencing.

Firestore tests use an isolated in-memory test double, not an emulator or production. Meta tests use mocked HTTP transport. There has been no end-to-end admin browser journey, production build, Storage upload validation against the live bucket, or live Meta publication. Existing unrelated Form 410 source-contract failures are recorded in the Firestore report.

Real read-only preview:
- Toronto condo at 36 Lisgar, sourced from verified office 282777.
- Six real source photos; seven generated slides.
- Canonical HomeScope GTA property page fetched successfully.
- First and last slides inspected individually; all seven inspected in a contact sheet.
- Local preview: ../tmp/social-preview/index.html
- Contact sheet: ../tmp/social-preview/contact-sheet.png
- Caption and first-comment text: ../tmp/social-preview/captions.json
- No dry-run assets were uploaded or posted. This existing listing is a manual-preview example, not an automatic “new discovery.”

## Activation sequence

1. Review this diff and complete isolated staging/admin browser checks. Verify current Meta API documentation, app access, account permissions, and the deployment runtime's Sharp support.
2. Deploy the application through the normal release process with SOCIAL_AUTO_PUBLISH_ENABLED=false. Provision the server credentials and exact photo hosts.
3. Let routine MLS sync populate verified office fields. In /admin/social, generate an eligible dry run. Inspect every slide/caption, the first-comment link, and anonymous Storage URLs.
4. Configure the existing Cloud Scheduler infrastructure to POST /api/internal/social/process every five minutes, with x-scheduler-token carrying MLS_SCHEDULER_TOKEN. Scheduler/runtime timeout must accommodate generation. Do not put the token in a URL.
5. Check Meta connections. Enable the server live switch, then enable automation in the admin dashboard. This creates the activation watermark; the initial baseline must complete before automatic jobs run.
6. Perform the first real publication only through an explicitly administrator-initiated test. Confirm the Instagram carousel, Facebook multi-photo post and both property-link comments on their actual platforms.
7. Monitor queue age, errors, token health, comment status and dispatch limits. Keep the default daily limit until the full path is confirmed.

Emergency stop: turn automation off and/or set the server switch false. Existing posts are preserved. Uncertain outcomes require reconciliation; do not delete publication records to force retries. Rollback the application release while retaining the publication ledger and activation exclusions.

## Changed files

New:
- lib/mls/config/listing-offices.ts
- lib/social/{types,policy,images,render,storage,meta,store,worker,admin}.ts
- app/admin/social/page.tsx
- app/api/admin/social/route.ts
- app/api/internal/social/process/route.ts
- components/admin/social-automation-panel.tsx
- tests/social-automation.test.cjs
- this report and local preview artifacts

Modified:
- MLS connector, normalizer, types and upsert module
- app/admin/layout.tsx
- .env.example
- package.json and package-lock.json (Sharp dependency and test script)

The earlier billing fixes and reports are separate changes retained in the same workspace. No commits or pull requests were created.

## Remaining dependencies and practical limits

Live readiness depends on configured Meta credentials and supported version, successful account checks, staging UI/Firestore/Storage verification, deployed scheduler/runtime, and an administrator-initiated real test. These are not represented as completed.

A first baseline takes bounded time and storage proportional to the existing inventory. Normal worker processing advances one campaign per tick and one media-preparation step per platform, so publication preparation spans several scheduler ticks. No external paid rendering or social-management service was added; existing Firebase/hosting/scheduler usage still incurs ordinary usage costs.

No reliable room classifier is supplied, so source order is used. Exact thumbnail hashes eliminate decoded duplicates, but near-identical views can remain. The source preview includes portrait photos with feed-provided letterboxing. Public source-photo watermarks are retained.

The production environment was not mutated, so no live savings, successful live posts, live comment delivery, or end-to-end production readiness is claimed.

## October 24 update — immediate publication on every new eligible listing

User clarification supersedes the scheduled limits described above: publish every newly discovered eligible property as soon as media preparation completes. The worker no longer enforces the two-per-day limit, four-hour spacing, or Toronto publishing window. Admin controls now describe immediate publication instead of offering those limits. Source eligibility, existing-listing exclusion, deterministic duplicate prevention, independent platform/comment retries and both live switches remain in effect.

A worker invocation now advances consecutive ready preparation steps within a bounded runtime instead of deliberately waiting between each media upload. Meta media-processing delays and retry backoff still apply. Configure the separate worker trigger every minute during deployment; there is still asynchronous queue latency, and sync itself never waits on Meta or image rendering. This update is local only; no scheduler or production configuration was changed. Pre-existing future scheduled jobs, if any are introduced in staging, should be advanced using Publish now; none were created in production during this work.
