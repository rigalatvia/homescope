import { COLLECTIONS } from "@/lib/firebase-sync/firestore/collections";

/**
 * Firestore Collections:
 * - listings: public-safe normalized listing docs with computed visibility fields
 * - listingSnapshots: historical snapshots for meaningful listing changes
 * - leads: private showing request submissions
 * - contactMessages: contact form submissions
 * - syncJobs: sync execution telemetry and stats
 * - settings: centralized sync and eligibility config
 */
export const FIRESTORE_SCHEMA_OVERVIEW = COLLECTIONS;
