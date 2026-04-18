import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { allowedMunicipalities } from "@/lib/mls/config";
import type { MLSListingFirestoreDocument } from "@/lib/mls/types";
import type { Query } from "firebase-admin/firestore";

const LISTINGS_COLLECTION = "listings";

export interface PublicListingsPageQuery {
  municipality?: string;
  transactionType?: "sale" | "lease";
  mlsNumber?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "price_asc" | "price_desc" | "newest";
  page?: number;
  pageSize?: number;
}

export interface PublicListingsPageResult {
  items: MLSListingFirestoreDocument[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function sanitizePublicListing(doc: MLSListingFirestoreDocument): MLSListingFirestoreDocument {
  return {
    ...doc,
    rawSourceHash: "",
    sourceListingKey: ""
  };
}

export async function getPublicListings(limit = 24): Promise<MLSListingFirestoreDocument[]> {
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore
    .collection(LISTINGS_COLLECTION)
    .where("isVisible", "==", true)
    .where("municipality", "in", allowedMunicipalities)
    .orderBy("price", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => sanitizePublicListing(doc.data() as MLSListingFirestoreDocument));
}

export async function getPublicListingBySlug(slug: string): Promise<MLSListingFirestoreDocument | null> {
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore
    .collection(LISTINGS_COLLECTION)
    .where("slug", "==", slug)
    .where("isVisible", "==", true)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const listing = snapshot.docs[0]!.data() as MLSListingFirestoreDocument;
  if (!listing.municipality || !allowedMunicipalities.includes(listing.municipality)) return null;
  return sanitizePublicListing(listing);
}

export async function getFeaturedListings(limit = 6): Promise<MLSListingFirestoreDocument[]> {
  const listings = await getPublicListings(limit * 3);
  return listings
    .filter((listing) => listing.badges.includes("Premium") || listing.images.length > 0)
    .slice(0, limit);
}

export async function getListingsByAgentKey(agentKey: string, limit = 24): Promise<MLSListingFirestoreDocument[]> {
  const normalizedAgentKey = agentKey.trim();
  if (!normalizedAgentKey) return [];

  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore
    .collection(LISTINGS_COLLECTION)
    .where("listAgentKey", "==", normalizedAgentKey)
    .get();

  return snapshot.docs
    .map((doc) => sanitizePublicListing(doc.data() as MLSListingFirestoreDocument))
    .filter((listing) => listing.isVisible === true)
    .filter((listing) => !!listing.municipality && allowedMunicipalities.includes(listing.municipality))
    .sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    .slice(0, limit);
}

export async function getListingsByMunicipality(
  municipality: string,
  limit = 24
): Promise<MLSListingFirestoreDocument[]> {
  if (!allowedMunicipalities.includes(municipality as (typeof allowedMunicipalities)[number])) return [];
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore
    .collection(LISTINGS_COLLECTION)
    .where("isVisible", "==", true)
    .where("municipality", "==", municipality)
    .orderBy("price", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => sanitizePublicListing(doc.data() as MLSListingFirestoreDocument));
}

export async function getFilteredListings(filters: {
  municipality?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
}): Promise<MLSListingFirestoreDocument[]> {
  let listings = await getAllPublicListings();

  if (filters.municipality) listings = listings.filter((item) => item.municipality === filters.municipality);
  if (filters.minPrice != null) listings = listings.filter((item) => (item.price ?? 0) >= filters.minPrice!);
  if (filters.maxPrice != null) listings = listings.filter((item) => (item.price ?? Number.MAX_SAFE_INTEGER) <= filters.maxPrice!);
  if (filters.bedrooms != null) listings = listings.filter((item) => (item.bedrooms ?? 0) >= filters.bedrooms!);
  if (filters.bathrooms != null) listings = listings.filter((item) => (item.bathrooms ?? 0) >= filters.bathrooms!);

  return listings;
}

export async function getFilteredListingsPage(
  filters: PublicListingsPageQuery
): Promise<PublicListingsPageResult> {
  const firestore = getFirebaseAdminFirestore();
  const pageSize = Math.max(1, filters.pageSize ?? 24);
  const page = Math.max(1, filters.page ?? 1);
  const sort = filters.sort ?? "price_asc";

  let query: Query = firestore.collection(LISTINGS_COLLECTION).where("isVisible", "==", true);

  if (filters.municipality) {
    if (!allowedMunicipalities.includes(filters.municipality as (typeof allowedMunicipalities)[number])) {
      return { items: [], total: 0, page: 1, pageSize, totalPages: 1 };
    }
    query = query.where("municipality", "==", filters.municipality);
  } else {
    query = query.where("municipality", "in", allowedMunicipalities);
  }

  if (filters.transactionType) {
    query = query.where("transactionType", "==", filters.transactionType);
  }

  if (filters.mlsNumber) {
    query = query.where("mlsNumber", "==", filters.mlsNumber);
  }

  if (filters.minPrice != null) {
    query = query.where("price", ">=", filters.minPrice);
  }

  if (filters.maxPrice != null) {
    query = query.where("price", "<=", filters.maxPrice);
  }

  if (sort === "newest") {
    query = query.orderBy("updatedAt", "desc");
  } else {
    query = query.orderBy("price", sort === "price_desc" ? "desc" : "asc");
  }

  const countSnapshot = await query.count().get();
  const total = countSnapshot.data().count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * pageSize;

  const snapshot = await query.offset(offset).limit(pageSize).get();
  const items = snapshot.docs.map((doc) => sanitizePublicListing(doc.data() as MLSListingFirestoreDocument));

  return {
    items,
    total,
    page: safePage,
    pageSize,
    totalPages
  };
}

async function getAllPublicListings(batchSize = 500): Promise<MLSListingFirestoreDocument[]> {
  const firestore = getFirebaseAdminFirestore();
  const results: MLSListingFirestoreDocument[] = [];
  let query: Query = firestore
    .collection(LISTINGS_COLLECTION)
    .where("isVisible", "==", true)
    .where("municipality", "in", allowedMunicipalities)
    .orderBy("price", "desc")
    .limit(batchSize);

  while (true) {
    const snapshot = await query.get();
    if (snapshot.empty) break;

    results.push(...snapshot.docs.map((doc) => sanitizePublicListing(doc.data() as MLSListingFirestoreDocument)));

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    if (!lastDoc || snapshot.docs.length < batchSize) break;
    query = query.startAfter(lastDoc);
  }

  return results;
}
