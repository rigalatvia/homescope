export type LeadIntent = "showing_request" | "question";

export interface LeadSubmissionInput {
  fullName: string;
  email: string;
  phone: string;
  preferredDateTime: string;
  message: string;
  intent: LeadIntent;
  listingId: string;
  listingTitle: string;
  listingAddress: string;
  listingCity: string;
  listingUrl: string;
  website?: string;
}

export interface LeadSubmissionRecord extends LeadSubmissionInput {
  id: string;
  createdAt: string;
  source: "website";
}
