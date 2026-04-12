import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type { ContactSubmissionRecord } from "@/types/contact";
import type { LeadSubmissionRecord } from "@/types/lead";

const COMMUNICATIONS_COLLECTION = "communications";

type CommunicationType = "lead" | "contact";

interface CommunicationRecord {
  id: string;
  type: CommunicationType;
  source: "website";
  createdAt: string;
  createdAtServer: FieldValue;
  payload: LeadSubmissionRecord | ContactSubmissionRecord;
}

async function storeCommunication(
  type: CommunicationType,
  payload: LeadSubmissionRecord | ContactSubmissionRecord
): Promise<void> {
  const firestore = getFirebaseAdminFirestore();
  const docRef = firestore.collection(COMMUNICATIONS_COLLECTION).doc();
  const createdAt = new Date().toISOString();

  const record: CommunicationRecord = {
    id: docRef.id,
    type,
    source: "website",
    createdAt,
    createdAtServer: FieldValue.serverTimestamp(),
    payload
  };

  await docRef.set(record);

  console.info("[communications][persistence] Firestore write success", {
    collection: COMMUNICATIONS_COLLECTION,
    documentId: record.id,
    type
  });
}

export async function storeLeadCommunication(payload: LeadSubmissionRecord): Promise<void> {
  await storeCommunication("lead", payload);
}

export async function storeContactCommunication(payload: ContactSubmissionRecord): Promise<void> {
  await storeCommunication("contact", payload);
}

