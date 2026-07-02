import { NextResponse } from "next/server";
import type { DocumentData } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { getServerConfigValue } from "@/lib/server/secret-manager";
import { DEFAULT_FEATURED_AGENT_KEYS, getSiteSettings, updateFeaturedListingIds } from "@/lib/settings/site-settings";

const LISTINGS_COLLECTION = "listings";

interface FeaturedUpdateBody {
  featuredListingIds?: string[];
  featuredMlsNumbers?: string[];
}

interface AdminListingOption {
  id: string;
  mlsNumber: string;
  address: string;
  city: string;
  price: number;
  slug: string;
}

function mapAdminListingOption(doc: { id: string; data: () => DocumentData }): AdminListingOption {
  const data = doc.data() as {
    listingId?: string;
    mlsNumber?: string | null;
    municipality?: string | null;
    slug?: string | null;
    price?: number | null;
    address?: { fullAddress?: string | null; streetNumber?: string | null; streetName?: string | null; unit?: string | null };
  };
  const fallbackAddress =
    [data.address?.streetNumber, data.address?.streetName, data.address?.unit].filter(Boolean).join(" ").trim() || "Address unavailable";
  return {
    id: data.listingId || doc.id,
    mlsNumber: data.mlsNumber || "N/A",
    address: data.address?.fullAddress || fallbackAddress,
    city: data.municipality || "Unknown",
    price: Number(data.price || 0),
    slug: data.slug || ""
  };
}

function chunkList<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function mergeListingOptions(options: AdminListingOption[]): AdminListingOption[] {
  const seen = new Set<string>();
  const merged: AdminListingOption[] = [];

  for (const option of options) {
    if (seen.has(option.id)) continue;
    seen.add(option.id);
    merged.push(option);
  }

  return merged;
}

async function getListingOptionsByIds(listingIds: string[]): Promise<AdminListingOption[]> {
  const normalizedIds = Array.from(new Set(listingIds.filter((item): item is string => typeof item === "string").filter(Boolean)));
  if (normalizedIds.length === 0) return [];

  try {
    const firestore = getFirebaseAdminFirestore();
    const snapshots = await Promise.all(
      chunkList(normalizedIds, 10).map((chunk) =>
        firestore.collection(LISTINGS_COLLECTION).where("listingId", "in", chunk).get()
      )
    );

    return snapshots.flatMap((snapshot) => snapshot.docs.map(mapAdminListingOption));
  } catch (error) {
    console.error("[admin][featured] Failed resolving selected listing IDs", error);
    return [];
  }
}

async function getListingOptionsByAgentKeys(agentKeys: readonly string[]): Promise<AdminListingOption[]> {
  const normalizedAgentKeys = Array.from(new Set(agentKeys.map((item) => item.trim()).filter(Boolean)));
  if (normalizedAgentKeys.length === 0) return [];

  try {
    const firestore = getFirebaseAdminFirestore();
    const snapshots = await Promise.all(
      normalizedAgentKeys.flatMap((agentKey) => [
        firestore.collection(LISTINGS_COLLECTION).where("listAgentKey", "==", agentKey).get(),
        firestore.collection(LISTINGS_COLLECTION).where("listAgentNationalAssociationId", "==", agentKey).get()
      ])
    );

    return mergeListingOptions(
      snapshots
        .flatMap((snapshot) => snapshot.docs)
        .filter((doc) => (doc.data() as { isVisible?: boolean }).isVisible === true)
        .map(mapAdminListingOption)
    ).sort((left, right) => right.price - left.price);
  } catch (error) {
    console.error("[admin][featured] Failed loading Yan listing options", error);
    return [];
  }
}

async function getTopListingOptions(): Promise<AdminListingOption[]> {
  try {
    const firestore = getFirebaseAdminFirestore();
    const snapshot = await firestore
      .collection(LISTINGS_COLLECTION)
      .where("isVisible", "==", true)
      .orderBy("price", "desc")
      .limit(250)
      .get();

    return snapshot.docs.map(mapAdminListingOption);
  } catch (error) {
    console.error("[admin][featured] Failed loading top listing options", error);
    return [];
  }
}

