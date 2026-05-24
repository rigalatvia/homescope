import type { LeadSubmissionRecord } from "@/types/lead";
import type { ContactSubmissionRecord } from "@/types/contact";

export function buildLeadEmail(
  lead: LeadSubmissionRecord,
  options?: { subject?: string }
): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = options?.subject?.trim() || "Homescope GTA LEAD";
  const formattedIntent = humanizeToken(lead.intent);
  const formattedPhone = formatPhoneNumber(lead.phone);
  const formattedPreferredViewingTime = formatDateTimeValue(lead.preferredDateTime, {
    assumeTorontoWallClock: true
  });
  const formattedTransactionType = humanizeToken(lead.leadTransactionType);
  const formattedSubmittedAt = formatDateTimeValue(lead.createdAt);
  const formattedListingTitle = lead.listingTitle.trim() || "Listing";
  const text = [
    "New lead from HomeScope GTA website",
    "",
    `Intent: ${formattedIntent}`,
    `Name: ${lead.fullName}`,
    `Email: ${lead.email}`,
    `Phone: ${formattedPhone}`,
    `Preferred Viewing Time: ${formattedPreferredViewingTime}`,
    `Transaction Type: ${formattedTransactionType}`,
    `Lease Docs Ready: ${lead.isReadyToProvideDocs === true ? "Yes" : "No"}`,
    `Mortgage Pre-Approval: ${lead.hasMortgagePreapproval === true ? "Yes" : "No"}`,
    `Message: ${lead.message}`,
    "",
    "Listing Details",
    `Listing ID: ${lead.listingId}`,
    `MLS Number: ${lead.listingMlsNumber}`,
    `Title: ${formattedListingTitle}`,
    `Address: ${lead.listingAddress}`,
    `City: ${lead.listingCity}`,
    `URL: ${lead.listingUrl}`,
    "",
    `Submitted At: ${formattedSubmittedAt}`
  ].join("\n");

  const html = `
    <h2>New lead from HomeScope GTA website</h2>
    <p><strong>Intent:</strong> ${escapeHtml(formattedIntent)}</p>
    <p><strong>Name:</strong> ${escapeHtml(lead.fullName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(lead.email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(formattedPhone)}</p>
    <p><strong>Preferred Viewing Time:</strong> ${escapeHtml(formattedPreferredViewingTime)}</p>
    <p><strong>Transaction Type:</strong> ${escapeHtml(formattedTransactionType)}</p>
    <p><strong>Lease Docs Ready:</strong> ${lead.isReadyToProvideDocs === true ? "Yes" : "No"}</p>
    <p><strong>Mortgage Pre-Approval:</strong> ${lead.hasMortgagePreapproval === true ? "Yes" : "No"}</p>
    <p><strong>Message:</strong> ${escapeHtml(lead.message)}</p>
    <h3>Listing Details</h3>
    <p><strong>Listing ID:</strong> ${escapeHtml(lead.listingId)}</p>
    <p><strong>MLS Number:</strong> ${escapeHtml(lead.listingMlsNumber)}</p>
    <p><strong>Title:</strong> ${escapeHtml(formattedListingTitle)}</p>
    <p><strong>Address:</strong> ${escapeHtml(lead.listingAddress)}</p>
    <p><strong>City:</strong> ${escapeHtml(lead.listingCity)}</p>
    <p><strong>URL:</strong> <a href="${escapeHtmlAttribute(lead.listingUrl)}">${escapeHtml(lead.listingUrl)}</a></p>
    <p><strong>Submitted At:</strong> ${escapeHtml(formattedSubmittedAt)}</p>
  `;

  return { subject, text, html };
}

export function buildContactEmail(
  contact: ContactSubmissionRecord,
  options?: { subject?: string }
): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = options?.subject?.trim() || "Homescope GTA LEAD";
  const formattedPhone = contact.phone ? formatPhoneNumber(contact.phone) : "Not provided";
  const formattedSubmittedAt = formatDateTimeValue(contact.createdAt);
  const text = [
    "New contact form message from HomeScope GTA website",
    "",
    `Name: ${contact.fullName}`,
    `Email: ${contact.email}`,
    `Phone: ${formattedPhone}`,
    `Subject: ${contact.subject}`,
    `Message: ${contact.message}`,
    "",
    `Submitted At: ${formattedSubmittedAt}`
  ].join("\n");

  const html = `
    <h2>New contact form message from HomeScope GTA website</h2>
    <p><strong>Name:</strong> ${escapeHtml(contact.fullName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(contact.email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(formattedPhone)}</p>
    <p><strong>Subject:</strong> ${escapeHtml(contact.subject)}</p>
    <p><strong>Message:</strong> ${escapeHtml(contact.message)}</p>
    <p><strong>Submitted At:</strong> ${escapeHtml(formattedSubmittedAt)}</p>
  `;

  return { subject, text, html };
}

function humanizeToken(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "-";

  return normalized
    .replaceAll(/[_-]+/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return value.trim() || "-";
}

function formatDateTimeValue(
  value: string,
  options?: {
    assumeTorontoWallClock?: boolean;
  }
): string {
  const trimmed = value.trim();
  if (!trimmed) return "-";

  if (options?.assumeTorontoWallClock && isNaiveDateTime(trimmed)) {
    return formatNaiveTorontoDateTime(trimmed);
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return trimmed;

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short"
  }).format(parsed);
}

function isNaiveDateTime(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value);
}

function formatNaiveTorontoDateTime(value: string): string {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map((part) => Number(part));
  const [hourPart, minutePart] = timePart.split(":");
  const hour24 = Number(hourPart);
  const minute = Number(minutePart);

  const calendarDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const formattedDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(calendarDate);

  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  return `${formattedDate} at ${hour12}:${String(minute).padStart(2, "0")} ${period} Toronto time`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeHtmlAttribute(value: string): string {
  return escapeHtml(value);
}
