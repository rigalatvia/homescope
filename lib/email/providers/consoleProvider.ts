import type { ContactEmailPayload, EmailProvider, LeadEmailPayload } from "@/lib/email/types";

export class MockEmailProvider implements EmailProvider {
  readonly name = "mock";

  async sendLeadNotification(payload: LeadEmailPayload): Promise<void> {
    console.info("[leads][email] Mock provider captured payload", {
      provider: this.name,
      to: payload.to,
      subject: payload.subject,
      leadId: payload.lead.id,
      listingId: payload.lead.listingId
    });
    console.log("[leads][email] Full mock payload", payload);
  }

  async sendContactNotification(payload: ContactEmailPayload): Promise<void> {
    console.info("[contact][email] Mock provider captured payload", {
      provider: this.name,
      to: payload.to,
      subject: payload.subject,
      contactId: payload.contact.id
    });
    console.log("[contact][email] Full mock payload", payload);
  }
}
