import { sendDirectEmail } from "@/lib/email";
import type { CrmTemplateRecord } from "@/types/crm";

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
  options?: { recipientName?: string }
): {
  subject: string;
  text: string;
  html: string;
} {
  const recipientName = options?.recipientName?.trim();
  const greeting = recipientName ? `Dear ${recipientName},` : "Hello,";
  const imageHtml = template.imageUrl
    ? `<img src="${template.imageUrl}" alt="${escapeHtml(template.name)}" style="display:block; width:100%; max-width:600px; height:auto; border:0;" />`
    : "";

  const text = [
    template.subject,
    "",
    greeting,
    "",
    template.headline,
    "",
    template.body,
    "",
    template.signature
  ].join("\n");

  const html = `
    <div style="margin:0; padding:24px; background:#f5f1e8; font-family:Georgia, 'Times New Roman', serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:24px; overflow:hidden;">
        ${imageHtml ? `<tr><td>${imageHtml}</td></tr>` : ""}
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 18px; font-size:14px; line-height:1.6; color:#64748b; font-family:Arial, sans-serif;">${escapeHtml(template.previewText)}</p>
            <p style="margin:0 0 14px; font-size:17px; line-height:1.7; color:#334155; font-family:Arial, sans-serif;">${escapeHtml(greeting)}</p>
            <h1 style="margin:0 0 18px; font-size:40px; line-height:1.1; color:#102a43; font-weight:600;">${escapeHtml(template.headline)}</h1>
            ${formatParagraphs(template.body)}
            <p style="margin:28px 0 0; font-size:16px; line-height:1.7; color:#102a43; white-space:pre-line; font-family:Arial, sans-serif; font-weight:600;">${escapeHtml(template.signature)}</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  return {
    subject: template.subject,
    text,
    html
  };
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
  const email = buildCrmTemplateEmail(input.template, { recipientName: input.recipientName });

  return sendDirectEmail({
    to: input.to,
    subject: email.subject,
    text: email.text,
    html: email.html
  });
}
