import nodemailer from "nodemailer";
import type { ContactEmailPayload, EmailProvider, GenericEmailPayload, LeadEmailPayload } from "@/lib/email/types";

export class GmailEmailProvider implements EmailProvider {
  readonly name = "gmail";

  private readonly transporter;

  constructor(
    private readonly user: string,
    private readonly pass: string,
    private readonly fromEmail: string
  ) {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      pool: true,
      maxConnections: 1,
      maxMessages: 100,
      auth: {
        user: this.user,
        pass: this.pass
      }
    });
  }

  async sendMessage(payload: GenericEmailPayload): Promise<void> {
    await this.transporter.sendMail({
      from: this.fromEmail,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      replyTo: payload.replyTo || this.fromEmail
    });
  }

  async sendLeadNotification(payload: LeadEmailPayload): Promise<void> {
    await this.sendMessage(payload);
  }

  async sendContactNotification(payload: ContactEmailPayload): Promise<void> {
    await this.sendMessage(payload);
  }
}
