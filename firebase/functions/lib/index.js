"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendLeadEmailOnCreate = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const params_1 = require("firebase-functions/params");
const v2_1 = require("firebase-functions/v2");
const firestore_2 = require("firebase-functions/v2/firestore");
const nodemailer_1 = __importDefault(require("nodemailer"));
(0, app_1.initializeApp)();
const EMAIL_USER = (0, params_1.defineSecret)("EMAIL_USER");
const EMAIL_PASS = (0, params_1.defineSecret)("EMAIL_PASS");
const LEADS_COLLECTION = "leads";
const LEAD_RECIPIENT = "yanginzburg@gmail.com";
const BASE_SUBJECT = "Homescope GTA LEAD";
function buildSubject(lead) {
    const address = (lead.listingAddress || "").trim();
    return address ? `${BASE_SUBJECT} - ${address}` : BASE_SUBJECT;
}
function buildTextBody(leadId, lead, submittedAt) {
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
exports.sendLeadEmailOnCreate = (0, firestore_2.onDocumentCreated)({
    document: `${LEADS_COLLECTION}/{leadId}`,
    region: "northamerica-northeast2",
    timeoutSeconds: 60,
    secrets: [EMAIL_USER, EMAIL_PASS]
}, async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        v2_1.logger.warn("[lead-email-trigger] Missing snapshot in create event.");
        return;
    }
    const leadId = event.params.leadId;
    const lead = (snapshot.data() || {});
    const submittedAt = new Date().toISOString();
    const subject = buildSubject(lead);
    const firestore = (0, firestore_1.getFirestore)();
    const leadRef = firestore.collection(LEADS_COLLECTION).doc(leadId);
    try {
        const transporter = nodemailer_1.default.createTransport({
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
        await leadRef.set({
            emailStatus: "sent",
            emailSentAt: submittedAt,
            emailRecipientUsed: LEAD_RECIPIENT,
            emailError: null,
            emailSentAtServer: firestore_1.FieldValue.serverTimestamp()
        }, { merge: true });
        v2_1.logger.info("[lead-email-trigger] Email sent successfully.", {
            leadId,
            emailRecipientUsed: LEAD_RECIPIENT
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown email error";
        await leadRef.set({
            emailStatus: "failed",
            emailSentAt: null,
            emailRecipientUsed: LEAD_RECIPIENT,
            emailError: message,
            emailFailedAtServer: firestore_1.FieldValue.serverTimestamp()
        }, { merge: true });
        v2_1.logger.error("[lead-email-trigger] Email send failed.", {
            leadId,
            emailRecipientUsed: LEAD_RECIPIENT,
            error: message
        });
    }
});
//# sourceMappingURL=index.js.map