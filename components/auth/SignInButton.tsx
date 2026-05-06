"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface SignInButtonProps {
  label?: string;
  className?: string;
  onSuccess?: () => void | Promise<void>;
  onError?: (message: string) => void;
}

export function SignInButton({
  label = "Sign in with Google",
  className,
  onSuccess,
  onError
}: SignInButtonProps) {
  const { signInWithGoogle, isConfigured } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = async () => {
    if (!isConfigured) {
      onError?.("Google sign-in is not configured yet.");
      return;
    }

    setIsSubmitting(true);

    try {
      await signInWithGoogle();
      await onSuccess?.();
    } catch (error) {
      console.error("[auth] Google sign-in failed", error);
      onError?.("We could not start Google sign-in right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isSubmitting}
      className={
        className ||
        "inline-flex items-center gap-2 rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900 transition hover:border-brand-300 hover:bg-brand-50 disabled:opacity-60"
      }
    >
      <LogIn className="h-4 w-4" />
      {isSubmitting ? "Signing in..." : label}
    </button>
  );
}
