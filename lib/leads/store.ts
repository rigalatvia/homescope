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
      createdAt
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
