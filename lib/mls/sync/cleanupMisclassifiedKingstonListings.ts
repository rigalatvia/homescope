import { deleteListingDocument, listListingsByMunicipality } from "@/lib/mls/upsert/repository";
import { logSyncInfo } from "@/lib/mls/utils/logger";

function looksLikeMisclassifiedKingArea(value: string | null | undefined): boolean {
  const normalized = (value || "").trim().toLowerCase();
  return normalized.includes("kingston") || normalized.includes("kingsville");
}

function isMisclassifiedKingstonListing(listing: {
  slug: string;
  area: string | null;
  address: { fullAddress: string | null };
}): boolean {
  return (
    looksLikeMisclassifiedKingArea(listing.slug) ||
    looksLikeMisclassifiedKingArea(listing.area) ||
    looksLikeMisclassifiedKingArea(listing.address.fullAddress)
  );
}

export async function cleanupMisclassifiedKingstonListings(): Promise<number> {
  const kingListings = await listListingsByMunicipality("King");
  const misclassified = kingListings.filter(isMisclassifiedKingstonListing);

  for (const listing of misclassified) {
    await deleteListingDocument(listing.listingId);
  }

  if (misclassified.length > 0) {
    logSyncInfo("Removed misclassified non-King listings from King municipality", {
      removed: misclassified.length,
      listingIds: misclassified.map((listing) => listing.listingId)
    });
  }

  return misclassified.length;
}
