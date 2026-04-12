export interface ContactSubmissionInput {
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  website?: string;
}

export interface ContactSubmissionRecord extends ContactSubmissionInput {
  id: string;
  createdAt: string;
  source: "website";
  emailDeliveryStatus?: "sent" | "failed" | "mock";
  emailRecipientUsed?: string;
  subjectUsed?: string;
  emailProviderUsed?: string;
  emailMode?: "live" | "mock";
  emailError?: string;
  emailProcessedAt?: string;
}
