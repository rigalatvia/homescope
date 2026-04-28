import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type { ListingFilters } from "@/types/listing";

const SEARCHES_COLLECTION = "searches";

export interface SearchLogInput {
  path: string;
  queryString: string;
  resultsTotal: number;
  filters: ListingFilters;
  userAgent?: string | null;
}

export async function storeSearchLog(input: SearchLogInput): Promise<string> {
  const firestore = getFirebaseAdminFirestore();
  const docRef = firestore.collection(SEARCHES_COLLECTION).doc();
  const createdAt = new Date().toISOString();

  await docRef.set({
    id: docRef.id,
    createdAt,
    createdAtServer: FieldValue.serverTimestamp(),
    path: input.path,
    queryString: input.queryString,
    resultsTotal: input.resultsTotal,
    userAgent: input.userAgent || null,
    filters: input.filters
  });

  return docRef.id;
}
