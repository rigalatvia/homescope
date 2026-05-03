"use client";

import { useEffect, useMemo, useState } from "react";
import { Cookie, ShieldCheck, X } from "lucide-react";
import {
  CONSENT_MANAGE_EVENT,
  type ConsentChoice,
  applyGoogleConsent,
  broadcastConsentUpdate,
  getStoredConsentChoice,
  setStoredConsentChoice
} from "@/lib/consent";

function saveConsent(choice: ConsentChoice) {
  setStoredConsentChoice(choice);
  applyGoogleConsent(choice);
  broadcastConsentUpdate(choice);
}

export function ConsentBanner() {
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedChoice = getStoredConsentChoice();
    setChoice(storedChoice);
    setIsOpen(!storedChoice);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !choice) return;
    applyGoogleConsent(choice);
  }, [choice, mounted]);

  useEffect(() => {
    const handleManageRequest = () => {
      setChoice(getStoredConsentChoice());
      setIsOpen(true);
    };

    window.addEventListener(CONSENT_MANAGE_EVENT, handleManageRequest);

    return () => {
      window.removeEventListener(CONSENT_MANAGE_EVENT, handleManageRequest);
    };
  }, []);

  const isVisible = mounted && isOpen;
  const hasExistingChoice = !!choice;

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4 sm:px-6">
      <section className="mx-auto max-w-5xl rounded-3xl border border-brand-200 bg-white/95 shadow-2xl backdrop-blur">
        <div className="flex items-start justify-between gap-4 border-b border-brand-100 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <Cookie className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Privacy Settings</p>
              <h2 className="mt-1 text-lg font-semibold text-brand-900">
                {hasExistingChoice ? "Update your cookie preferences" : "Allow analytics and advertising cookies?"}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (hasExistingChoice) {
                setIsOpen(false);
                return;
              }

              saveConsent("rejected");
              setChoice("rejected");
              setIsOpen(false);
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-100 text-brand-600 transition hover:border-brand-200 hover:text-brand-900"
            aria-label={hasExistingChoice ? "Close cookie settings" : "Close cookie banner and keep only necessary cookies"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-6 px-5 py-5 sm:px-6 lg:grid-cols-[1.45fr_0.95fr]">
          <div className="space-y-4">
            <p className="text-sm leading-7 text-brand-700">
              We use optional cookies to understand how people use HomeScope GTA, improve our guides and listings
              experience, and measure advertising performance. Necessary cookies always stay on so the site can work
              properly.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
                <p className="text-sm font-semibold text-brand-900">If you accept</p>
                <p className="mt-2 text-sm leading-6 text-brand-700">
                  Google Analytics and Meta advertising signals can help us understand visits, guide engagement, and
                  lead conversions.
                </p>
              </div>
              <div className="rounded-2xl border border-brand-100 bg-white p-4">
                <div className="flex items-center gap-2 text-brand-900">
                  <ShieldCheck className="h-4 w-4 text-brand-700" aria-hidden="true" />
                  <p className="text-sm font-semibold">If you decline</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-brand-700">
                  Only necessary site storage stays enabled. Optional analytics and advertising measurement remain off.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-brand-900 p-5 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-200">Your Choice</p>
            <p className="mt-3 text-sm leading-7 text-brand-100">
              You can continue using the site either way. Accepting helps us measure HomeScope GTA more accurately in{" "}
              {currentYear}.
            </p>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={() => {
                  saveConsent("accepted");
                  setChoice("accepted");
                  setIsOpen(false);
                }}
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-900 transition hover:bg-brand-50"
              >
                Accept analytics and ads
              </button>
              <button
                type="button"
                onClick={() => {
                  saveConsent("rejected");
                  setChoice("rejected");
                  setIsOpen(false);
                }}
                className="rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/10"
              >
                Keep only necessary cookies
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
