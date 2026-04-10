import type { FirestoreSyncRepository } from "@/lib/firebase-sync/firestore/repository";
import type { ContactMessageDocument, LeadSubmissionDocument } from "@/types/firebase-sync";

export async function saveLeadSubmissionToFirestore(
  repository: FirestoreSyncRepository,
  lead: LeadSubmissionDocument
): Promise<void> {
  await repository.saveLead(lead);
}

export async function saveContactMessageToFirestore(
  repository: FirestoreSyncRepository,
  contact: ContactMessageDocument
): Promise<void> {
  await repository.saveContactMessage(contact);
}
