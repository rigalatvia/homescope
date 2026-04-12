import type { LeadSubmissionRecord } from "@/types/lead";
import type { ContactSubmissionRecord } from "@/types/contact";

export interface LeadEmailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
  lead: LeadSubmissionRecord;
}

export interface ContactEmailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
  contact: ContactSubmissionRecord;
}

export interface EmailProvider {
  readonly name: string;
  sendLeadNotification(payload: LeadEmailPayload): Promise<void>;
  sendContactNotification(payload: ContactEmailPayload): Promise<void>;
}

export type EmailDeliveryMode = "mock" | "live";

export interface EmailSendResult {
  mode: EmailDeliveryMode;
  provider: string;
  recipientUsed: string;
  subjectUsed: string;
}