function getFeaturedIdsWithYanDefault(featuredListingIds: string[], yanListings: AdminListingOption[]): string[] {
  const yanListingIds = yanListings.map((listing) => listing.id);
  if (yanListingIds.length === 0) return featuredListingIds;

  const hasYanListing = featuredListingIds.some((id) => yanListingIds.includes(id));
  return hasYanListing ? featuredListingIds : mergeIds([...yanListingIds, ...featuredListingIds]);
}

function mergeIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    merged.push(id);
  }

  return merged;
}

async function authorize(request: Request): Promise<NextResponse | null> {
  const adminToken = await getServerConfigValue("MLS_SYNC_ADMIN_TOKEN");
  const requestToken = request.headers.get("x-admin-sync-token");

  if (!adminToken) {
    return NextResponse.json({ error: "MLS sync admin token is not configured." }, { status: 503 });
  }

  if (requestToken !== adminToken) {
    return NextResponse.json({ error: "Unauthorized admin request." }, { status: 401 });
  }

  return null;
}

function normalizeMlsNumber(value: string): string {
  return value.trim().toUpperCase();
}

async function resolveFeaturedMlsNumbers(mlsNumbers: string[]): Promise<string[]> {
  const normalizedMlsNumbers = Array.from(
    new Set(
      mlsNumbers
        .filter((item): item is string => typeof item === "string")
        .map(normalizeMlsNumber)
        .filter(Boolean)
    )
  ).slice(0, 24);

  if (normalizedMlsNumbers.length === 0) return [];

  const firestore = getFirebaseAdminFirestore();
  const resolvedListingIds: string[] = [];
  const missingMlsNumbers: string[] = [];

  for (const mlsNumber of normalizedMlsNumbers) {
    const snapshot = await firestore
      .collection(LISTINGS_COLLECTION)
      .where("mlsNumber", "==", mlsNumber)
      .limit(1)
      .get();

    if (snapshot.empty) {
      missingMlsNumbers.push(mlsNumber);
      continue;
    }

    const doc = snapshot.docs[0]!;
    const data = doc.data() as { listingId?: string };
    resolvedListingIds.push(data.listingId || doc.id);
  }

  if (missingMlsNumbers.length > 0) {
    throw new Error(`MLS number${missingMlsNumbers.length === 1 ? "" : "s"} not found: ${missingMlsNumbers.join(", ")}`);
  }

  return resolvedListingIds;
}

export async function GET(request: Request) {
  const authError = await authorize(request);
  if (authError) return authError;

  try {
    const settings = await getSiteSettings();
    const [listings, selectedListings, yanListings] = await Promise.all([
      getTopListingOptions(),
      getListingOptionsByIds(settings.featuredListingIds),
      getListingOptionsByAgentKeys(DEFAULT_FEATURED_AGENT_KEYS)
    ]);
    const featuredListingIds = getFeaturedIdsWithYanDefault(settings.featuredListingIds, yanListings);

    return NextResponse.json({
      success: true,
      featuredListingIds,
      listings: mergeListingOptions([...selectedListings, ...yanListings, ...listings]),
      yanListings
    });
  } catch (error) {
    console.error("[admin][featured] Failed loading featured manager data", error);
    return NextResponse.json({ error: "Could not load featured listings data." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authError = await authorize(request);
  if (authError) return authError;

  try {
    const body = (await request.json()) as FeaturedUpdateBody;
    const featuredListingIds = Array.isArray(body.featuredMlsNumbers)
      ? await resolveFeaturedMlsNumbers(body.featuredMlsNumbers)
      : Array.isArray(body.featuredListingIds)
        ? body.featuredListingIds
        : [];
    const saved = await updateFeaturedListingIds(featuredListingIds);
    const selectedListings = await getListingOptionsByIds(saved);

    return NextResponse.json({
      success: true,
      featuredListingIds: saved,
      listings: selectedListings
    });
  } catch (error) {
    console.error("[admin][featured] Failed saving featured listing IDs", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save featured listings." },
      { status: 500 }
    );
  }
}
