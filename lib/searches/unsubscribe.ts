import { createHmac, timingSafeEqual } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { SITE_CONFIG } from "@/config/site";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { ensureServerSecretsLoaded } from "@/lib/server/secret-manager";

const SAVED_SEARCHES_COLLECTION = "savedSearches";

function normalizeTokenInput(value: string): string {
  return value.trim();
}

async function getSigningSecret(): Promise<string> {
  await ensureServerSecretsLoaded();

  return (
    process.env.SAVED_SEARCH_UNSUBSCRIBE_SECRET?.trim() ||
    process.env.CRM_UNSUBSCRIBE_SECRET?.trim() ||
    process.env.EMAIL_PASS?.trim() ||
    process.env.MLS_SCHEDULER_TOKEN?.trim() ||
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    "homescopegta-saved-search-unsubscribe"
  );
}

function buildTokenPayload(searchId: string, userEmail: string): string {
  return `${searchId.trim().toLowerCase()}:${userEmail.trim().toLowerCase()}`;
}

export async function buildSavedSearchUnsubscribeToken(searchId: string, userEmail: string): Promise<string> {
  const secret = await getSigningSecret();
  return createHmac("sha256", secret).update(buildTokenPayload(searchId, userEmail)).digest("base64url");
}

export async function verifySavedSearchUnsubscribeToken(
  searchId: string,
  userEmail: string,
  token: string
): Promise<boolean> {
  const normalizedToken = normalizeTokenInput(token);
  if (!normalizedToken) return false;

  const expectedToken = await buildSavedSearchUnsubscribeToken(searchId, userEmail);
  const expectedBuffer = Buffer.from(expectedToken);
  const actualBuffer = Buffer.from(normalizedToken);

  if (expectedBuffer.length !== actualBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, actualBuffer);
}

export async function buildSavedSearchUnsubscribeUrl(searchId: string, userEmail: string): Promise<string> {
  const token = await buildSavedSearchUnsubscribeToken(searchId, userEmail);
  const url = new URL("/saved-searches/unsubscribe", SITE_CONFIG.baseUrl);
  url.searchParams.set("search", searchId);
  url.searchParams.set("token", token);
  return url.toString();
}

export async function getSavedSearchUnsubscribePreview(input: {
  searchId: string;
  token: string;
}): Promise<{
  label: string;
  userEmail: string;
  alertsEnabled: boolean;
}> {
  const searchId = input.searchId.trim();
  const token = input.token.trim();

  if (!searchId || !token) {
    throw new Error("This unsubscribe link is incomplete.");
  }

  const firestore = getFirebaseAdminFirestore();
  const docRef = firestore.collection(SAVED_SEARCHES_COLLECTION).doc(searchId);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    throw new Error("We could not find this saved search.");
  }

  const data = snapshot.data() || {};
  const userEmail = typeof data.userEmail === "string" ? data.userEmail.trim().toLowerCase() : "";
  const label = typeof data.label === "string" && data.label.trim() ? data.label.trim() : "Saved search";

  if (!userEmail) {
    throw new Error("This saved search does not have an email address.");
  }

  const isValidToken = await verifySavedSearchUnsubscribeToken(searchId, userEmail, token);
  if (!isValidToken) {
    throw new Error("This unsubscribe link is not valid.");
  }

  return {
    label,
    userEmail,
    alertsEnabled: data.alertsEnabled !== false
  };
}

export async function unsubscribeSavedSearchFromEmailLink(input: {
  searchId: string;
  token: string;
}): Promise<{
  label: string;
  userEmail: string;
  alreadyPaused: boolean;
}> {
  const preview = await getSavedSearchUnsubscribePreview(input);
  const searchId = input.searchId.trim();

  if (!preview.alertsEnabled) {
    return {
      label: preview.label,
      userEmail: preview.userEmail,
      alreadyPaused: true
    };
  }

  const firestore = getFirebaseAdminFirestore();
  const docRef = firestore.collection(SAVED_SEARCHES_COLLECTION).doc(searchId);

  await docRef.set(
    {
      alertsEnabled: false,
      unsubscribeSource: "saved-search-alert-email-link",
      unsubscribedAt: new Date().toISOString(),
      unsubscribedAtServer: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  return {
    label: preview.label,
    userEmail: preview.userEmail,
    alreadyPaused: false
  };
}
