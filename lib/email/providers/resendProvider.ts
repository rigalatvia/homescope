import type { ContactEmailPayload, EmailProvider, LeadEmailPayload } from "@/lib/email/types";

export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";

  constructor(
    private readonly apiKey: string,
    private readonly fromEmail: string
  ) {}

  async sendLeadNotification(payload: LeadEmailPayload): Promise<void> {
    await this.send(payload.to, payload.subject, payload.html, payload.text);
  }

  async sendContactNotification(payload: ContactEmailPayload): Promise<void> {
    await this.send(payload.to, payload.subject, payload.html, payload.text);
  }

  private async send(to: string, subject: string, html: string, text: string): Promise<void> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: this.fromEmail,
        to,
        subject,
        html,
        text
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Resend provider failed: ${response.status} ${body}`);
    }
  }
}
