import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Firestore,
  type Timestamp
} from "firebase/firestore";
import type { Listing } from "@/types/listing";

export interface SavedHomeDocument {
  userId: string;
  listingId: string;
  notes?: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface SavedHomeRecord {
  id: string;
  userId: string;
  listingId: string;
  notes: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface SavedHomeListing {
  listingId: string;
  createdAt: string | null;
  notes: string;
  listing: Listing | null;
}

const SAVED_HOMES_COLLECTION = "savedHomes";

export function buildSavedHomeDocumentId(userId: string, listingId: string): string {
  return `${userId}_${listingId}`;
}

export async function saveHomeRecord(db: Firestore, userId: string, listingId: string): Promise<void> {
  const trimmedListingId = listingId.trim();
  if (!trimmedListingId) {
    throw new Error("Listing reference is missing.");
  }

  await setDoc(
    doc(db, SAVED_HOMES_COLLECTION, buildSavedHomeDocumentId(userId, trimmedListingId)),
    {
      userId,
      listingId: trimmedListingId,
      createdAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function removeHomeRecord(db: Firestore, userId: string, listingId: string): Promise<void> {
  await deleteDoc(doc(db, SAVED_HOMES_COLLECTION, buildSavedHomeDocumentId(userId, listingId.trim())));
}

export async function updateSavedHomeNotes(
  db: Firestore,
  userId: string,
  listingId: string,
  notes: string
): Promise<void> {
  const trimmedListingId = listingId.trim();
  if (!trimmedListingId) {
    throw new Error("Listing reference is missing.");
  }

  await setDoc(
    doc(db, SAVED_HOMES_COLLECTION, buildSavedHomeDocumentId(userId, trimmedListingId)),
    {
      userId,
      listingId: trimmedListingId,
      notes: notes.slice(0, 3000),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function getUserSavedHomeIds(db: Firestore, userId: string): Promise<string[]> {
  const snapshot = await getDocs(query(collection(db, SAVED_HOMES_COLLECTION), where("userId", "==", userId)));
  return snapshot.docs
    .map((savedHome) => savedHome.data() as SavedHomeDocument)
    .map((savedHome) => savedHome.listingId)
    .filter((listingId) => typeof listingId === "string" && listingId.trim().length > 0);
}

export async function fetchSavedListings(listingIds: string[]): Promise<Listing[]> {
  if (listingIds.length === 0) {
    return [];
  }

  const response = await fetch("/api/listings/by-ids", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingIds })
  });

  const payload = (await response.json()) as { success?: boolean; listings?: Listing[]; error?: string };

  if (!response.ok || payload.success !== true || !Array.isArray(payload.listings)) {
    throw new Error(payload.error || "We could not load your saved homes right now.");
  }

  return payload.listings;
}
