import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type { ContactSubmissionRecord } from "@/types/contact";
import type { LeadSubmissionRecord } from "@/types/lead";

const LEADS_COLLECTION = "leads";
const CONTACTS_COLLECTION = "contacts";
const LISTINGS_COLLECTION = "listings";

export interface AdminContactProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  leadCount?: number;
  contactMessageCount?: number;
  lastSeenAt?: string;
  firstSeenAt?: string;
}

export interface AdminDashboardData {
  totalLeads: number;
  totalContacts: number;
  totalListings: number;
  visibleListings: number;
  latestLeads: LeadSubmissionRecord[];
  contactsAlphabeticalPreview: AdminContactProfile[];
}

export async function getAdminLeads(limitCount = 300): Promise<LeadSubmissionRecord[]> {
  const firestore = getFirebaseAdminFirestore();

  const snapshot = await firestore
    .collection(LEADS_COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(limitCount)
    .get();

  return snapshot.docs.map((doc) => ({ ...(doc.data() as LeadSubmissionRecord), id: doc.id }));
}

export async function getAdminContacts(limitCount = 500): Promise<AdminContactProfile[]> {
  const firestore = getFirebaseAdminFirestore();

  const snapshot = await firestore.collection(CONTACTS_COLLECTION).limit(limitCount).get();

  const contacts = snapshot.docs.map((doc) => ({
    ...(doc.data() as ContactSubmissionRecord),
    id: doc.id
  })) as AdminContactProfile[];

  return contacts.sort((a, b) => (a.fullName || "").localeCompare(b.fullName || "", "en", { sensitivity: "base" }));
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const firestore = getFirebaseAdminFirestore();

  const [
    leadsCountSnapshot,
    contactsCountSnapshot,
    listingsCountSnapshot,
    visibleListingsCountSnapshot,
    latestLeads,
    contacts
  ] = await Promise.all([
    firestore.collection(LEADS_COLLECTION).count().get(),
    firestore.collection(CONTACTS_COLLECTION).count().get(),
    firestore.collection(LISTINGS_COLLECTION).count().get(),
    firestore.collection(LISTINGS_COLLECTION).where("isVisible", "==", true).count().get(),
    getAdminLeads(8),
    getAdminContacts(8)
  ]);

  return {
    totalLeads: leadsCountSnapshot.data().count,
    totalContacts: contactsCountSnapshot.data().count,
    totalListings: listingsCountSnapshot.data().count,
    visibleListings: visibleListingsCountSnapshot.data().count,
    latestLeads,
    contactsAlphabeticalPreview: contacts
  };
}
