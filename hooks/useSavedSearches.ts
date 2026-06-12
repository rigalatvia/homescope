"use client";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import {
  mapSavedSearchDocument,
  removeSavedSearchRecord,
  saveSearchRecord,
  updateSavedSearchAlerts,
  type SaveSearchInput,
  type SavedSearchAlertFrequency,
  type SavedSearchDocument,
  type SavedSearchRecord
} from "@/lib/savedSearches";
import { useAuth } from "@/hooks/useAuth";

interface SavedSearchesContextValue {
  savedSearches: SavedSearchRecord[];
  loading: boolean;
  error: string | null;
  saveSearch: (input: Omit<SaveSearchInput, "userId" | "userEmail">) => Promise<void>;
  removeSearch: (searchId: string) => Promise<void>;
  updateAlerts: (
    searchId: string,
    options: { alertsEnabled: boolean; alertFrequency: SavedSearchAlertFrequency }
  ) => Promise<void>;
  isPending: (searchId?: string) => boolean;
}

const SavedSearchesContext = createContext<SavedSearchesContextValue | null>(null);

export function SavedSearchesProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [savedSearches, setSavedSearches] = useState<SavedSearchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<string[]>([]);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user || !db) {
      setSavedSearches([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const savedSearchesQuery = query(collection(db, "savedSearches"), where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(
      savedSearchesQuery,
      (snapshot) => {
        const nextSearches = snapshot.docs
          .map((searchDoc) => mapSavedSearchDocument(searchDoc.id, searchDoc.data() as SavedSearchDocument))
          .sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt));

        setSavedSearches(nextSearches);
        setLoading(false);
        setError(null);
      },
      (snapshotError) => {
        console.error("[savedSearches] Failed to watch saved searches", snapshotError);
        setSavedSearches([]);
        setLoading(false);
        setError("Something went wrong loading your saved searches.");
      }
    );

    return () => unsubscribe();
  }, [authLoading, user]);

  const saveSearch = useCallback(
    async (input: Omit<SaveSearchInput, "userId" | "userEmail">) => {
      if (!user || !db) {
        throw new Error("Sign in to save this search.");
      }

      setPendingIds((current) => addUnique(current, "new"));
      try {
        await saveSearchRecord(db, {
          ...input,
          userId: user.uid,
          userEmail: user.email
        });
      } finally {
        setPendingIds((current) => current.filter((pendingId) => pendingId !== "new"));
      }
    },
    [user]
  );

  const removeSearch = useCallback(
    async (searchId: string) => {
      if (!user || !db) {
        throw new Error("Sign in to manage saved searches.");
      }

      setPendingIds((current) => addUnique(current, searchId));
      try {
        await removeSavedSearchRecord(db, searchId);
      } finally {
        setPendingIds((current) => current.filter((pendingId) => pendingId !== searchId));
      }
    },
    [user]
  );

  const updateAlerts = useCallback(
    async (
      searchId: string,
      options: { alertsEnabled: boolean; alertFrequency: SavedSearchAlertFrequency }
    ) => {
      if (!user || !db) {
        throw new Error("Sign in to manage saved searches.");
      }

      setPendingIds((current) => addUnique(current, searchId));
      try {
        await updateSavedSearchAlerts(db, searchId, options);
      } finally {
        setPendingIds((current) => current.filter((pendingId) => pendingId !== searchId));
      }
    },
    [user]
  );

  const value = useMemo<SavedSearchesContextValue>(
    () => ({
      savedSearches,
      loading,
      error,
      saveSearch,
      removeSearch,
      updateAlerts,
      isPending: (searchId?: string) => pendingIds.includes(searchId || "new")
    }),
    [error, loading, pendingIds, removeSearch, saveSearch, savedSearches, updateAlerts]
  );

  return createElement(SavedSearchesContext.Provider, { value }, children);
}

export function useSavedSearches(): SavedSearchesContextValue {
  const context = useContext(SavedSearchesContext);

  if (!context) {
    throw new Error("useSavedSearches must be used inside SavedSearchesProvider.");
  }

  return context;
}

function addUnique(items: string[], value: string): string[] {
  return items.includes(value) ? items : [...items, value];
}

function toMillis(value: string | null): number {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}
