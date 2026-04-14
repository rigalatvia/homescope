import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type { LeadSubmissionInput, LeadSubmissionRecord } from "@/types/lead";

const LEADS_COLLECTION = "leads";

export async function storeLeadSubmission(input: LeadSubmissionInput): Promise<LeadSubmissionRecord> {
  try {
    const firestore = getFirebaseAdminFirestore();
    const createdAt = new Date().toISOString();
    const docRef = firestore.collection(LEADS_COLLECTION).doc();

    const record: LeadSubmissionRecord = {
      ...input,
      id: docRef.id,
      source: "website",
      createdAt,
      emailStatus: "pending",
      emailSentAt: null
    };

    await docRef.set({
      ...record,
      createdAtServer: FieldValue.serverTimestamp()
    });

    console.info("[leads][persistence] Firestore write success", {
      collection: LEADS_COLLECTION,
      documentId: record.id
    });

    return record;
  } catch (error) {
    console.error("[leads][persistence] Firestore write failed", error);
    throw error;
  }
}

interface LeadEmailDeliveryUpdate {
  emailDeliveryStatus: "sent" | "failed" | "mock";
  emailRecipientUsed: string;
  subjectUsed: string;
  emailProviderUsed: string;
  emailMode: "live" | "mock";
  emailError?: string;
}

export async function updateLeadEmailDeliveryStatus(
  leadId: string,
  update: LeadEmailDeliveryUpdate
): Promise<void> {
  try {
    const firestore = getFirebaseAdminFirestore();
    await firestore
      .collection(LEADS_COLLECTION)
      .doc(leadId)
      .set(
        {
          ...update,
          emailProcessedAt: new Date().toISOString(),
          emailProcessedAtServer: FieldValue.serverTimestamp()
        },
        { merge: true }
      );

    console.info("[leads][persistence] Firestore email delivery status updated", {
      collection: LEADS_COLLECTION,
      documentId: leadId,
      emailDeliveryStatus: update.emailDeliveryStatus
    });
  } catch (error) {
    console.error("[leads][persistence] Failed to update email delivery status", {
      leadId,
      error
    });
    throw error;
  }
}
