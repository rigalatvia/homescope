"use client";

import {
  GoogleAuthProvider,
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
  type User,
  type UserCredential
} from "firebase/auth";
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { auth, isFirebaseClientConfigured } from "@/lib/firebase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<UserCredential>;
  signOutUser: () => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !isFirebaseClientConfigured) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    void setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error("[auth] Failed to set browser persistence", error);
    });

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (!isMounted) return;
      setUser(nextUser);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!auth || !isFirebaseClientConfigured) {
      throw new Error("Google sign-in is not configured yet.");
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await setPersistence(auth, browserLocalPersistence);
    return signInWithPopup(auth, provider);
  }, []);

  const signOutUser = useCallback(async () => {
    if (!auth || !isFirebaseClientConfigured) {
      return;
    }

    await signOut(auth);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signInWithGoogle,
      signOutUser,
      isConfigured: isFirebaseClientConfigured
    }),
    [loading, signInWithGoogle, signOutUser, user]
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
