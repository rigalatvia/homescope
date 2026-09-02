"use client";

import { Heart, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { SignInButton } from "@/components/auth/SignInButton";
import { useAuth } from "@/hooks/useAuth";
import { useSavedHomes } from "@/hooks/useSavedHomes";
import { trackEvent } from "@/lib/analytics";

interface FavoriteButtonProps {
  listingId: string;
  className?: string;
  isRental?: boolean;
}

export function FavoriteButton({ listingId, className, isRental = false }: FavoriteButtonProps) {
  const { user, loading: authLoading } = useAuth();
  const { isSaved, isPending, toggleSave } = useSavedHomes();
  const [showPrompt, setShowPrompt] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const saved = useMemo(() => isSaved(listingId), [isSaved, listingId]);
  const pending = isPending(listingId);

  const handleToggle = async () => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setErrorMessage("");
      setShowPrompt(true);
      return;
    }

    try {
      await toggleSave(listingId);
      if (!saved && isRental) trackEvent("rental_saved", { listing_id: listingId });
      setErrorMessage("");
    } catch (error) {
      console.error("[savedHomes] Failed to toggle saved home", error);
      setErrorMessage("We could not update this saved home right now. Please try again.");
    }
  };

  const handleSignedIn = async () => {
    try {
      await toggleSave(listingId);
      if (isRental) trackEvent("rental_saved", { listing_id: listingId });
      setErrorMessage("");
      setShowPrompt(false);
    } catch (error) {
      console.error("[savedHomes] Failed to save home after sign-in", error);
      setErrorMessage("We could not save this home right now. Please try again.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          void handleToggle();
        }}
        aria-pressed={saved}
        disabled={authLoading || pending}
        className={`inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-800 transition hover:border-brand-400 disabled:opacity-60 ${
          className || ""
        }`}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
        )}
        {saved ? "Saved" : "Save"}
      </button>

      {errorMessage ? <p className="mt-2 text-xs text-red-700">{errorMessage}</p> : null}

      {showPrompt ? (
        <ModalPortal>
          <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-brand-900/45 p-4">
            <div className="w-full max-w-sm rounded-[1.75rem] border border-brand-100 bg-white p-6 shadow-soft">
              <p className="font-heading text-3xl text-brand-900">Sign in to save this home.</p>
              <p className="mt-3 text-sm leading-7 text-brand-700">
                Save homes you love and keep them ready in your HomeScope GTA dashboard.
              </p>
              {errorMessage ? (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
              ) : null}
              <div className="mt-6 flex flex-col gap-3">
                <SignInButton
                  label="Sign in with Google"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
                  onSuccess={handleSignedIn}
                  onError={setErrorMessage}
                />
                <button
                  type="button"
                  onClick={() => setShowPrompt(false)}
                  className="inline-flex items-center justify-center rounded-full border border-brand-200 px-5 py-3 text-sm font-semibold text-brand-900 transition hover:bg-brand-50"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      ) : null}
    </>
  );
}

function ModalPortal({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}
