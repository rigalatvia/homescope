import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions/v2";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import nodemailer from "nodemailer";

initializeApp();

const EMAIL_USER = defineSecret("EMAIL_USER");
const EMAIL_PASS = defineSecret("EMAIL_PASS");
const LEADS_COLLECTION = "leads";
const LEAD_RECIPIENT = "yanginzburg@gmail.com";
const BASE_SUBJECT = "Homescope GTA LEAD";

interface LeadPayload {
  fullName?: string;
  email?: string;
  phone?: string;
  preferredDateTime?: string;
  message?: string;
  listingId?: string;
  listingMlsNumber?: string;
  listingTitle?: string;
  listingAddress?: string;
  listingCity?: string;
  listingUrl?: string;
  leadTransactionType?: "sale" | "lease";
}

function buildSubject(lead: LeadPayload): string {
  const address = (lead.listingAddress || "").trim();
  return address ? `${BASE_SUBJECT} - ${address}` : BASE_SUBJECT;
}

function buildTextBody(leadId: string, lead: LeadPayload, submittedAt: string): string {
  const rows = [
    "New HomeScope GTA lead received",
    "",
    `Lead ID: ${leadId}`,
    `Submitted At: ${submittedAt}`,
    `Full Name: ${lead.fullName || "-"}`,
    `Email: ${lead.email || "-"}`,
    `Phone: ${lead.phone || "-"}`,
    `Preferred Date/Time: ${lead.preferredDateTime || "-"}`,
    `Message: ${lead.message || "-"}`,
    "",
    `Listing ID: ${lead.listingId || "-"}`,
    `MLS Number: ${lead.listingMlsNumber || "-"}`,
    `Listing Title: ${lead.listingTitle || "-"}`,
    `Address: ${lead.listingAddress || "-"}`,
    `City: ${lead.listingCity || "-"}`,
    `Listing URL: ${lead.listingUrl || "-"}`,
    `Transaction Type: ${lead.leadTransactionType || "-"}`
  ];

  return rows.join("\n");
}

export const sendLeadEmailOnLeadCreated = onDocumentCreated(
  {
    document: `${LEADS_COLLECTION}/{leadId}`,
    region: "northamerica-northeast2",
    timeoutSeconds: 60,
    secrets: [EMAIL_USER, EMAIL_PASS]
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.warn("[lead-email-trigger] Missing snapshot in create event.");
      return;
    }

    const leadId = event.params.leadId as string;
    const lead = (snapshot.data() || {}) as LeadPayload;
    const submittedAt = new Date().toISOString();
    const subject = buildSubject(lead);

    const firestore = getFirestore();
    const leadRef = firestore.collection(LEADS_COLLECTION).doc(leadId);

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: EMAIL_USER.value(),
          pass: EMAIL_PASS.value()
        }
      });

      await transporter.sendMail({
        from: EMAIL_USER.value(),
        to: LEAD_RECIPIENT,
        subject,
        text: buildTextBody(leadId, lead, submittedAt)
      });

      await leadRef.set(
        {
          emailStatus: "sent",
          emailSentAt: submittedAt,
          emailRecipientUsed: LEAD_RECIPIENT,
          emailError: null,
          emailSentAtServer: FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      logger.info("[lead-email-trigger] Email sent successfully.", {
        leadId,
        emailRecipientUsed: LEAD_RECIPIENT
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown email error";

      await leadRef.set(
        {
          emailStatus: "failed",
          emailSentAt: null,
          emailRecipientUsed: LEAD_RECIPIENT,
          emailError: message,
          emailFailedAtServer: FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      logger.error("[lead-email-trigger] Email send failed.", {
        leadId,
        emailRecipientUsed: LEAD_RECIPIENT,
        error: message
      });
    }
  }
);
