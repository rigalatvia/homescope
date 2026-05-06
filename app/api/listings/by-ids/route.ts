import { NextResponse } from "next/server";
import { getPublicListingsByIds } from "@/lib/listings/service";

interface ListingIdsRequestBody {
  listingIds?: unknown;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ListingIdsRequestBody;
    const listingIds = Array.isArray(payload.listingIds)
      ? payload.listingIds.filter((listingId): listingId is string => typeof listingId === "string")
      : [];

    const listings = await getPublicListingsByIds(listingIds.slice(0, 24));

    return NextResponse.json({ success: true, listings });
  } catch (error) {
    console.error("[listings][by-ids] Failed to fetch listings", error);
    return NextResponse.json(
      { success: false, error: "We could not load those listings right now." },
      { status: 500 }
    );
  }
}
