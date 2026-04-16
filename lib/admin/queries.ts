import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type { ContactSubmissionRecord } from "@/types/contact";
import type { LeadSubmissionRecord } from "@/types/lead";

const LEADS_COLLECTION = "leads";
const CONTACTS_COLLECTION = "contacts";
const LISTINGS_COLLECTION = "listings";
const SETTINGS_COLLECTION = "settings";
const SCHEDULER_STATUS_DOC_ID = "mlsSchedulerStatus";

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

export interface AdminSchedulerStatus {
  lastRunAt: string | null;
  lastRunMode: string | null;
  lastRunStatus: "success" | "failed" | null;
  updatedCount: number;
  createdCount: number;
  fetchedCount: number;
  filteredCount: number;
  lastError: string | null;
}

export interface AdminDashboardData {
  totalLeads: number;
  totalContacts: number;
  totalListings: number;
  visibleListings: number;
  latestLeads: LeadSubmissionRecord[];
  contactsAlphabeticalPreview: AdminContactProfile[];
  scheduler: AdminSchedulerStatus;
}

export async function getAdminLeads(limitCount = 300): Promise<LeadSubmissionRecord[]> {
  const firestore = getFirebaseAdminFirestore();

  const snapshot = await firestore.collection(LEADS_COLLECTION).orderBy("createdAt", "desc").limit(limitCount).get();

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

  const [leadsCountSnapshot, contactsCountSnapshot, listingsCountSnapshot, visibleListingsCountSnapshot, latestLeads, contacts, schedulerStatusSnapshot] =
    await Promise.all([
      firestore.collection(LEADS_COLLECTION).count().get(),
      firestore.collection(CONTACTS_COLLECTION).count().get(),
      firestore.collection(LISTINGS_COLLECTION).count().get(),
      firestore.collection(LISTINGS_COLLECTION).where("isVisible", "==", true).count().get(),
      getAdminLeads(8),
      getAdminContacts(8),
      firestore.collection(SETTINGS_COLLECTION).doc(SCHEDULER_STATUS_DOC_ID).get()
    ]);

  const schedulerData = (schedulerStatusSnapshot.data() || {}) as {
    lastRunAt?: string;
    lastRunMode?: string;
    lastRunStatus?: string;
    lastRunCounts?: {
      updated?: number;
      created?: number;
      fetched?: number;
      filtered?: number;
    };
    lastError?: string | null;
  };

  return {
    totalLeads: leadsCountSnapshot.data().count,
    totalContacts: contactsCountSnapshot.data().count,
    totalListings: listingsCountSnapshot.data().count,
    visibleListings: visibleListingsCountSnapshot.data().count,
    latestLeads,
    contactsAlphabeticalPreview: contacts,
    scheduler: {
      lastRunAt: schedulerData.lastRunAt ?? null,
      lastRunMode: schedulerData.lastRunMode ?? null,
      lastRunStatus:
        schedulerData.lastRunStatus === "success" || schedulerData.lastRunStatus === "failed"
          ? schedulerData.lastRunStatus
          : null,
      updatedCount: Number(schedulerData.lastRunCounts?.updated ?? 0),
      createdCount: Number(schedulerData.lastRunCounts?.created ?? 0),
      fetchedCount: Number(schedulerData.lastRunCounts?.fetched ?? 0),
      filteredCount: Number(schedulerData.lastRunCounts?.filtered ?? 0),
      lastError: schedulerData.lastError ?? null
    }
  };
}
