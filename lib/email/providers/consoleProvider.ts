import type { ContactEmailPayload, EmailProvider, GenericEmailPayload, LeadEmailPayload } from "@/lib/email/types";

export class MockEmailProvider implements EmailProvider {
  readonly name = "mock";

  async sendMessage(payload: GenericEmailPayload): Promise<void> {
    console.info("[email] Mock provider captured payload", {
      provider: this.name,
      to: payload.to,
      subject: payload.subject
    });
    console.log("[email] Full mock payload", payload);
  }

  async sendLeadNotification(payload: LeadEmailPayload): Promise<void> {
    await this.sendMessage(payload);
  }

  async sendContactNotification(payload: ContactEmailPayload): Promise<void> {
    await this.sendMessage(payload);
  }
}
