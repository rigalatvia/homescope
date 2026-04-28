import { NextResponse } from "next/server";
import { storeSearchLog } from "@/lib/searches/store";
import type { ListingFilters } from "@/types/listing";

interface SearchLogRequest {
  path: string;
  queryString: string;
  resultsTotal: number;
  filters: ListingFilters;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as SearchLogRequest;

    if (
      !isObject(payload) ||
      typeof payload.path !== "string" ||
      typeof payload.queryString !== "string" ||
      typeof payload.resultsTotal !== "number" ||
      !isObject(payload.filters)
    ) {
      return NextResponse.json({ error: "Invalid search payload." }, { status: 400 });
    }

    const id = await storeSearchLog({
      path: payload.path,
      queryString: payload.queryString,
      resultsTotal: payload.resultsTotal,
      filters: payload.filters,
      userAgent: request.headers.get("user-agent")
    });

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error) {
    console.error("[searches] Failed to store search log", error);
    return NextResponse.json({ error: "Unable to save search right now." }, { status: 500 });
  }
}
