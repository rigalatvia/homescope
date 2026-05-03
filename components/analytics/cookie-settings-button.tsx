"use client";

import { requestConsentManagement } from "@/lib/consent";

export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => requestConsentManagement()}
      className="text-sm font-semibold text-brand-900 underline-offset-2 transition hover:underline"
    >
      Cookie Settings
    </button>
  );
}
