import { unstable_cache } from "next/cache";
import { applySchoolRankingOverride, applySchoolRankingOverrides } from "@/data/school-ranking-overrides";
import { schools as seedSchools } from "@/data/schools";
import { COLLECTIONS } from "@/lib/firebase-sync/firestore/collections";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type { School, SchoolRanking } from "@/types/school";

export type SchoolFirestoreDocument = School & {
  importedAt?: string;
  updatedAt?: string;
};

const SCHOOL_DATA_VERSION = "ontario-public-schools-may-2026";
export const SCHOOLS_CACHE_TAG = "schools";

const getCachedSchoolsFromFirestore = unstable_cache(
  async () => getSchoolsFromFirestore(),
  ["firestore-schools"],
  { revalidate: 3600, tags: [SCHOOLS_CACHE_TAG] }
);

export async function getSchoolDirectory(): Promise<School[]> {
  try {
    const schools = await getCachedSchoolsFromFirestore();
    if (schools.length > 0) return applySchoolRankingOverrides(schools);
  } catch (error) {
    console.error("[schools] Failed reading Firestore schools. Using seed fallback.", error);
  }

  return applySchoolRankingOverrides(seedSchools);
}

export async function importSeedSchoolsToFirestore(): Promise<{
  imported: number;
  collection: string;
  sourceVersion: string;
}> {
  const firestore = getFirebaseAdminFirestore();
  const importedAt = new Date().toISOString();
  const chunks = chunkList(seedSchools, 400);
  let imported = 0;

  for (const chunk of chunks) {
    const batch = firestore.batch();

    for (const school of chunk) {
      const reference = firestore.collection(COLLECTIONS.schools).doc(school.id);
      const document = buildSeedSchoolDocument(applySchoolRankingOverride(school), importedAt);

      batch.set(
        reference,
        {
          ...document,
          sourceVersion: SCHOOL_DATA_VERSION
        },
        { merge: true }
      );
      imported += 1;
    }

    await batch.commit();
  }

  return {
    imported,
    collection: COLLECTIONS.schools,
    sourceVersion: SCHOOL_DATA_VERSION
  };
}

function buildSeedSchoolDocument(school: School, importedAt: string): SchoolFirestoreDocument {
  const document: SchoolFirestoreDocument = {
    ...school,
    importedAt,
    updatedAt: importedAt,
    dataSource: school.dataSource || "Ontario public school contact information, May 2026"
  };

  delete document.latitude;
  delete document.longitude;
  delete document.geocodeProvider;
  delete document.geocodedAt;
  delete document.geocodeAttemptedAt;
  delete document.geocodeStatus;
  delete document.geocodeFormattedAddress;
  delete document.geocodePlaceId;
  delete document.geocodeLocationType;
  delete document.geocodePartialMatch;

  return document;
}

async function getSchoolsFromFirestore(): Promise<School[]> {
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore.collection(COLLECTIONS.schools).get();

  return snapshot.docs
    .map((doc) => sanitizeSchoolDocument(doc.data(), doc.id))
    .filter((school): school is School => Boolean(school))
    .sort((a, b) => a.municipality.localeCompare(b.municipality) || a.name.localeCompare(b.name));
}

function sanitizeSchoolDocument(data: FirebaseFirestore.DocumentData, docId: string): School | null {
  if (typeof data.name !== "string" || typeof data.slug !== "string") return null;
  if (typeof data.board !== "string" || typeof data.municipality !== "string") return null;
  if (data.level !== "elementary" && data.level !== "secondary") return null;

  return {
    id: typeof data.id === "string" ? data.id : docId,
    slug: data.slug,
    name: data.name,
    board: data.board,
    municipality: data.municipality,
    sourceCity: typeof data.sourceCity === "string" ? data.sourceCity : undefined,
    level: data.level,
    address: typeof data.address === "string" ? data.address : undefined,
    latitude: typeof data.latitude === "number" ? data.latitude : undefined,
    longitude: typeof data.longitude === "number" ? data.longitude : undefined,
    grades: typeof data.grades === "string" ? data.grades : undefined,
    programs: Array.isArray(data.programs) ? data.programs.filter((item): item is string => typeof item === "string") : [],
    ranking: sanitizeSchoolRanking(data.ranking),
    rankingUpdatedAt: typeof data.rankingUpdatedAt === "string" ? data.rankingUpdatedAt : undefined,
    geocodeProvider: typeof data.geocodeProvider === "string" ? data.geocodeProvider : undefined,
    geocodedAt: typeof data.geocodedAt === "string" ? data.geocodedAt : undefined,
    geocodeAttemptedAt: typeof data.geocodeAttemptedAt === "string" ? data.geocodeAttemptedAt : undefined,
    geocodeStatus: typeof data.geocodeStatus === "string" ? data.geocodeStatus : undefined,
    geocodeFormattedAddress: typeof data.geocodeFormattedAddress === "string" ? data.geocodeFormattedAddress : undefined,
    geocodePlaceId: typeof data.geocodePlaceId === "string" ? data.geocodePlaceId : undefined,
    geocodeLocationType: typeof data.geocodeLocationType === "string" ? data.geocodeLocationType : undefined,
    geocodePartialMatch: typeof data.geocodePartialMatch === "boolean" ? data.geocodePartialMatch : undefined,
    boundaryMapUrl: typeof data.boundaryMapUrl === "string" ? data.boundaryMapUrl : undefined,
    boundaryDirectoryUrl: typeof data.boundaryDirectoryUrl === "string" ? data.boundaryDirectoryUrl : undefined,
    locatorUrl: typeof data.locatorUrl === "string" ? data.locatorUrl : undefined,
    profileUrl: typeof data.profileUrl === "string" ? data.profileUrl : undefined,
    notes: typeof data.notes === "string" ? data.notes : undefined,
    dataSource: typeof data.dataSource === "string" ? data.dataSource : "Firestore schools collection",
    updatedLabel: typeof data.updatedLabel === "string" ? data.updatedLabel : undefined
  };
}

function sanitizeSchoolRanking(value: unknown): SchoolRanking | undefined {
  if (typeof value !== "object" || value == null) return undefined;

  const ranking = value as Record<string, unknown>;
  const source = typeof ranking.source === "string" ? ranking.source.trim() : "";
  const year = typeof ranking.year === "string" ? ranking.year.trim() : "";
  const score = typeof ranking.score === "number" && Number.isFinite(ranking.score) ? ranking.score : undefined;
  const rank = typeof ranking.rank === "string" && ranking.rank.trim() ? ranking.rank.trim() : undefined;
  const url = typeof ranking.url === "string" && ranking.url.trim() ? ranking.url.trim() : undefined;

  if (!source || !year) return undefined;
  if (score === undefined && !rank) return undefined;

  return {
    source,
    year,
    score,
    rank,
    url
  };
}

function chunkList<TItem>(items: TItem[], chunkSize: number): TItem[][] {
  const chunks: TItem[][] = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}
