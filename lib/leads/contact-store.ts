import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type { ContactSubmissionInput, ContactSubmissionRecord } from "@/types/contact";

const CONTACT_COLLECTION = "contactMessages";

export async function storeContactSubmission(input: ContactSubmissionInput): Promise<ContactSubmissionRecord> {
  try {
    const firestore = getFirebaseAdminFirestore();
    const createdAt = new Date().toISOString();
    const docRef = firestore.collection(CONTACT_COLLECTION).doc();

    const record: ContactSubmissionRecord = {
      ...input,
      id: docRef.id,
      source: "website",
      createdAt
    };

    await docRef.set({
      ...record,
      createdAtServer: FieldValue.serverTimestamp()
    });

    console.info("[contact][persistence] Firestore write success", {
      collection: CONTACT_COLLECTION,
      documentId: record.id
    });

    return record;
  } catch (error) {
    console.error("[contact][persistence] Firestore write failed", error);
    throw error;
  }
}

interface ContactEmailDeliveryUpdate {
  emailDeliveryStatus: "sent" | "failed" | "mock";
  emailRecipientUsed: string;
  subjectUsed: string;
  emailProviderUsed: string;
  emailMode: "live" | "mock";
  emailError?: string;
}

export async function updateContactEmailDeliveryStatus(
  contactId: string,
  update: ContactEmailDeliveryUpdate
): Promise<void> {
  try {
    const firestore = getFirebaseAdminFirestore();
    await firestore
      .collection(CONTACT_COLLECTION)
      .doc(contactId)
      .set(
        {
          ...update,
          emailProcessedAt: new Date().toISOString(),
          emailProcessedAtServer: FieldValue.serverTimestamp()
        },
        { merge: true }
      );

    console.info("[contact][persistence] Firestore email delivery status updated", {
      collection: CONTACT_COLLECTION,
      documentId: contactId,
      emailDeliveryStatus: update.emailDeliveryStatus
    });
  } catch (error) {
    console.error("[contact][persistence] Failed to update email delivery status", {
      contactId,
      error
    });
    throw error;
  }
}
