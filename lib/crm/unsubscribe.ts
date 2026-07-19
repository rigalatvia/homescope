import { createHmac, timingSafeEqual } from "crypto";
import { SITE_CONFIG } from "@/config/site";
import { ensureServerSecretsLoaded } from "@/lib/server/secret-manager";

function normalizeTokenInput(value: string): string {
  return value.trim();
}

async function getSigningSecret(): Promise<string> {
  await ensureServerSecretsLoaded();

  return (
    process.env.CRM_UNSUBSCRIBE_SECRET?.trim() ||
    process.env.CRM_CAMPAIGN_EMAIL_PASS?.trim() ||
    process.env.EMAIL_PASS?.trim() ||
    process.env.MLS_SCHEDULER_TOKEN?.trim() ||
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    "homescopegta-crm-unsubscribe"
  );
}

function buildTokenPayload(contactId: string, email: string): string {
  return `${contactId.trim().toLowerCase()}:${email.trim().toLowerCase()}`;
}

export async function buildCrmUnsubscribeToken(contactId: string, email: string): Promise<string> {
  const secret = await getSigningSecret();
  return createHmac("sha256", secret).update(buildTokenPayload(contactId, email)).digest("base64url");
}

export async function verifyCrmUnsubscribeToken(contactId: string, email: string, token: string): Promise<boolean> {
  const normalizedToken = normalizeTokenInput(token);
  if (!normalizedToken) return false;

  const expectedToken = await buildCrmUnsubscribeToken(contactId, email);
  const expectedBuffer = Buffer.from(expectedToken);
  const actualBuffer = Buffer.from(normalizedToken);

  if (expectedBuffer.length !== actualBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, actualBuffer);
}

export async function buildCrmUnsubscribeUrl(contactId: string, email: string): Promise<string> {
  const token = await buildCrmUnsubscribeToken(contactId, email);
  const url = new URL("/crm/unsubscribe", SITE_CONFIG.baseUrl);
  url.searchParams.set("contact", contactId);
  url.searchParams.set("token", token);
  return url.toString();
}
