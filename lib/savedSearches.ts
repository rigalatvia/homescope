import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  type Firestore,
  type Timestamp
} from "firebase/firestore";
import type { ListingFilters } from "@/types/listing";

export type SavedSearchAlertFrequency = "instant" | "daily" | "weekly";

export interface SavedSearchDocument {
  userId: string;
  userEmail: string | null;
  label: string;
  path: string;
  queryString: string;
  filters: ListingFilters;
  resultsTotal: number;
  alertsEnabled: boolean;
  alertFrequency: SavedSearchAlertFrequency;
  lastAlertCheckedAt?: Timestamp | null;
  lastAlertListingIds?: string[];
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface SavedSearchRecord {
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

export interface SaveSearchInput {
  userId: string;
  userEmail?: string | null;
  label: string;
  path: string;
  queryString: string;
  filters: ListingFilters;
  resultsTotal: number;
  alertsEnabled?: boolean;
  alertFrequency?: SavedSearchAlertFrequency;
}

const SAVED_SEARCHES_COLLECTION = "savedSearches";

export async function saveSearchRecord(db: Firestore, input: SaveSearchInput): Promise<string> {
  const label = input.label.trim() || "Saved search";
  const docRef = await addDoc(collection(db, SAVED_SEARCHES_COLLECTION), {
    userId: input.userId,
    userEmail: input.userEmail || null,
    label,
    path: input.path,
    queryString: input.queryString,
    filters: input.filters,
    resultsTotal: input.resultsTotal,
    alertsEnabled: input.alertsEnabled ?? true,
    alertFrequency: input.alertFrequency || "daily",
    lastAlertCheckedAt: null,
    lastAlertListingIds: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return docRef.id;
}

export async function updateSavedSearchAlerts(
  db: Firestore,
  searchId: string,
  options: {
    alertsEnabled: boolean;
    alertFrequency: SavedSearchAlertFrequency;
  }
): Promise<void> {
  await setDoc(
    doc(db, SAVED_SEARCHES_COLLECTION, searchId),
    {
      alertsEnabled: options.alertsEnabled,
      alertFrequency: options.alertFrequency,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function removeSavedSearchRecord(db: Firestore, searchId: string): Promise<void> {
  await deleteDoc(doc(db, SAVED_SEARCHES_COLLECTION, searchId));
}

export function mapSavedSearchDocument(id: string, data: SavedSearchDocument): SavedSearchRecord {
  return {
    id,
    userId: data.userId,
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

export function buildSavedSearchUrl(search: Pick<SavedSearchRecord, "path" | "queryString">): string {
  return search.queryString ? `${search.path}?${search.queryString}` : search.path;
}

function parseAlertFrequency(value: string | undefined): SavedSearchAlertFrequency {
  if (value === "instant" || value === "weekly") return value;
  return "daily";
}

function toIsoString(value?: Timestamp | null): string | null {
  if (!value) return null;
  return value.toDate().toISOString();
}
