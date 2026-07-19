import { sendDirectEmail } from "@/lib/email";
import { buildCrmUnsubscribeUrl } from "@/lib/crm/unsubscribe";
import type { CrmTemplateRecord } from "@/types/crm";

const CRM_CAMPAIGN_FROM_NAME = "Yan Ginzburg";

function getCrmCampaignFromEmail(): string | undefined {
  return process.env.CRM_CAMPAIGN_FROM_EMAIL?.trim() || process.env.FROM_EMAIL?.trim() || undefined;
}

function getCrmCampaignEmailPass(): string | undefined {
  return process.env.CRM_CAMPAIGN_EMAIL_PASS?.trim() || undefined;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatParagraphs(value: string): string {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px; font-size:16px; line-height:1.7; color:#334155;">${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`
    )
    .join("");
}

export function buildCrmTemplateEmail(
  template: CrmTemplateRecord,
  options?: { recipientName?: string; unsubscribeUrl?: string }
): {
  subject: string;
  text: string;
  html: string;
} {
  const recipientName = options?.recipientName?.trim();
  const unsubscribeUrl = options?.unsubscribeUrl?.trim();
  const greeting = recipientName ? `Dear ${recipientName},` : "Hello,";
  const imageHtml = template.imageUrl
    ? `<img src="${template.imageUrl}" alt="${escapeHtml(template.name)}" style="display:block; width:100%; max-width:600px; height:auto; border:0;" />`
    : "";
  const hiddenPreviewText = escapeHtml(template.previewText || template.subject || template.headline);
  const previewPadding = "&nbsp;".repeat(24);

  const text = [
    template.subject,
    "",
    template.previewText,
    "",
    greeting,
    "",
    template.headline,
    "",
    template.body,
    "",
    template.signature,
    ...(unsubscribeUrl
      ? [
          "",
          "You are receiving this email because you are in Yan Ginzburg's CRM contact list.",
          `Unsubscribe: ${unsubscribeUrl}`
        ]
      : [])
  ].join("\n");

  const unsubscribeHtml = unsubscribeUrl
    ? `
        <tr>
          <td style="padding:0 40px 32px;">
            <div style="border-top:1px solid #e2e8f0; padding-top:18px; font-family:Arial, sans-serif; font-size:12px; line-height:1.6; color:#64748b;">
              You are receiving this email because you are in Yan Ginzburg's CRM contact list.
              <a href="${escapeHtml(unsubscribeUrl)}" style="color:#0f4c5c; text-decoration:underline;">Unsubscribe</a>
            </div>
          </td>
        </tr>
      `
    : "";

  const html = `
    <div style="margin:0; padding:24px; background:#f5f1e8; font-family:Georgia, 'Times New Roman', serif;">
      <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all; color:transparent;">
        ${hiddenPreviewText}${previewPadding}
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:24px; overflow:hidden;">
        ${imageHtml ? `<tr><td>${imageHtml}</td></tr>` : ""}
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 14px; font-size:17px; line-height:1.7; color:#334155; font-family:Arial, sans-serif;">${escapeHtml(greeting)}</p>
            <h1 style="margin:0 0 18px; font-size:40px; line-height:1.1; color:#102a43; font-weight:600;">${escapeHtml(template.headline)}</h1>
            ${formatParagraphs(template.body)}
            <p style="margin:28px 0 0; font-size:16px; line-height:1.7; color:#102a43; white-space:pre-line; font-family:Arial, sans-serif; font-weight:600;">${escapeHtml(template.signature)}</p>
          </td>
        </tr>
        ${unsubscribeHtml}
      </table>
    </div>
  `;

  return {
    subject: template.subject,
    text,
    html
  };
}

export async function sendCrmTemplateEmail(input: {
  template: CrmTemplateRecord;
  to: string;
  recipientName?: string;
  replyTo?: string;
  contactId?: string;
}): Promise<{
  mode: "mock" | "live";
  provider: string;
  recipientUsed: string;
  subjectUsed: string;
}> {
  const unsubscribeUrl = input.contactId
    ? await buildCrmUnsubscribeUrl(input.contactId, input.to)
    : undefined;
  const email = buildCrmTemplateEmail(input.template, {
    recipientName: input.recipientName,
    unsubscribeUrl
  });

  return sendDirectEmail({
    to: input.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
    replyTo: input.replyTo,
    headers: unsubscribeUrl ? { "List-Unsubscribe": `<${unsubscribeUrl}>` } : undefined,
    senderEmail: getCrmCampaignFromEmail(),
    senderName: CRM_CAMPAIGN_FROM_NAME,
    senderAuthUser: process.env.CRM_CAMPAIGN_FROM_EMAIL?.trim() || undefined,
    senderAuthPass: getCrmCampaignEmailPass()
  });
}

export async function sendCrmTemplateTestEmail(input: {
  template: CrmTemplateRecord;
  to: string;
  recipientName?: string;
}): Promise<{
  mode: "mock" | "live";
  provider: string;
  recipientUsed: string;
  subjectUsed: string;
}> {
  return sendCrmTemplateEmail(input);
}
