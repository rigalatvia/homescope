import type { ContactEmailPayload, EmailProvider, LeadEmailPayload } from "@/lib/email/types";

export class SendGridEmailProvider implements EmailProvider {
  readonly name = "sendgrid";

  constructor(
    private readonly apiKey: string,
    private readonly fromEmail: string
  ) {}

  async sendLeadNotification(payload: LeadEmailPayload): Promise<void> {
    await this.send(payload.to, payload.subject, payload.text, payload.html);
  }

  async sendContactNotification(payload: ContactEmailPayload): Promise<void> {
    await this.send(payload.to, payload.subject, payload.text, payload.html);
  }

  private async send(to: string, subject: string, text: string, html: string): Promise<void> {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: this.fromEmail },
        subject,
        content: [
          { type: "text/plain", value: text },
          { type: "text/html", value: html }
        ]
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`SendGrid provider failed: ${response.status} ${body}`);
    }
  }
}
