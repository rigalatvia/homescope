"use client";

import { AuthProvider } from "@/hooks/useAuth";
import { SavedHomesProvider } from "@/hooks/useSavedHomes";
import { SavedSearchesProvider } from "@/hooks/useSavedSearches";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SavedHomesProvider>
        <SavedSearchesProvider>{children}</SavedSearchesProvider>
      </SavedHomesProvider>
    </AuthProvider>
  );
}
