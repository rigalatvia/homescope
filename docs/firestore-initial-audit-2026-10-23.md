# Firestore initial audit — October 23, 2026

Recorded before optimization changes. Working tree was clean. Baseline typecheck and lint pass.

## Evidence

User-provided October 1–23 billing total: Firestore $256.17; all products $274.22. SKU detail unavailable: Cloud Billing project billingInfo returned IAM 403. This is not a verified SKU allocation.

Authorized read-only cloud metadata confirms project homescope-ee781, default STANDARD FIRESTORE_NATIVE database, northamerica-northeast2, PITR disabled. Backup listing in that region returned no backups. Current metadata does not prove historical backup/PITR charges were zero. Seven deployed listing composite indexes are READY; repository definitions omit the deployed slug index and include a school index not covered by that listing-specific request.

Database-scoped Monitoring evidence for 2026-10-01 00:00 through 2026-10-23 15:00 America/Toronto (04:00Z through 19:00Z), hourly aligned, saved in firestore-monitoring-2026-10-23.json:

| Measurement | Value |
|---|---:|
| Query document reads | 579,216,980 |
| Lookup reads | 202,246 |
| Not-found reads | 139,498 |
| Creates | 43,972 |
| Updates | 107,735 |
| Deletes | 9,302 |
| Latest data + index storage | 5,174,922,951 bytes |
| Successful RunQuery calls | 1,703,175 |
| Failed-precondition RunQuery calls | 50,178 |
| Successful aggregation calls | 39,568 |
| Maximum observed snapshot listeners | 5 |

Use database-scoped *_ops_count metrics; legacy read_count omitted QUERY in the initial response. Do not sum mirrored legacy and database series. Monitoring usage is not the invoice: index-read charges, free quotas, discounts, network and exact billing dates still need SKU reconciliation. Reads are the evidenced operational priority, but individual routes cannot be attributed from these metrics. Logs access returned 403; missing-index and oversized-cache errors remain hypotheses.

## Architecture and environment

Next.js 14 App Router, React 18, Firebase client SDK and Admin SDK. Server and browser .env.local project IDs both equal homescope-ee781; no emulator configured. Local development can contribute production usage. Firebase alias matches. Documentation describes Firebase App Hosting, hourly MLS scheduler (:00) and alerts (:15); deployed Cloud Run and Scheduler inventory requests returned 403. Other services, applications, preview environments and billing-account project scope remain unverified. firebase/functions/src/index.ts contains one lead-created trigger that logs that email handling is disabled there. lib/firebase-sync has a throwing Admin adapter placeholder; live MLS work uses lib/mls.

## Prioritized findings and plan

| Priority | Code / function | Evidence and impact | Proposed action / risk / verification |
|---|---|---|---|
| 1 | lib/listings/firestore-data.ts getCachedMLSMonthlyMarketStatsByMunicipality; app/locations/[citySlug]/market/page.tsx | Fresh asOfIso per render defeats caching; underlying query reads all visible city createdAt fields plus five aggregations | Cache database source separately, retain exact current as-of calculations; low risk; mock query-count and time-boundary regression |
| 2 | lib/listings/service.ts getPublicListings; app/api/listings/map/route.ts | Map requests obtain indexed page/count then full candidates; page result is discarded by map endpoint | Dedicated all-items branch reuses filters/sort/pagination; low risk; output equivalence and zero unused page calls |
| 3 | lib/mls/sync/publicQueries.ts getFilteredListings/getAllPublicListings | Advanced filters and maps scan city/all GTA in 500-document cursor batches; beds/baths and other filters applied after reads | Investigate logs and Query Explain, then targeted index/filter design; medium risk to completeness; do not cap results blindly |
| 4 | same file getFilteredListingsPage | Offset pagination plus count per cold key; skipped documents bill reads | Cursor design with compatible numbered URLs; medium risk, defer pending usage attribution |
| 5 | lib/listings/firestore-data.ts public caches | 15-minute caches, full listing payloads, no sync invalidation found; potential oversized entry failures, unconfirmed | Logs and payload-size evidence required; freshness contract and invalidation before wider caching changes |
| 6 | components/admin/mls-sync-panel.tsx | Stats every 30 seconds even in hidden tabs; each endpoint does two counts and five settings reads | Visibility-aware polling, prevent overlap; low risk; timer/lifecycle tests |
| 7 | hooks/useSavedHomes.ts | One root-scoped owner-filtered listener with cleanup; notes updates refetch 12 listing details | Preserve realtime; investigate request dedup, avoid introducing stale listing state |
| 8 | lib/mls/upsert/upsertListings.ts | One read and write per unchanged item; lastSeen drives destructive stale cleanup | Preserve heartbeat writes; redesign only with sweep/recovery tests |
| 9 | lib/searches/saved-search-alerts.ts | Scans enabled searches, frequency checked locally; each due search executes listing search and writes checkpoint | Preserve correctness; delivery checkpoint precedes email (existing recovery risk); redesign separately |
| 10 | app/api/searches/route.ts and public map/chat/forms | Public write/read amplification; no shared rate limiter found | Attribute traffic before choosing limits; avoid per-instance limiter presented as global protection |

Schools already cache directory for one hour with explicit import/rank/geocode invalidation. Radius calculations use reference data; don't add overlapping cache libraries. Admin overview already uses counts and 8-record previews; detailed CRM lists remain bounded or template-wide. Keep all private data owner-scoped; do not share-cache notes/searches/showings.

## Access gaps and production safety

Need Billing Reports export filtered to project and Firestore, October 1–23, grouped by SKU and daily usage, with usage units, gross cost, credits, net cost and location. Include reads, writes, deletes, index-related operations, storage, PITR, backup/restore, network and any other SKU. Billing Account Viewer (or project-scoped billing.resourceCosts.get where sufficient) is appropriate; no Billing Admin required. For attribution request Logs Viewer, Cloud Run Viewer and Cloud Scheduler Viewer; Monitoring reads already work. Do not grant broad admin roles.

No production documents, rules, indexes, schedules, budgets or services were changed. No live sync or email jobs were invoked. Production customer journeys must use isolated accounts/emulator, not customer data. No percentage savings promise is justified yet.
