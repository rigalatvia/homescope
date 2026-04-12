import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type { ContactSubmissionRecord } from "@/types/contact";
import type { LeadSubmissionRecord, LeadTransactionType } from "@/types/lead";

const CONTACTS_COLLECTION = "contacts";

type ContactSourceType = "lead" | "contact";

interface ContactListingReference {
  listingId: string;
  mlsNumber: string;
  address: string;
  city: string;
  listingUrl: string;
  transactionType: LeadTransactionType;
  capturedAt: string;
}

interface ContactSearchCriteria {
  transactionTypes: LeadTransactionType[];
  municipalities: string[];
  latestSummary: string;
  lastUpdatedAt: string;
}

interface ContactProfileDocument {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  source: "website";
  firstSeenAt: string;
  lastSeenAt: string;
  lastSourceType: ContactSourceType;
  leadCount: number;
  contactMessageCount: number;
  searchCriteria: ContactSearchCriteria;
  recentListings: ContactListingReference[];
  updatedAt: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone?: string): string {
  return (phone ?? "").replace(/\D/g, "");
}

function buildContactDocumentId(email: string, phone?: string): string {
  const emailPart = normalizeEmail(email).replace(/[^a-z0-9]/g, "_");
  const phonePart = normalizePhone(phone);
  return phonePart ? `${emailPart}_${phonePart}` : emailPart;
}

function mergeUnique(existing: string[], incoming: string[]): string[] {
  return Array.from(new Set([...existing, ...incoming].filter((value) => value.trim().length > 0)));
}

function truncateText(input: string, maxLength = 500): string {
  return input.length > maxLength ? `${input.slice(0, maxLength)}...` : input;
}

function ensureSearchCriteria(existing?: ContactSearchCriteria): ContactSearchCriteria {
  return (
    existing ?? {
      transactionTypes: [],
      municipalities: [],
      latestSummary: "",
      lastUpdatedAt: new Date().toISOString()
    }
  );
}

function ensureListings(existing?: ContactListingReference[]): ContactListingReference[] {
  return Array.isArray(existing) ? existing : [];
}

function dedupeAndCapListings(listings: ContactListingReference[], maxItems = 20): ContactListingReference[] {
  const seen = new Set<string>();
  const deduped: ContactListingReference[] = [];

  for (const listing of listings) {
    const key = `${listing.listingId}|${listing.mlsNumber}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(listing);
  }

  return deduped.slice(0, maxItems);
}

export async function upsertContactFromLead(lead: LeadSubmissionRecord): Promise<void> {
  const firestore = getFirebaseAdminFirestore();
  const docId = buildContactDocumentId(lead.email, lead.phone);
  const docRef = firestore.collection(CONTACTS_COLLECTION).doc(docId);
  const now = new Date().toISOString();

  await firestore.runTransaction(async (transaction) => {
    const existingSnapshot = await transaction.get(docRef);
    const existing = existingSnapshot.exists ? (existingSnapshot.data() as ContactProfileDocument) : null;

    const existingCriteria = ensureSearchCriteria(existing?.searchCriteria);
    const existingListings = ensureListings(existing?.recentListings);

    const incomingListing: ContactListingReference = {
      listingId: lead.listingId,
      mlsNumber: lead.listingMlsNumber,
      address: lead.listingAddress,
      city: lead.listingCity,
      listingUrl: lead.listingUrl,
      transactionType: lead.leadTransactionType,
      capturedAt: now
    };

    const mergedDocument: ContactProfileDocument = {
      id: docId,
      fullName: lead.fullName,
      email: normalizeEmail(lead.email),
      phone: normalizePhone(lead.phone),
      source: "website",
      firstSeenAt: existing?.firstSeenAt ?? now,
      lastSeenAt: now,
      lastSourceType: "lead",
      leadCount: (existing?.leadCount ?? 0) + 1,
      contactMessageCount: existing?.contactMessageCount ?? 0,
      searchCriteria: {
        transactionTypes: mergeUnique(existingCriteria.transactionTypes, [lead.leadTransactionType]) as LeadTransactionType[],
        municipalities: mergeUnique(existingCriteria.municipalities, [lead.listingCity]),
        latestSummary: truncateText(lead.message.trim()),
        lastUpdatedAt: now
      },
      recentListings: dedupeAndCapListings([incomingListing, ...existingListings]),
      updatedAt: now
    };

    transaction.set(
      docRef,
      {
        ...mergedDocument,
        updatedAtServer: FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  });

  console.info("[contacts][persistence] Upsert from lead success", {
    collection: CONTACTS_COLLECTION,
    documentId: docId,
    leadId: lead.id
  });
}

export async function upsertContactFromMessage(contact: ContactSubmissionRecord): Promise<void> {
  const firestore = getFirebaseAdminFirestore();
  const docId = buildContactDocumentId(contact.email, contact.phone);
  const docRef = firestore.collection(CONTACTS_COLLECTION).doc(docId);
  const now = new Date().toISOString();

  await firestore.runTransaction(async (transaction) => {
    const existingSnapshot = await transaction.get(docRef);
    const existing = existingSnapshot.exists ? (existingSnapshot.data() as ContactProfileDocument) : null;
    const existingCriteria = ensureSearchCriteria(existing?.searchCriteria);

    const mergedSummaryParts = [contact.subject.trim(), contact.message.trim()].filter((part) => part.length > 0);

    const mergedDocument: ContactProfileDocument = {
      id: docId,
      fullName: contact.fullName,
      email: normalizeEmail(contact.email),
      phone: normalizePhone(contact.phone),
      source: "website",
      firstSeenAt: existing?.firstSeenAt ?? now,
      lastSeenAt: now,
      lastSourceType: "contact",
      leadCount: existing?.leadCount ?? 0,
      contactMessageCount: (existing?.contactMessageCount ?? 0) + 1,
      searchCriteria: {
        transactionTypes: existingCriteria.transactionTypes,
        municipalities: existingCriteria.municipalities,
        latestSummary: truncateText(mergedSummaryParts.join(" | ")),
        lastUpdatedAt: now
      },
      recentListings: ensureListings(existing?.recentListings),
      updatedAt: now
    };

    transaction.set(
      docRef,
      {
        ...mergedDocument,
        updatedAtServer: FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  });

  console.info("[contacts][persistence] Upsert from contact success", {
    collection: CONTACTS_COLLECTION,
    documentId: docId,
    contactMessageId: contact.id
  });
}
