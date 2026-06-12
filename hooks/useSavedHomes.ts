"use client";

import { Timestamp, collection, onSnapshot, query, where } from "firebase/firestore";
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import {
  buildSavedHomeDocumentId,
  fetchSavedListings,
  removeHomeRecord,
  saveHomeRecord,
  updateSavedHomeNotes,
  type SavedHomeDocument,
  type SavedHomeListing,
  type SavedHomeRecord
} from "@/lib/savedHomes";
import { useAuth } from "@/hooks/useAuth";

interface SavedHomesContextValue {
  savedHomeIds: string[];
  savedHomes: SavedHomeRecord[];
  savedListings: SavedHomeListing[];
  loading: boolean;
  error: string | null;
  saveHome: (listingId: string) => Promise<void>;
  removeHome: (listingId: string) => Promise<void>;
  updateNotes: (listingId: string, notes: string) => Promise<void>;
  toggleSave: (listingId: string) => Promise<void>;
  isSaved: (listingId: string) => boolean;
  isPending: (listingId: string) => boolean;
}

const SavedHomesContext = createContext<SavedHomesContextValue | null>(null);
const SAVED_HOME_DASHBOARD_LIMIT = 12;

export function SavedHomesProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [savedHomes, setSavedHomes] = useState<SavedHomeRecord[]>([]);
  const [savedListings, setSavedListings] = useState<SavedHomeListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingListingIds, setPendingListingIds] = useState<string[]>([]);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user || !db) {
      setSavedHomes([]);
      setSavedListings([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const savedHomesQuery = query(collection(db, "savedHomes"), where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(
      savedHomesQuery,
      (snapshot) => {
        const nextSavedHomes = snapshot.docs
          .map((savedHome) => {
            const data = savedHome.data() as SavedHomeDocument;
            return {
              id: savedHome.id,
              userId: data.userId,
              listingId: data.listingId,
              notes: typeof data.notes === "string" ? data.notes : "",
              createdAt: toIsoString(data.createdAt),
              updatedAt: toIsoString(data.updatedAt)
            } satisfies SavedHomeRecord;
          })
          .sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt));

        setSavedHomes(nextSavedHomes);
        setLoading(false);
        setError(null);
      },
      (snapshotError) => {
        console.error("[savedHomes] Failed to watch saved homes", snapshotError);
        setSavedHomes([]);
        setSavedListings([]);
        setLoading(false);
        setError("Something went wrong loading your saved homes.");
      }
    );

    return () => unsubscribe();
  }, [authLoading, user]);

  useEffect(() => {
    if (!user) {
      setSavedListings([]);
      return;
    }

    const activeEntries = savedHomes.slice(0, SAVED_HOME_DASHBOARD_LIMIT);
    if (activeEntries.length === 0) {
      setSavedListings([]);
      return;
    }

    let isActive = true;

    void (async () => {
      try {
        const listings = await fetchSavedListings(activeEntries.map((savedHome) => savedHome.listingId));
        if (!isActive) return;

        const listingMap = new Map(listings.map((listing) => [listing.id, listing]));
        setSavedListings(
          activeEntries.map((savedHome) => ({
            listingId: savedHome.listingId,
            createdAt: savedHome.createdAt,
            notes: savedHome.notes,
            listing: listingMap.get(savedHome.listingId) ?? null
          }))
        );
        setError(null);
      } catch (fetchError) {
        console.error("[savedHomes] Failed to load saved listing details", fetchError);
        if (!isActive) return;
        setSavedListings(
          activeEntries.map((savedHome) => ({
            listingId: savedHome.listingId,
            createdAt: savedHome.createdAt,
            notes: savedHome.notes,
            listing: null
          }))
        );
        setError("Something went wrong loading your saved homes. Please try again.");
      }
    })();

    return () => {
      isActive = false;
    };
  }, [savedHomes, user]);

  const saveHome = useCallback(
    async (listingId: string) => {
      if (!user || !db) {
        throw new Error("Sign in to save this home.");
      }

      const trimmedListingId = listingId.trim();
      const docId = buildSavedHomeDocumentId(user.uid, trimmedListingId);
      const optimisticEntry: SavedHomeRecord = {
        id: docId,
        userId: user.uid,
        listingId: trimmedListingId,
        notes: "",
        createdAt: new Date().toISOString(),
        updatedAt: null
      };

      setPendingListingIds((current) => addUnique(current, trimmedListingId));
      setSavedHomes((current) => sortSavedHomes([optimisticEntry, ...current.filter((savedHome) => savedHome.id !== docId)]));

      try {
        await saveHomeRecord(db, user.uid, trimmedListingId);
      } catch (saveError) {
        setSavedHomes((current) => current.filter((savedHome) => savedHome.id !== docId));
        throw saveError;
      } finally {
        setPendingListingIds((current) => current.filter((pendingId) => pendingId !== trimmedListingId));
      }
    },
    [user]
  );

  const updateNotes = useCallback(
    async (listingId: string, notes: string) => {
      if (!user || !db) {
        throw new Error("Sign in to save notes.");
      }

      const trimmedListingId = listingId.trim();
      const trimmedNotes = notes.slice(0, 3000);
      const previousSavedHomes = savedHomes;
      const previousSavedListings = savedListings;

      setPendingListingIds((current) => addUnique(current, trimmedListingId));
      setSavedHomes((current) =>
        current.map((savedHome) =>
          savedHome.listingId === trimmedListingId
            ? { ...savedHome, notes: trimmedNotes, updatedAt: new Date().toISOString() }
            : savedHome
        )
      );
      setSavedListings((current) =>
        current.map((savedHome) =>
          savedHome.listingId === trimmedListingId ? { ...savedHome, notes: trimmedNotes } : savedHome
        )
      );

      try {
        await updateSavedHomeNotes(db, user.uid, trimmedListingId, trimmedNotes);
      } catch (updateError) {
        setSavedHomes(previousSavedHomes);
        setSavedListings(previousSavedListings);
        throw updateError;
      } finally {
        setPendingListingIds((current) => current.filter((pendingId) => pendingId !== trimmedListingId));
      }
    },
    [savedHomes, savedListings, user]
  );

  const removeHome = useCallback(
    async (listingId: string) => {
      if (!user || !db) {
        throw new Error("Sign in to manage saved homes.");
      }

      const trimmedListingId = listingId.trim();
      const docId = buildSavedHomeDocumentId(user.uid, trimmedListingId);
      const previousSavedHomes = savedHomes;

      setPendingListingIds((current) => addUnique(current, trimmedListingId));
      setSavedHomes((current) => current.filter((savedHome) => savedHome.id !== docId));
      setSavedListings((current) => current.filter((savedHome) => savedHome.listingId !== trimmedListingId));

      try {
        await removeHomeRecord(db, user.uid, trimmedListingId);
      } catch (removeError) {
        setSavedHomes(previousSavedHomes);
        throw removeError;
      } finally {
        setPendingListingIds((current) => current.filter((pendingId) => pendingId !== trimmedListingId));
      }
    },
    [savedHomes, user]
  );

  const toggleSave = useCallback(
    async (listingId: string) => {
      if (savedHomes.some((savedHome) => savedHome.listingId === listingId)) {
        await removeHome(listingId);
        return;
      }

      await saveHome(listingId);
    },
    [removeHome, saveHome, savedHomes]
  );

  const savedHomeIds = useMemo(() => savedHomes.map((savedHome) => savedHome.listingId), [savedHomes]);

  const value = useMemo<SavedHomesContextValue>(
    () => ({
      savedHomeIds,
      savedHomes,
      savedListings,
      loading,
      error,
      saveHome,
      removeHome,
      updateNotes,
      toggleSave,
      isSaved: (listingId: string) => savedHomeIds.includes(listingId),
      isPending: (listingId: string) => pendingListingIds.includes(listingId)
    }),
    [error, loading, pendingListingIds, removeHome, saveHome, savedHomeIds, savedHomes, savedListings, toggleSave, updateNotes]
  );

  return createElement(SavedHomesContext.Provider, { value }, children);
}

export function useSavedHomes(): SavedHomesContextValue {
  const context = useContext(SavedHomesContext);

  if (!context) {
    throw new Error("useSavedHomes must be used inside SavedHomesProvider.");
  }

  return context;
}

function addUnique(items: string[], value: string): string[] {
  return items.includes(value) ? items : [...items, value];
}

function sortSavedHomes(savedHomes: SavedHomeRecord[]): SavedHomeRecord[] {
  return [...savedHomes].sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt));
}

function toIsoString(value?: Timestamp | null): string | null {
  if (!value) return null;
  return value.toDate().toISOString();
}

function toMillis(value: string | null): number {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}
