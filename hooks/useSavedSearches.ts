"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  type SaveSearchInput,
  type SavedSearchAlertFrequency,
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

    if (!user) {
      setSavedSearches([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);

    let isActive = true;

    void (async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/saved-searches", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const payload = (await response.json()) as {
          success?: boolean;
          savedSearches?: SavedSearchRecord[];
          error?: string;
        };

        if (!response.ok || payload.success !== true || !Array.isArray(payload.savedSearches)) {
          throw new Error(payload.error || "Unable to load saved searches.");
        }

        if (!isActive) return;
        setSavedSearches(payload.savedSearches);
        setLoading(false);
        setError(null);
      } catch (loadError) {
        console.error("[savedSearches] Failed to load saved searches", loadError);
        if (!isActive) return;
        setSavedSearches([]);
        setLoading(false);
        setError("Something went wrong loading your saved searches.");
      }
    })();

    return () => {
      isActive = false;
    };
  }, [authLoading, user]);

  const saveSearch = useCallback(
    async (input: Omit<SaveSearchInput, "userId" | "userEmail">) => {
      if (!user) {
        throw new Error("Sign in to save this search.");
      }

      setPendingIds((current) => addUnique(current, "new"));
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/saved-searches", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...input,
            userId: user.uid,
            userEmail: user.email
          })
        });
        const payload = (await response.json()) as {
          success?: boolean;
          savedSearch?: SavedSearchRecord;
          error?: string;
        };

        if (!response.ok || payload.success !== true || !payload.savedSearch) {
          throw new Error(payload.error || "Unable to save search.");
        }

        setSavedSearches((current) => [payload.savedSearch!, ...current]);
      } finally {
        setPendingIds((current) => current.filter((pendingId) => pendingId !== "new"));
      }
    },
    [user]
  );

  const removeSearch = useCallback(
    async (searchId: string) => {
      if (!user) {
        throw new Error("Sign in to manage saved searches.");
      }

      setPendingIds((current) => addUnique(current, searchId));
      const previousSearches = savedSearches;
      setSavedSearches((current) => current.filter((search) => search.id !== searchId));
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/saved-searches", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ id: searchId })
        });
        const payload = (await response.json()) as { success?: boolean; error?: string };

        if (!response.ok || payload.success !== true) {
          throw new Error(payload.error || "Unable to remove saved search.");
        }
      } catch (removeError) {
        setSavedSearches(previousSearches);
        throw removeError;
      } finally {
        setPendingIds((current) => current.filter((pendingId) => pendingId !== searchId));
      }
    },
    [savedSearches, user]
  );

  const updateAlerts = useCallback(
    async (
      searchId: string,
      options: { alertsEnabled: boolean; alertFrequency: SavedSearchAlertFrequency }
    ) => {
      if (!user) {
        throw new Error("Sign in to manage saved searches.");
      }

      setPendingIds((current) => addUnique(current, searchId));
      const previousSearches = savedSearches;
      setSavedSearches((current) =>
        current.map((search) =>
          search.id === searchId
            ? { ...search, alertsEnabled: options.alertsEnabled, alertFrequency: options.alertFrequency }
            : search
        )
      );
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/saved-searches", {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ id: searchId, ...options })
        });
        const payload = (await response.json()) as { success?: boolean; error?: string };

        if (!response.ok || payload.success !== true) {
          throw new Error(payload.error || "Unable to update saved search.");
        }
      } catch (updateError) {
        setSavedSearches(previousSearches);
        throw updateError;
      } finally {
        setPendingIds((current) => current.filter((pendingId) => pendingId !== searchId));
      }
    },
    [savedSearches, user]
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
