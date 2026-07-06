import { MockEmailProvider } from "@/lib/email/providers/consoleProvider";
import { GmailEmailProvider } from "@/lib/email/providers/gmailProvider";
import { ResendEmailProvider } from "@/lib/email/providers/resendProvider";
import type { EmailProvider, EmailSendResult, GenericEmailPayload } from "@/lib/email/types";
import { buildContactEmail, buildLeadEmail } from "@/lib/email/templates";
import { ensureServerSecretsLoaded } from "@/lib/server/secret-manager";
import { getSiteSettings } from "@/lib/settings/site-settings";
import type { ContactSubmissionRecord } from "@/types/contact";
import type { LeadSubmissionRecord } from "@/types/lead";

const DEFAULT_FROM_NAME = "HomeScope GTA";

interface EmailProviderSelection {
  provider: EmailProvider;
  mode: EmailSendResult["mode"];
  reason: string;
}

interface EmailProviderOptions {
  senderEmail?: string | null;
  senderName?: string | null;
  senderAuthUser?: string | null;
  senderAuthPass?: string | null;
}

const providerCache = new Map<string, EmailProviderSelection>();

function buildDisplayFromAddress(fromEmail: string, fromName = DEFAULT_FROM_NAME): string {
  const trimmedEmail = fromEmail.trim();
  const trimmedName = fromName.trim();

  if (!trimmedEmail) return trimmedName;
  if (!trimmedName) return trimmedEmail;

  return `${trimmedName} <${trimmedEmail}>`;
}

async function getProviderSelection(options: EmailProviderOptions = {}): Promise<EmailProviderSelection> {
  await ensureServerSecretsLoaded();

  const emailEnabled = process.env.EMAIL_ENABLED === "true";
  const requestedProvider = (process.env.EMAIL_PROVIDER || "resend").toLowerCase();
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const effectiveFromEmail = options.senderEmail?.trim() || fromEmail;
  const effectiveFromName = options.senderName?.trim() || DEFAULT_FROM_NAME;
  const effectiveEmailUser = options.senderAuthUser?.trim() || emailUser;
  const effectiveEmailPass = options.senderAuthPass?.trim() || emailPass;

  if (!emailEnabled) {
    return {
      provider: new MockEmailProvider(),
      mode: "mock",
      reason: "EMAIL_ENABLED is false."
    };
  }

  if (requestedProvider === "gmail") {
    const normalizedEmailPass = effectiveEmailPass?.replace(/\s+/g, "");

    if (!effectiveEmailUser || !normalizedEmailPass) {
      return {
        provider: new MockEmailProvider(),
        mode: "mock",
        reason: "Missing EMAIL_USER or EMAIL_PASS for Gmail."
      };
    }

    const senderAddress = buildDisplayFromAddress(effectiveFromEmail || effectiveEmailUser, effectiveFromName);
    const cacheKey = [
      "gmail",
      effectiveEmailUser,
      normalizedEmailPass,
      senderAddress
    ].join("|");

    const cachedSelection = providerCache.get(cacheKey);
    if (cachedSelection) return cachedSelection;

    const selection = {
      provider: new GmailEmailProvider(effectiveEmailUser, normalizedEmailPass, senderAddress),
      mode: "live",
      reason: "Gmail provider configured."
    } satisfies EmailProviderSelection;
    providerCache.set(cacheKey, selection);
    return selection;
  }

  if (requestedProvider !== "resend") {
    return {
      provider: new MockEmailProvider(),
      mode: "mock",
      reason: `Unsupported EMAIL_PROVIDER "${requestedProvider}".`
    };
  }

  if (!resendApiKey || !effectiveFromEmail) {
    return {
      provider: new MockEmailProvider(),
      mode: "mock",
      reason: "Missing RESEND_API_KEY or FROM_EMAIL."
    };
  }

  return {
    provider: new ResendEmailProvider(resendApiKey, buildDisplayFromAddress(effectiveFromEmail, effectiveFromName)),
    mode: "live",
    reason: "Resend provider configured."
  };
}

export async function sendLeadNotification(lead: LeadSubmissionRecord): Promise<EmailSendResult> {
  const siteSettings = await getSiteSettings();
  const { subject, text, html } = buildLeadEmail(lead, { subject: siteSettings.leadEmailSubject });
  const selection = await getProviderSelection();
  const notificationEmail = siteSettings.leadRecipientEmail;

  console.info("[leads][email] Provider mode selected", {
    provider: selection.provider.name,
    mode: selection.mode,
    reason: selection.reason,
    recipient: notificationEmail
  });

  await selection.provider.sendLeadNotification({
    to: notificationEmail,
    subject,
    text,
    html,
    lead
  });

  return {
    mode: selection.mode,
    provider: selection.provider.name,
    recipientUsed: notificationEmail,
    subjectUsed: subject
  };
}

export async function sendContactNotification(contact: ContactSubmissionRecord): Promise<EmailSendResult> {
  const siteSettings = await getSiteSettings();
  const { subject, text, html } = buildContactEmail(contact, { subject: siteSettings.leadEmailSubject });
  const selection = await getProviderSelection();
  const notificationEmail = siteSettings.leadRecipientEmail;

  console.info("[contact][email] Provider mode selected", {
    provider: selection.provider.name,
    mode: selection.mode,
    reason: selection.reason,
    recipient: notificationEmail
  });

  await selection.provider.sendContactNotification({
    to: notificationEmail,
    subject,
    text,
    html,
    contact
  });

  return {
    mode: selection.mode,
    provider: selection.provider.name,
    recipientUsed: notificationEmail,
    subjectUsed: subject
  };
}

export async function sendDirectEmail(payload: GenericEmailPayload): Promise<EmailSendResult> {
  const selection = await getProviderSelection({
    senderEmail: payload.senderEmail,
    senderName: payload.senderName,
    senderAuthUser: payload.senderAuthUser,
    senderAuthPass: payload.senderAuthPass
  });

  console.info("[email] Provider mode selected", {
    provider: selection.provider.name,
    mode: selection.mode,
    reason: selection.reason,
    recipient: payload.to,
    senderOverride: payload.senderEmail ? "provided" : "default",
    authOverride: payload.senderAuthUser || payload.senderAuthPass ? "provided" : "default"
  });

  await selection.provider.sendMessage(payload);

  return {
    mode: selection.mode,
    provider: selection.provider.name,
    recipientUsed: payload.to,
    subjectUsed: payload.subject
  };
}
