import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { SITE_CONFIG } from "@/config/site";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { getPublicListings } from "@/lib/listings/service";
import { sendDirectEmail } from "@/lib/email";
import type { SavedSearchAlertFrequency } from "@/lib/savedSearches";
import { formatPrice } from "@/lib/utils/format";
import type { Listing, ListingFilters } from "@/types/listing";

interface AdminSavedSearchDocument {
  userId?: string;
  userEmail?: string | null;
  label?: string;
  path?: string;
  queryString?: string;
  filters?: ListingFilters;
  resultsTotal?: number;
  alertsEnabled?: boolean;
  alertFrequency?: SavedSearchAlertFrequency;
  lastAlertCheckedAt?: Timestamp | null;
  lastAlertListingIds?: string[];
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

interface AdminSavedSearchRecord {
  id: string;
  userId: string;
  userEmail: string | null;
  label: string;
  path: string;
  queryString: string;
  filters: ListingFilters;
  resultsTotal: number;
  alertsEnabled: boolean;
  alertFrequency: SavedSearchAlertFrequency;
  lastAlertCheckedAt: string | null;
  lastAlertListingIds: string[];
  createdAt: string | null;
  updatedAt: string | null;
}

interface SavedSearchAlertSummary {
  checked: number;
  baselined: number;
  sent: number;
  skipped: number;
  errors: string[];
}

const ALERT_LOOKBACK_LIMIT = 8;
const ALERT_NOTIFIED_HISTORY_LIMIT = 50;

export async function runSavedSearchAlerts(): Promise<SavedSearchAlertSummary> {
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore.collection("savedSearches").where("alertsEnabled", "==", true).get();
  const now = new Date();
  const summary: SavedSearchAlertSummary = {
    checked: snapshot.size,
    baselined: 0,
    sent: 0,
    skipped: 0,
    errors: []
  };

  for (const docSnapshot of snapshot.docs) {
    const search = mapAdminSavedSearch(docSnapshot.id, docSnapshot.data() as AdminSavedSearchDocument);

    try {
      if (!search.userEmail) {
        summary.skipped += 1;
        continue;
      }

      if (!shouldCheckSearch(search, now)) {
        summary.skipped += 1;
        continue;
      }

      const filters: ListingFilters = {
        ...search.filters,
        sort: "newest",
        page: 1,
        pageSize: 24
      };
      const results = await getPublicListings(filters);
      const recentListings = getRecentAlertListings(
        results.items,
        search.lastAlertCheckedAt,
        search.lastAlertListingIds
      );
      const currentListingIds = results.items.slice(0, ALERT_LOOKBACK_LIMIT).map((listing) => listing.id);
      const nextAlertListingIds = buildNextAlertListingIds(
        search.lastAlertListingIds,
        currentListingIds,
        recentListings
      );

      await docSnapshot.ref.set(
        {
          lastAlertCheckedAt: FieldValue.serverTimestamp(),
          lastAlertListingIds: nextAlertListingIds,
          updatedAt: FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      if (!search.lastAlertCheckedAt) {
        summary.baselined += 1;
        continue;
      }

      if (recentListings.length === 0) {
        summary.skipped += 1;
        continue;
      }

      await sendDirectEmail(buildSavedSearchAlertEmail(search, recentListings.slice(0, ALERT_LOOKBACK_LIMIT)));
      summary.sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown saved search alert error.";
      summary.errors.push(`${search.id}: ${message}`);
      console.error("[savedSearchAlerts] Search alert failed", { searchId: search.id, error });
    }
  }

  return summary;
}

function mapAdminSavedSearch(id: string, data: AdminSavedSearchDocument): AdminSavedSearchRecord {
  return {
    id,
    userId: data.userId || "",
    userEmail: data.userEmail || null,
    label: data.label || "Saved search",
    path: data.path || "/listings",
    queryString: data.queryString || "",
    filters: data.filters || {},
    resultsTotal: typeof data.resultsTotal === "number" ? data.resultsTotal : 0,
    alertsEnabled: data.alertsEnabled !== false,
    alertFrequency: parseAlertFrequency(data.alertFrequency),
    lastAlertCheckedAt: toIsoString(data.lastAlertCheckedAt),
    lastAlertListingIds: Array.isArray(data.lastAlertListingIds) ? data.lastAlertListingIds : [],
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt)
  };
}

function shouldCheckSearch(search: AdminSavedSearchRecord, now: Date): boolean {
  if (!search.lastAlertCheckedAt) return true;

  const lastChecked = new Date(search.lastAlertCheckedAt);
  if (!Number.isFinite(lastChecked.getTime())) return true;

  const hoursSinceLastCheck = (now.getTime() - lastChecked.getTime()) / (1000 * 60 * 60);
  if (search.alertFrequency === "instant") return true;
  if (search.alertFrequency === "daily") return hoursSinceLastCheck >= 24;
  return hoursSinceLastCheck >= 24 * 7;
}

function parseAlertFrequency(value: unknown): SavedSearchAlertFrequency {
  if (value === "instant" || value === "weekly") return value;
  return "daily";
}

function getRecentAlertListings(
  listings: Listing[],
  lastCheckedAt: string | null,
  lastAlertListingIds: string[]
): Listing[] {
  if (!lastCheckedAt) return [];

  const checkedAt = new Date(lastCheckedAt).getTime();
  if (!Number.isFinite(checkedAt)) return [];
  const alreadyNotified = new Set(lastAlertListingIds);

  return listings.filter((listing) => {
    if (alreadyNotified.has(listing.id)) return false;
    const createdAt = new Date(listing.createdAt).getTime();
    return Number.isFinite(createdAt) && createdAt > checkedAt;
  });
}

function buildNextAlertListingIds(
  previousListingIds: string[],
  currentListingIds: string[],
  recentListings: Listing[]
): string[] {
  const recentListingIds = recentListings.map((listing) => listing.id);
  return Array.from(new Set([...recentListingIds, ...currentListingIds, ...previousListingIds])).slice(
    0,
    ALERT_NOTIFIED_HISTORY_LIMIT
  );
}

function buildSavedSearchAlertEmail(search: AdminSavedSearchRecord, listings: Listing[]) {
  const searchUrl = `${SITE_CONFIG.baseUrl}${buildSavedSearchUrl(search)}`;
  const subject = `${listings.length} new HomeScope GTA listing${listings.length === 1 ? "" : "s"} for ${search.label}`;
  const text = [
    `New listings matched your saved search: ${search.label}`,
    "",
    ...listings.flatMap((listing) => [
      `${formatPrice(listing.price)} - ${listing.address}, ${listing.city}`,
      `${SITE_CONFIG.baseUrl}/listings/${listing.listingUrlSlug}`,
      ""
    ]),
    `Open your saved search: ${searchUrl}`,
    "",
    "You can pause or change alert frequency from your HomeScope GTA dashboard."
  ].join("\n");
  const htmlListings = listings
    .map(
      (listing) => `
        <li>
          <strong>${escapeHtml(formatPrice(listing.price))}</strong> -
          ${escapeHtml(listing.address)}, ${escapeHtml(listing.city)}
          <br />
          <a href="${escapeHtmlAttribute(`${SITE_CONFIG.baseUrl}/listings/${listing.listingUrlSlug}`)}">View listing</a>
        </li>
      `
    )
    .join("");
  const html = `
    <h2>New listings matched your saved search</h2>
    <p><strong>${escapeHtml(search.label)}</strong></p>
    <ul>${htmlListings}</ul>
    <p><a href="${escapeHtmlAttribute(searchUrl)}">Open your saved search</a></p>
    <p>You can pause or change alert frequency from your HomeScope GTA dashboard.</p>
  `;

  return {
    to: search.userEmail!,
    subject,
    text,
    html
  };
}

function toIsoString(value?: Timestamp | null): string | null {
  if (!value) return null;
  return value.toDate().toISOString();
}

function buildSavedSearchUrl(search: Pick<AdminSavedSearchRecord, "path" | "queryString">): string {
  return search.queryString ? `${search.path}?${search.queryString}` : search.path;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeHtmlAttribute(value: string): string {
  return escapeHtml(value);
}
