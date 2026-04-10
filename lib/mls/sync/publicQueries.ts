import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { allowedMunicipalities } from "@/lib/mls/config";
import type { MLSListingFirestoreDocument } from "@/lib/mls/types";

const LISTINGS_COLLECTION = "listings";

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
  limit?: number;
}): Promise<MLSListingFirestoreDocument[]> {
  let listings = await getPublicListings(filters.limit ?? 50);

  if (filters.municipality) listings = listings.filter((item) => item.municipality === filters.municipality);
  if (filters.minPrice != null) listings = listings.filter((item) => (item.price ?? 0) >= filters.minPrice!);
  if (filters.maxPrice != null) listings = listings.filter((item) => (item.price ?? Number.MAX_SAFE_INTEGER) <= filters.maxPrice!);
  if (filters.bedrooms != null) listings = listings.filter((item) => (item.bedrooms ?? 0) >= filters.bedrooms!);
  if (filters.bathrooms != null) listings = listings.filter((item) => (item.bathrooms ?? 0) >= filters.bathrooms!);

  return listings;
}
