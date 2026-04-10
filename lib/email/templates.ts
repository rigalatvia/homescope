import type { LeadSubmissionRecord } from "@/types/lead";
import type { ContactSubmissionRecord } from "@/types/contact";

export function buildLeadEmail(lead: LeadSubmissionRecord): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = `New ${lead.intent === "showing_request" ? "showing request" : "listing question"} - ${lead.listingAddress}`;
  const text = [
    "New lead from HomeScope GTA website",
    "",
    `Intent: ${lead.intent}`,
    `Name: ${lead.fullName}`,
    `Email: ${lead.email}`,
    `Phone: ${lead.phone}`,
    `Preferred Viewing Time: ${lead.preferredDateTime}`,
    `Transaction Type: ${lead.leadTransactionType}`,
    `Lease Docs Ready: ${lead.isReadyToProvideDocs === true ? "Yes" : "No"}`,
    `Mortgage Pre-Approval: ${lead.hasMortgagePreapproval === true ? "Yes" : "No"}`,
    `Message: ${lead.message}`,
    "",
    "Listing Details",
    `Listing ID: ${lead.listingId}`,
    `Title: ${lead.listingTitle}`,
    `Address: ${lead.listingAddress}`,
    `City: ${lead.listingCity}`,
    `URL: ${lead.listingUrl}`,
    "",
    `Submitted At: ${lead.createdAt}`
  ].join("\n");

  const html = `
    <h2>New lead from HomeScope GTA website</h2>
    <p><strong>Intent:</strong> ${escapeHtml(lead.intent)}</p>
    <p><strong>Name:</strong> ${escapeHtml(lead.fullName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(lead.email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(lead.phone)}</p>
    <p><strong>Preferred Viewing Time:</strong> ${escapeHtml(lead.preferredDateTime)}</p>
    <p><strong>Transaction Type:</strong> ${escapeHtml(lead.leadTransactionType)}</p>
    <p><strong>Lease Docs Ready:</strong> ${lead.isReadyToProvideDocs === true ? "Yes" : "No"}</p>
    <p><strong>Mortgage Pre-Approval:</strong> ${lead.hasMortgagePreapproval === true ? "Yes" : "No"}</p>
    <p><strong>Message:</strong> ${escapeHtml(lead.message)}</p>
    <h3>Listing Details</h3>
    <p><strong>Listing ID:</strong> ${escapeHtml(lead.listingId)}</p>
    <p><strong>Title:</strong> ${escapeHtml(lead.listingTitle)}</p>
    <p><strong>Address:</strong> ${escapeHtml(lead.listingAddress)}</p>
    <p><strong>City:</strong> ${escapeHtml(lead.listingCity)}</p>
    <p><strong>URL:</strong> ${escapeHtml(lead.listingUrl)}</p>
    <p><strong>Submitted At:</strong> ${escapeHtml(lead.createdAt)}</p>
  `;

  return { subject, text, html };
}

export function buildContactEmail(contact: ContactSubmissionRecord): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = `New contact message - ${contact.subject}`;
  const text = [
    "New contact form message from HomeScope GTA website",
    "",
    `Name: ${contact.fullName}`,
    `Email: ${contact.email}`,
    `Phone: ${contact.phone || "Not provided"}`,
    `Subject: ${contact.subject}`,
    `Message: ${contact.message}`,
    "",
    `Submitted At: ${contact.createdAt}`
  ].join("\n");

  const html = `
    <h2>New contact form message from HomeScope GTA website</h2>
    <p><strong>Name:</strong> ${escapeHtml(contact.fullName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(contact.email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(contact.phone || "Not provided")}</p>
    <p><strong>Subject:</strong> ${escapeHtml(contact.subject)}</p>
    <p><strong>Message:</strong> ${escapeHtml(contact.message)}</p>
    <p><strong>Submitted At:</strong> ${escapeHtml(contact.createdAt)}</p>
  `;

  return { subject, text, html };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
