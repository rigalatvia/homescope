import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type { SavedSearchAlertFrequency, SavedSearchRecord } from "@/lib/savedSearches";
import type { ListingFilters } from "@/types/listing";

interface SavedSearchBody {
  label?: string;
  path?: string;
  queryString?: string;
  filters?: ListingFilters;
  resultsTotal?: number;
  alertsEnabled?: boolean;
  alertFrequency?: SavedSearchAlertFrequency;
}

interface SavedSearchPatchBody {
  id?: string;
  alertsEnabled?: boolean;
  alertFrequency?: SavedSearchAlertFrequency;
}

interface SavedSearchDeleteBody {
  id?: string;
}

const COLLECTION = "savedSearches";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore.collection(COLLECTION).where("userId", "==", user.uid).get();
  const savedSearches = snapshot.docs
    .map((doc) => mapSavedSearch(doc.id, doc.data()))
    .sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt));

  return NextResponse.json({ success: true, savedSearches }, { status: 200 });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = (await request.json()) as SavedSearchBody;
  const validationError = validateCreateBody(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const firestore = getFirebaseAdminFirestore();
  const docRef = firestore.collection(COLLECTION).doc();
  const payload = {
    userId: user.uid,
    userEmail: user.email,
    label: body.label!.trim() || "Saved search",
    path: body.path!,
    queryString: body.queryString || "",
    filters: sanitizeListingFilters(body.filters || {}),
    resultsTotal: typeof body.resultsTotal === "number" ? body.resultsTotal : 0,
    alertsEnabled: body.alertsEnabled !== false,
    alertFrequency: parseAlertFrequency(body.alertFrequency),
    lastAlertCheckedAt: null,
    lastAlertListingIds: [],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  };

  await docRef.set(payload);

  return NextResponse.json(
    {
      success: true,
      savedSearch: {
        ...payload,
        id: docRef.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    },
    { status: 201 }
  );
}

export async function PATCH(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = (await request.json()) as SavedSearchPatchBody;
  if (!body.id) return NextResponse.json({ error: "Saved search id is required." }, { status: 400 });

  const firestore = getFirebaseAdminFirestore();
  const docRef = firestore.collection(COLLECTION).doc(body.id);
  const snapshot = await docRef.get();
  if (!snapshot.exists || snapshot.data()?.userId !== user.uid) {
    return NextResponse.json({ error: "Saved search not found." }, { status: 404 });
  }

  await docRef.set(
    {
      alertsEnabled: body.alertsEnabled === true,
      alertFrequency: parseAlertFrequency(body.alertFrequency),
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  return NextResponse.json({ success: true }, { status: 200 });
}

export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = (await request.json()) as SavedSearchDeleteBody;
  if (!body.id) return NextResponse.json({ error: "Saved search id is required." }, { status: 400 });

  const firestore = getFirebaseAdminFirestore();
  const docRef = firestore.collection(COLLECTION).doc(body.id);
  const snapshot = await docRef.get();
  if (!snapshot.exists || snapshot.data()?.userId !== user.uid) {
    return NextResponse.json({ error: "Saved search not found." }, { status: 404 });
  }

  await docRef.delete();

  return NextResponse.json({ success: true }, { status: 200 });
}

function validateCreateBody(body: SavedSearchBody): string | null {
  if (typeof body.label !== "string") return "Label is required.";
  if (typeof body.path !== "string" || !body.path.startsWith("/")) return "Valid path is required.";
  if (typeof body.queryString !== "string") return "Query string is required.";
  if (typeof body.filters !== "object" || body.filters === null) return "Filters are required.";
  return null;
}

function mapSavedSearch(id: string, data: FirebaseFirestore.DocumentData): SavedSearchRecord {
  return {
    id,
    userId: typeof data.userId === "string" ? data.userId : "",
    userEmail: typeof data.userEmail === "string" ? data.userEmail : null,
    label: typeof data.label === "string" ? data.label : "Saved search",
    path: typeof data.path === "string" ? data.path : "/listings",
    queryString: typeof data.queryString === "string" ? data.queryString : "",
    filters: typeof data.filters === "object" && data.filters !== null ? (data.filters as ListingFilters) : {},
    resultsTotal: typeof data.resultsTotal === "number" ? data.resultsTotal : 0,
    alertsEnabled: data.alertsEnabled !== false,
    alertFrequency: parseAlertFrequency(data.alertFrequency),
    lastAlertCheckedAt: toIsoString(data.lastAlertCheckedAt),
    lastAlertListingIds: Array.isArray(data.lastAlertListingIds) ? data.lastAlertListingIds : [],
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt)
  };
}

function sanitizeListingFilters(filters: ListingFilters): Record<string, string | number> {
  return Object.entries(filters).reduce<Record<string, string | number>>((cleanFilters, [key, value]) => {
    if (typeof value === "string" && value.trim()) cleanFilters[key] = value;
    if (typeof value === "number" && Number.isFinite(value)) cleanFilters[key] = value;
    return cleanFilters;
  }, {});
}

function parseAlertFrequency(value: unknown): SavedSearchAlertFrequency {
  if (value === "instant" || value === "weekly") return value;
  return "daily";
}

function toIsoString(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return null;
}

function toMillis(value: string | null): number {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}
