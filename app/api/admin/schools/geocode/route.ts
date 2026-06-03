import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { COLLECTIONS } from "@/lib/firebase-sync/firestore/collections";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { getServerConfigValue } from "@/lib/server/secret-manager";
import { SCHOOLS_CACHE_TAG } from "@/lib/schools/firestore-data";

export const maxDuration = 300;

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 50;
const GEOCODE_PROVIDER = "google";
const GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

interface GoogleGeocodeResponse {
  status: string;
  error_message?: string;
  results?: Array<{
    formatted_address?: string;
    place_id?: string;
    partial_match?: boolean;
    geometry?: {
      location?: {
        lat?: number;
        lng?: number;
      };
      location_type?: string;
    };
  }>;
}

interface SchoolGeocodeCandidate {
  docId: string;
  id: string;
  name: string;
  board: string;
  municipality: string;
  sourceCity?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  geocodeProvider?: string;
  geocodeStatus?: string;
}

interface GeocodeSuccess {
  ok: true;
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  placeId?: string;
  locationType?: string;
  partialMatch?: boolean;
  status: string;
}

interface GeocodeFailure {
  ok: false;
  status: string;
  error?: string;
  shouldStop?: boolean;
}

type GeocodeResult = GeocodeSuccess | GeocodeFailure;

async function authorize(request: Request): Promise<NextResponse | null> {
  const adminToken = await getServerConfigValue("MLS_SYNC_ADMIN_TOKEN");
  const requestToken = request.headers.get("x-admin-sync-token");

  if (!adminToken) {
    return NextResponse.json({ error: "Admin sync token is not configured." }, { status: 503 });
  }

  if (requestToken !== adminToken) {
    return NextResponse.json({ error: "Unauthorized admin request." }, { status: 401 });
  }

  return null;
}

export async function POST(request: Request) {
  const authError = await authorize(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const limit = parseLimit(url.searchParams.get("limit"));
  const dryRun = parseBoolean(url.searchParams.get("dryRun"));
  const force = parseBoolean(url.searchParams.get("force"));
  const schoolId = normalizeOptional(url.searchParams.get("schoolId"));

  const apiKey = await getServerConfigValue("GOOGLE_MAPS_GEOCODING_API_KEY");
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "GOOGLE_MAPS_GEOCODING_API_KEY is not configured.",
        detail: "Add the server-only Google Maps Geocoding API key before running school geocoding."
      },
      { status: 503 }
    );
  }

  try {
    const firestore = getFirebaseAdminFirestore();
    const snapshot = await firestore.collection(COLLECTIONS.schools).get();
    const eligibleCandidates = snapshot.docs
      .map((doc) => toCandidate(doc.id, doc.data()))
      .filter((candidate): candidate is SchoolGeocodeCandidate => Boolean(candidate))
      .filter((candidate) => {
        if (schoolId && candidate.id !== schoolId && candidate.docId !== schoolId) return false;
        if (!candidate.address) return false;
        if (!force && hasConfirmedGeocode(candidate)) return false;
        return true;
      })
      .sort((a, b) => a.municipality.localeCompare(b.municipality) || a.name.localeCompare(b.name));
    const candidates = eligibleCandidates.slice(0, limit);

    const geocodedAt = new Date().toISOString();
    const results = [];
    let updated = 0;
    let failed = 0;
    let stopped = false;

    for (const candidate of candidates) {
      const query = buildAddressQuery(candidate);
      const geocode = await geocodeAddress(query, apiKey);

      if (geocode.ok) {
        const update = {
          latitude: geocode.latitude,
          longitude: geocode.longitude,
          geocodeProvider: GEOCODE_PROVIDER,
          geocodeStatus: geocode.status,
          geocodedAt,
          geocodeAttemptedAt: geocodedAt,
          geocodeFormattedAddress: geocode.formattedAddress || null,
          geocodePlaceId: geocode.placeId || null,
          geocodeLocationType: geocode.locationType || null,
          geocodePartialMatch: geocode.partialMatch ?? false,
          updatedAt: geocodedAt
        };

        if (!dryRun) {
          await firestore.collection(COLLECTIONS.schools).doc(candidate.docId).set(update, { merge: true });
          updated += 1;
        }

        results.push({
          schoolId: candidate.id,
          name: candidate.name,
          municipality: candidate.municipality,
          address: candidate.address,
          query,
          dryRun,
          ...update
        });
      } else {
        failed += 1;
        const failureUpdate = {
          geocodeProvider: GEOCODE_PROVIDER,
          geocodeStatus: geocode.status,
          geocodeError: geocode.error || null,
          geocodeAttemptedAt: geocodedAt,
          updatedAt: geocodedAt
        };

        if (!dryRun && !geocode.shouldStop) {
          await firestore.collection(COLLECTIONS.schools).doc(candidate.docId).set(failureUpdate, { merge: true });
        }

        results.push({
          schoolId: candidate.id,
          name: candidate.name,
          municipality: candidate.municipality,
          address: candidate.address,
          query,
          dryRun,
          ...failureUpdate
        });

        if (geocode.shouldStop) {
          stopped = true;
          break;
        }
      }
    }

    if (!dryRun && updated > 0) {
      revalidateTag(SCHOOLS_CACHE_TAG);
    }

    return NextResponse.json({
      success: true,
      provider: GEOCODE_PROVIDER,
      dryRun,
      force,
      requestedLimit: limit,
      candidates: candidates.length,
      updated,
      failed,
      stopped,
      remainingEstimate: Math.max(0, eligibleCandidates.length - candidates.length),
      results
    });
  } catch (error) {
    console.error("[admin][schools] Failed geocoding schools", error);
    return NextResponse.json(
      {
        error: "Could not geocode schools.",
        detail: error instanceof Error ? error.message : "Unknown geocoding error"
      },
      { status: 500 }
    );
  }
}

