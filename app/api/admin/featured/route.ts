import { NextResponse } from "next/server";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { getServerConfigValue } from "@/lib/server/secret-manager";
import { getSiteSettings, updateFeaturedListingIds } from "@/lib/settings/site-settings";

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
    const firestore = getFirebaseAdminFirestore();
    const snapshot = await firestore
      .collection(LISTINGS_COLLECTION)
      .where("isVisible", "==", true)
      .orderBy("price", "desc")
      .limit(250)
      .get();

    const listings: AdminListingOption[] = snapshot.docs.map((doc) => {
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
    });

    const settings = await getSiteSettings();

    return NextResponse.json({
      success: true,
      featuredListingIds: settings.featuredListingIds,
      listings
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

    return NextResponse.json({
      success: true,
      featuredListingIds: saved
    });
  } catch (error) {
    console.error("[admin][featured] Failed saving featured listing IDs", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save featured listings." },
      { status: 500 }
    );
  }
}
