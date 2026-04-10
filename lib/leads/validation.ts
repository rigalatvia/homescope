import type { LeadSubmissionInput } from "@/types/lead";
import type { ContactSubmissionInput } from "@/types/contact";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLeadInput(input: LeadSubmissionInput): string[] {
  const errors: string[] = [];

  if (!input.fullName.trim()) errors.push("Full name is required.");
  if (!input.email.trim() || !EMAIL_PATTERN.test(input.email)) errors.push("A valid email is required.");
  if (!input.phone.trim()) errors.push("Phone is required.");
  if (!input.preferredDateTime.trim()) errors.push("Preferred date/time is required.");
  if (!input.message.trim()) errors.push("Message is required.");
  if (!input.listingId.trim()) errors.push("Listing reference is missing.");
  if (!input.listingTitle.trim()) errors.push("Listing title is missing.");
  if (!input.listingAddress.trim()) errors.push("Listing address is missing.");
  if (!input.listingCity.trim()) errors.push("Listing city is missing.");
  if (!input.listingUrl.trim()) errors.push("Listing URL is missing.");
  if (input.website && input.website.trim().length > 0) errors.push("Spam protection triggered.");

  return errors;
}

export function validateContactInput(input: ContactSubmissionInput): string[] {
  const errors: string[] = [];

  if (!input.fullName.trim()) errors.push("Full name is required.");
  if (!input.email.trim() || !EMAIL_PATTERN.test(input.email)) errors.push("A valid email is required.");
  if (!input.subject.trim()) errors.push("Subject is required.");
  if (!input.message.trim()) errors.push("Message is required.");
  if (input.website && input.website.trim().length > 0) errors.push("Spam protection triggered.");

  return errors;
}
