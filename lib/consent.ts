export type ConsentChoice = "accepted" | "rejected";

export const CONSENT_STORAGE_KEY = "homescope-consent-choice";
export const CONSENT_UPDATED_EVENT = "homescope:consent-updated";

export interface GoogleConsentState {
  ad_storage: "granted" | "denied";
  ad_user_data: "granted" | "denied";
  ad_personalization: "granted" | "denied";
  analytics_storage: "granted" | "denied";
  functionality_storage: "granted" | "denied";
  personalization_storage: "granted" | "denied";
  security_storage: "granted" | "denied";
}

const DENIED_OPTIONAL_CONSENT: GoogleConsentState = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
  functionality_storage: "granted",
  personalization_storage: "denied",
  security_storage: "granted"
};

const GRANTED_OPTIONAL_CONSENT: GoogleConsentState = {
  ad_storage: "granted",
  ad_user_data: "granted",
  ad_personalization: "granted",
  analytics_storage: "granted",
  functionality_storage: "granted",
  personalization_storage: "granted",
  security_storage: "granted"
};

function readStoredConsentChoice(rawValue: string | null): ConsentChoice | null {
  return rawValue === "accepted" || rawValue === "rejected" ? rawValue : null;
}

export function getStoredConsentChoice(): ConsentChoice | null {
  if (typeof window === "undefined") return null;

  try {
    return readStoredConsentChoice(window.localStorage.getItem(CONSENT_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function setStoredConsentChoice(choice: ConsentChoice): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // Ignore storage errors so the site remains usable even in restrictive browsers.
  }
}

export function hasTrackingConsent(): boolean {
  return getStoredConsentChoice() === "accepted";
}

export function getConsentState(choice: ConsentChoice): GoogleConsentState {
  return choice === "accepted" ? GRANTED_OPTIONAL_CONSENT : DENIED_OPTIONAL_CONSENT;
}

export function applyGoogleConsent(choice: ConsentChoice): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  window.gtag("consent", "update", getConsentState(choice));
}

export function broadcastConsentUpdate(choice: ConsentChoice): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<ConsentChoice>(CONSENT_UPDATED_EVENT, {
      detail: choice
    })
  );
}
