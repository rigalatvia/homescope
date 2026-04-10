import { randomUUID } from "node:crypto";
import type { ContactSubmissionInput } from "@/types/contact";
import type { LeadSubmissionInput } from "@/types/lead";
import type { ContactMessageDocument, LeadSubmissionDocument } from "@/types/firebase-sync";

export function mapLeadInputToFirestoreDoc(input: LeadSubmissionInput): LeadSubmissionDocument {
  const listingSlug = safeSlugFromUrl(input.listingUrl);
  return {
    id: randomUUID(),
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    preferredDateTime: input.preferredDateTime,
    message: input.message,
    listingId: input.listingId,
    listingSlug,
    municipality: input.listingCity || null,
    intent: "showing_request",
    leadTransactionType: input.leadTransactionType,
    isReadyToProvideDocs: input.isReadyToProvideDocs === true,
    hasMortgagePreapproval: input.hasMortgagePreapproval === true,
    createdAt: new Date().toISOString(),
    source: "website"
  };
}

export function mapContactInputToFirestoreDoc(input: ContactSubmissionInput): ContactMessageDocument {
  return {
    id: randomUUID(),
    fullName: input.fullName,
    email: input.email,
    phone: input.phone?.trim() || null,
    subject: input.subject,
    message: input.message,
    createdAt: new Date().toISOString(),
    source: "website"
  };
}

function safeSlugFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || "listing";
  } catch {
    return "listing";
  }
}
