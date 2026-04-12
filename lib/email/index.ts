import { MockEmailProvider } from "@/lib/email/providers/consoleProvider";
import { ResendEmailProvider } from "@/lib/email/providers/resendProvider";
import type { EmailProvider, EmailSendResult } from "@/lib/email/types";
import { buildContactEmail, buildLeadEmail } from "@/lib/email/templates";
import { getSiteSettings } from "@/lib/settings/site-settings";
import type { ContactSubmissionRecord } from "@/types/contact";
import type { LeadSubmissionRecord } from "@/types/lead";

interface EmailProviderSelection {
  provider: EmailProvider;
  mode: EmailSendResult["mode"];
  reason: string;
}

function getProviderSelection(): EmailProviderSelection {
  const emailEnabled = process.env.EMAIL_ENABLED === "true";
  const requestedProvider = (process.env.EMAIL_PROVIDER || "resend").toLowerCase();
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;

  if (!emailEnabled) {
    return {
      provider: new MockEmailProvider(),
      mode: "mock",
      reason: "EMAIL_ENABLED is false."
    };
  }

  if (requestedProvider !== "resend") {
    return {
      provider: new MockEmailProvider(),
      mode: "mock",
      reason: `Unsupported EMAIL_PROVIDER "${requestedProvider}".`
    };
  }

  if (!resendApiKey || !fromEmail) {
    return {
      provider: new MockEmailProvider(),
      mode: "mock",
      reason: "Missing RESEND_API_KEY or FROM_EMAIL."
    };
  }

  return {
    provider: new ResendEmailProvider(resendApiKey, fromEmail),
    mode: "live",
    reason: "Resend provider configured."
  };
}

export async function sendLeadNotification(lead: LeadSubmissionRecord): Promise<EmailSendResult> {
  const siteSettings = await getSiteSettings();
  const { subject, text, html } = buildLeadEmail(lead, { subject: siteSettings.leadEmailSubject });
  const selection = getProviderSelection();
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
  const selection = getProviderSelection();
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
