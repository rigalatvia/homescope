import { NextResponse } from "next/server";
import { parseListingFilters } from "@/lib/listings/filters";
import { getPublicListings } from "@/lib/listings/service";

export const revalidate = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const filters = parseListingFilters({
    city: searchParams.get("city") ?? undefined,
    transactionType: searchParams.get("transactionType") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    addressContains: searchParams.get("addressContains") ?? undefined,
    mlsNumber: searchParams.get("mlsNumber") ?? undefined,
    minPrice: searchParams.get("minPrice") ?? undefined,
    maxPrice: searchParams.get("maxPrice") ?? undefined,
    bedrooms: searchParams.get("bedrooms") ?? undefined,
    bathrooms: searchParams.get("bathrooms") ?? undefined,
    propertyType: searchParams.get("propertyType") ?? undefined,
    minLatitude: searchParams.get("minLatitude") ?? undefined,
    maxLatitude: searchParams.get("maxLatitude") ?? undefined,
    minLongitude: searchParams.get("minLongitude") ?? undefined,
    maxLongitude: searchParams.get("maxLongitude") ?? undefined
  });

  const results = await getPublicListings(filters, { includeAllItems: true });

  return NextResponse.json({
    listings: results.allItems ?? results.items
  });
}
