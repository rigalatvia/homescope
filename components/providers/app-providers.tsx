"use client";

import { AuthProvider } from "@/hooks/useAuth";
import { SavedHomesProvider } from "@/hooks/useSavedHomes";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SavedHomesProvider>{children}</SavedHomesProvider>
    </AuthProvider>
  );
}
