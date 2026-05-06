export type LeadIntent = "showing_request" | "question";
export type LeadTransactionType = "sale" | "lease";
export type LeadFormType = "showing" | "contact";
export type LeadStatus = "pending" | "confirmed";

export interface LeadSubmissionInput {
  fullName: string;
  email: string;
  phone: string;
  agreesToTextMessages?: boolean;
  preferredDateTime: string;
  message: string;
  intent: LeadIntent;
  listingId: string;
  listingMlsNumber: string;
  listingTitle: string;
  listingAddress: string;
  listingCity: string;
  listingUrl: string;
  listingImageUrl?: string;
  leadTransactionType: LeadTransactionType;
  formType?: LeadFormType;
  status?: LeadStatus;
  userId?: string;
  userEmail?: string;
  userName?: string;
  isReadyToProvideDocs?: boolean;
  hasMortgagePreapproval?: boolean;
  website?: string;
}

export interface LeadSubmissionRecord extends LeadSubmissionInput {
  id: string;
  createdAt: string;
  source: "website";
  emailStatus?: "pending" | "sent" | "failed";
  emailSentAt?: string | null;
  emailDeliveryStatus?: "sent" | "failed" | "mock";
  emailRecipientUsed?: string;
  subjectUsed?: string;
  emailProviderUsed?: string;
  emailMode?: "live" | "mock";
  emailError?: string;
  emailProcessedAt?: string;
}
