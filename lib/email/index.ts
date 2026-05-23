import { MockEmailProvider } from "@/lib/email/providers/consoleProvider";
import { GmailEmailProvider } from "@/lib/email/providers/gmailProvider";
import { ResendEmailProvider } from "@/lib/email/providers/resendProvider";
import type { EmailProvider, EmailSendResult, GenericEmailPayload } from "@/lib/email/types";
import { buildContactEmail, buildLeadEmail } from "@/lib/email/templates";
import { ensureServerSecretsLoaded } from "@/lib/server/secret-manager";
import { getSiteSettings } from "@/lib/settings/site-settings";
import type { ContactSubmissionRecord } from "@/types/contact";
import type { LeadSubmissionRecord } from "@/types/lead";

interface EmailProviderSelection {
  provider: EmailProvider;
  mode: EmailSendResult["mode"];
  reason: string;
}

async function getProviderSelection(): Promise<EmailProviderSelection> {
  await ensureServerSecretsLoaded();

  const emailEnabled = process.env.EMAIL_ENABLED === "true";
  const requestedProvider = (process.env.EMAIL_PROVIDER || "resend").toLowerCase();
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailEnabled) {
    return {
      provider: new MockEmailProvider(),
      mode: "mock",
      reason: "EMAIL_ENABLED is false."
    };
  }

  if (requestedProvider === "gmail") {
    if (!emailUser || !emailPass) {
      return {
        provider: new MockEmailProvider(),
        mode: "mock",
        reason: "Missing EMAIL_USER or EMAIL_PASS for Gmail."
      };
    }

    return {
      provider: new GmailEmailProvider(emailUser, emailPass, fromEmail || emailUser),
      mode: "live",
      reason: "Gmail provider configured."
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
  const selection = await getProviderSelection();

  console.info("[email] Provider mode selected", {
    provider: selection.provider.name,
    mode: selection.mode,
    reason: selection.reason,
    recipient: payload.to
  });

  await selection.provider.sendMessage(payload);

  return {
    mode: selection.mode,
    provider: selection.provider.name,
    recipientUsed: payload.to,
    subjectUsed: payload.subject
  };
}
