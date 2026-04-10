# HomeScope GTA Platform

Next.js + TypeScript project with Firebase-oriented backend sync scaffolding for a compliant real estate listings platform.

## What Was Added

This codebase now includes production-minded Firebase data architecture for:

- Firestore collections and document models
- Modular listing ingestion/sync pipeline
- Approved-feed connector interface + mock connector
- Public-safe listing query layer
- Scheduled sync function scaffolding
- Firestore rules and index assumptions

No scraping is used. Real feed integration is intentionally left as a connector implementation step.

## Firestore Collections

- `listings`
- `listingSnapshots`
- `leads`
- `contactMessages`
- `syncJobs`
- `settings`

Collections are defined in:
- `lib/firebase-sync/firestore/collections.ts`
- `lib/firebase-sync/firestore/schema-overview.ts`

## Listing Schema (Normalized)

Primary listing document model: `ListingFirestoreDocument` in `types/firebase-sync.ts`

Key fields include:
- `listingId`
- `mlsNumber`
- `sourceSystem`
- `propertyClass`
- `transactionType`
- `permToAdvertise`
- `municipality`
- `area`
- `address` (`streetNumber`, `streetName`, `unit`, `fullAddress`, `postalCode`)
- `price`
- `bedrooms`
- `bathrooms`
- `propertyType`
- `style`
- `publicRemarks`
- `images`
- `coordinates`
- `brokerageName`
- `status`
- `sourceUpdatedAt`
- `syncedAt`
- `isVisible`
- `hiddenReason`
- `slug`
- `badges`
- `rawSourceHash`
- operational timestamps (`createdAt`, `updatedAt`, `lastSeenInSourceAt`)

## Sync Pipeline

Pipeline modules are under `lib/firebase-sync/`:

- Connector interface: `connectors/feed-connector.ts`
- Placeholder connector: `connectors/mock-approved-feed-connector.ts`
- Raw payload examples: `data/mockFeed/raw-listings.ts`
- Normalizer: `services/normalizer.ts`
- Filtering/eligibility: `services/eligibility.ts`
- Slug utility: `services/slug.ts`
- Source hash utility: `services/hash.ts`
- Media mapping utility: `services/media.ts`
- Upsert service: `services/upsert-service.ts`
- Hide/deactivation service: `services/hide-service.ts`
- Snapshot/history service: `services/snapshot-service.ts`
- Sync job logging: `services/sync-log-service.ts`
- Full/incremental/cleanup orchestrator: `services/sync-runner.ts`
- Error shaping: `services/errors.ts`

Behavior implemented:
- upsert by stable source key
- full and incremental sync scaffolding
- stale listing cleanup scaffolding
- hide instead of hard delete when no longer eligible
- snapshot creation on meaningful changes
- sync job stats and failure capture

## Eligibility Rules

A listing is public only when all pass:
- `propertyClass` in allowed set
- `municipality` in allowed set
- `permToAdvertise = true`
- displayable status
- required public fields present

Computed in `services/eligibility.ts` as:
- `isVisible`
- `hiddenReason`

## Public Query Layer

Public-safe helpers in `lib/firebase-sync/queries/public-listings.ts`:

- `getPublicListings`
- `getPublicListingBySlug`
- `getFeaturedListings`
- `getListingsByMunicipality`
- `getFilteredListings`

These always enforce public-safe visibility assumptions.

## Firebase Functions Scaffolding

Scheduler-ready handlers:

- `firebase/functions/src/index.ts`
  - `scheduledFullSync`
  - `scheduledIncrementalSync`
  - `scheduledStaleCleanup`

Shared function entry services:
- `lib/firebase-sync/functions/scheduled-sync.ts`

Firestore config scaffolding:
- `firebase/firestore.rules`
- `firebase/firestore.indexes.json`

## Security Notes

Rules scaffold assumes:
- public users can only read visible public-safe `listings`
- public users cannot write listing/sync data
- `leads` and `contactMessages` are server-write only
- feed credentials remain server-side only

## Lead + Contact Firestore Models

Added typed Firestore-ready models and storage helpers:

- models: `types/firebase-sync.ts`
- mapping helpers: `lib/firebase-sync/services/document-mappers.ts`
- storage helpers: `lib/firebase-sync/services/form-storage.ts`

## Settings/Config Layer

Default sync and eligibility config:
- `lib/firebase-sync/settings.ts`

Includes:
- allowed municipalities
- allowed property classes
- displayable statuses
- sync intervals
- stale threshold
- feature flags

## Where To Plug In Real Approved MLS / CREA DDF Connector

Implement the real connector in:
- `lib/firebase-sync/connectors/feed-connector.ts` (interface)
- Replace `MockApprovedFeedConnector` with real implementation in:
  - `lib/firebase-sync/connectors/mock-approved-feed-connector.ts` (or new file)

Expected real connector responsibilities:
- authenticated requests
- pagination
- incremental cursor handling
- retries and rate-limit handling
- mapping to `RawFeedListingPayload`

No UI or sync service refactor should be required when this is plugged in.

## Environment Variables

See `.env.example`. New backend sync placeholders include:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_USE_EMULATOR`
- `FIRESTORE_EMULATOR_HOST`
- `FEED_SOURCE_SYSTEM`
- `FEED_BASE_URL`
- `FEED_API_KEY`
- `FEED_USERNAME`
- `FEED_PASSWORD`
- `FEED_PAGE_SIZE`
- `SYNC_FULL_CRON`
- `SYNC_INCREMENTAL_CRON`
- `SYNC_CLEANUP_CRON`
- `SYNC_STALE_THRESHOLD_HOURS`

For submission persistence (active mode):
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Collections used by API routes:
- `leads` (showing requests)
- `contactMessages` (contact form submissions)

## Important Note

`createFirebaseAdminSyncRepository()` is intentionally a stub in:
- `lib/firebase-sync/firestore/firebase-admin-repository.ts`

This is the exact location to wire `firebase-admin` Firestore operations for the HomeScope Firebase project.

## MLS Sync Layer (New)

A dedicated sync module now exists under `lib/mls/` with:

- connector interface + mock + approved placeholder connectors
- normalization + eligibility filtering
- Firestore upsert/hide/snapshot services
- full/incremental/cleanup runners
- scheduler-ready function entry points
- manual admin route trigger

Manual trigger route (dev/admin):
- `POST /api/admin/mls-sync`
- body example:
  - `{ "mode": "full", "connectorKind": "mock" }`
  - `{ "mode": "incremental", "connectorKind": "mock", "sinceIso": "2026-04-09T00:00:00.000Z" }`
  - `{ "mode": "cleanup" }`

In production, pass `x-admin-sync-token` matching `MLS_SYNC_ADMIN_TOKEN`.

Scheduler-ready exports:
- `firebase/functions/src/index.ts`
  - `mlsScheduledFullSync`
  - `mlsScheduledIncrementalSync`
  - `mlsScheduledStaleCleanup`

Real approved connector plug-in point:
- `lib/mls/connectors/PlaceholderApprovedFeedConnector.ts`
  - replace TODO logic with official MLS/CREA DDF provider API integration