function toCandidate(docId: string, data: FirebaseFirestore.DocumentData): SchoolGeocodeCandidate | null {
  if (typeof data.name !== "string" || typeof data.municipality !== "string") return null;

  return {
    docId,
    id: typeof data.id === "string" ? data.id : docId,
    name: data.name,
    board: typeof data.board === "string" ? data.board : "",
    municipality: data.municipality,
    sourceCity: typeof data.sourceCity === "string" ? data.sourceCity : undefined,
    address: typeof data.address === "string" ? data.address : undefined,
    latitude: typeof data.latitude === "number" ? data.latitude : undefined,
    longitude: typeof data.longitude === "number" ? data.longitude : undefined,
    geocodeProvider: typeof data.geocodeProvider === "string" ? data.geocodeProvider : undefined,
    geocodeStatus: typeof data.geocodeStatus === "string" ? data.geocodeStatus : undefined
  };
}

function hasConfirmedGeocode(candidate: SchoolGeocodeCandidate): boolean {
  return (
    candidate.latitude != null &&
    candidate.longitude != null &&
    candidate.geocodeProvider === GEOCODE_PROVIDER &&
    candidate.geocodeStatus === "OK"
  );
}

function buildAddressQuery(candidate: SchoolGeocodeCandidate): string {
  if (candidate.address) return candidate.address;
  return [candidate.name, candidate.sourceCity || candidate.municipality, "Ontario", "Canada"].filter(Boolean).join(", ");
}

async function geocodeAddress(address: string, apiKey: string): Promise<GeocodeResult> {
  const url = new URL(GOOGLE_GEOCODE_URL);
  url.searchParams.set("address", address);
  url.searchParams.set("components", "country:CA");
  url.searchParams.set("region", "ca");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store"
  });

  if (!response.ok) {
    return {
      ok: false,
      status: `HTTP_${response.status}`,
      error: `Google Geocoding request failed with HTTP ${response.status}.`,
      shouldStop: response.status === 401 || response.status === 403 || response.status === 429
    };
  }

  const payload = (await response.json()) as GoogleGeocodeResponse;

  if (payload.status !== "OK") {
    return {
      ok: false,
      status: payload.status,
      error: payload.error_message,
      shouldStop: payload.status === "OVER_QUERY_LIMIT" || payload.status === "REQUEST_DENIED"
    };
  }

  const firstResult = payload.results?.[0];
  const latitude = firstResult?.geometry?.location?.lat;
  const longitude = firstResult?.geometry?.location?.lng;

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return {
      ok: false,
      status: "NO_LOCATION",
      error: "Google returned OK but no latitude/longitude."
    };
  }

  return {
    ok: true,
    latitude,
    longitude,
    formattedAddress: firstResult?.formatted_address,
    placeId: firstResult?.place_id,
    locationType: firstResult?.geometry?.location_type,
    partialMatch: firstResult?.partial_match,
    status: payload.status
  };
}

function parseLimit(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.floor(parsed), MAX_LIMIT);
}

function parseBoolean(value: string | null): boolean {
  return value === "true" || value === "1";
}

function normalizeOptional(value: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}
