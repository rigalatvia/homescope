import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { COLLECTIONS } from "@/lib/firebase-sync/firestore/collections";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { SCHOOLS_CACHE_TAG } from "@/lib/schools/firestore-data";
import type { School, SchoolLevel, SchoolRanking } from "@/types/school";

export const maxDuration = 300;

type RankingColumn =
  | "schoolId"
  | "slug"
  | "schoolName"
  | "municipality"
  | "level"
  | "board"
  | "source"
  | "year"
  | "score"
  | "rank"
  | "url";

type HeaderMap = Partial<Record<RankingColumn, number>>;

interface RankingImportRequest {
  csv?: unknown;
  dryRun?: unknown;
  defaultSource?: unknown;
  defaultYear?: unknown;
}

interface RankingImportResult {
  rowNumber: number;
  status: "matched" | "unmatched" | "ambiguous" | "invalid";
  inputName?: string;
  inputMunicipality?: string;
  schoolId?: string;
  schoolSlug?: string;
  schoolName?: string;
  municipality?: string;
  level?: SchoolLevel;
  ranking?: SchoolRanking;
  reason?: string;
  candidates?: Array<{
    id: string;
    slug: string;
    name: string;
    municipality: string;
    level: SchoolLevel;
    board: string;
  }>;
}

const COLUMN_ALIASES: Record<RankingColumn, string[]> = {
  schoolId: ["schoolid", "id", "school id"],
  slug: ["slug", "schoolslug", "school slug"],
  schoolName: ["schoolname", "school", "name", "school name"],
  municipality: ["municipality", "city", "town"],
  level: ["level", "schoollevel", "school level", "type"],
  board: ["board", "schoolboard", "school board"],
  source: ["source", "rankingsource", "ranking source"],
  year: ["year", "rankingyear", "ranking year"],
  score: ["score", "rating", "rankingscore", "ranking score", "scoreoutof10", "score out of 10"],
  rank: ["rank", "ranking", "rank position"],
  url: ["url", "link", "sourceurl", "source url", "rankingurl", "ranking url"]
};

export async function POST(request: Request) {
  const authError = await authorizeAdminRequest();
  if (authError) return authError;

  let payload: RankingImportRequest;

  try {
    payload = (await request.json()) as RankingImportRequest;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const csv = typeof payload.csv === "string" ? payload.csv.trim() : "";
  const dryRun = payload.dryRun !== false;
  const defaultSource = typeof payload.defaultSource === "string" ? payload.defaultSource.trim() : "";
  const defaultYear = typeof payload.defaultYear === "string" ? payload.defaultYear.trim() : "";

  if (!csv) {
    return NextResponse.json({ error: "CSV content is required." }, { status: 400 });
  }

  try {
    const rows = parseCsv(csv);
    if (rows.length < 2) {
      return NextResponse.json({ error: "CSV must include a header row and at least one ranking row." }, { status: 400 });
    }

    const [headers, ...dataRows] = rows;
    const headerMap = mapHeaders(headers);
    const firestore = getFirebaseAdminFirestore();
    const schools = await getSchools(firestore);
    const results = buildImportResults(dataRows, headerMap, schools, { defaultSource, defaultYear });
    const counts = countResults(results);
    let updated = 0;

    if (!dryRun && counts.matched > 0) {
      updated = await commitRankings(firestore, results);
      revalidateTag(SCHOOLS_CACHE_TAG);
    }

    return NextResponse.json({
      success: true,
      dryRun,
      parsedRows: dataRows.length,
      matched: counts.matched,
      unmatched: counts.unmatched,
      ambiguous: counts.ambiguous,
      invalid: counts.invalid,
      updated,
      results
    });
  } catch (error) {
    console.error("[admin][schools][rankings] Import failed", error);
    return NextResponse.json(
      {
        error: "Could not import school rankings.",
        detail: error instanceof Error ? error.message : "Unknown ranking import error"
      },
      { status: 500 }
    );
  }
}

async function getSchools(firestore: FirebaseFirestore.Firestore): Promise<School[]> {
  const snapshot = await firestore.collection(COLLECTIONS.schools).get();

  return snapshot.docs
    .map((doc): School | null => {
      const data = doc.data();
      if (typeof data.name !== "string" || typeof data.slug !== "string") return null;
      if (typeof data.board !== "string" || typeof data.municipality !== "string") return null;
      if (data.level !== "elementary" && data.level !== "secondary") return null;

      return {
        id: typeof data.id === "string" ? data.id : doc.id,
        slug: data.slug,
        name: data.name,
        board: data.board,
        municipality: data.municipality,
        level: data.level,
        programs: [],
        dataSource: typeof data.dataSource === "string" ? data.dataSource : "Firestore schools collection"
      } satisfies School;
    })
    .filter((school): school is School => Boolean(school));
}

function buildImportResults(
  rows: string[][],
  headerMap: HeaderMap,
  schools: School[],
  defaults: { defaultSource: string; defaultYear: string }
): RankingImportResult[] {
  const byId = new Map(schools.map((school) => [school.id, school]));
  const bySlug = new Map(schools.map((school) => [school.slug, school]));

  return rows.map((row, index) => {
    const rowNumber = index + 2;
    const inputName = getCell(row, headerMap, "schoolName");
    const inputMunicipality = getCell(row, headerMap, "municipality");
    const rankingResult = buildRanking(row, headerMap, defaults);

    if (rankingResult.errors.length > 0) {
      return {
        rowNumber,
        status: "invalid",
        inputName,
        inputMunicipality,
        reason: rankingResult.errors.join(" ")
      };
    }

    const directSchool = findDirectSchool(row, headerMap, byId, bySlug);
    const candidates = directSchool ? [directSchool] : findSchoolCandidates(row, headerMap, schools);

    if (candidates.length === 0) {
      return {
        rowNumber,
        status: "unmatched",
        inputName,
        inputMunicipality,
        ranking: rankingResult.ranking,
        reason: "No school matched this row."
      };
    }

    if (candidates.length > 1) {
      return {
        rowNumber,
        status: "ambiguous",
        inputName,
        inputMunicipality,
        ranking: rankingResult.ranking,
        reason: "More than one school matched this row.",
        candidates: candidates.slice(0, 5).map(toCandidateSummary)
      };
    }

    const school = candidates[0];
    return {
      rowNumber,
      status: "matched",
      inputName,
      inputMunicipality,
      schoolId: school.id,
      schoolSlug: school.slug,
      schoolName: school.name,
      municipality: school.municipality,
      level: school.level,
      ranking: rankingResult.ranking
    };
  });
}

function findDirectSchool(
  row: string[],
  headerMap: HeaderMap,
  byId: Map<string, School>,
  bySlug: Map<string, School>
): School | null {
  const schoolId = getCell(row, headerMap, "schoolId");
  if (schoolId && byId.has(schoolId)) return byId.get(schoolId) ?? null;

  const slug = getCell(row, headerMap, "slug");
  if (slug && bySlug.has(slug)) return bySlug.get(slug) ?? null;

  return null;
}

function findSchoolCandidates(row: string[], headerMap: HeaderMap, schools: School[]): School[] {
  const name = getCell(row, headerMap, "schoolName");
  const municipality = getCell(row, headerMap, "municipality");
  const level = parseLevel(getCell(row, headerMap, "level"));
  const board = getCell(row, headerMap, "board");

  if (!name || !municipality) return [];

  const normalizedName = normalizeSchoolName(name);
  const normalizedMunicipality = normalizeLookup(municipality);
  const normalizedBoard = normalizeLookup(board);

  return schools.filter((school) => {
    if (normalizeLookup(school.municipality) !== normalizedMunicipality) return false;
    if (level && school.level !== level) return false;
    if (normalizedBoard && !normalizeLookup(school.board).includes(normalizedBoard) && !normalizedBoard.includes(normalizeLookup(school.board))) {
      return false;
    }

    return normalizeSchoolName(school.name) === normalizedName;
  });
}

function buildRanking(
  row: string[],
  headerMap: HeaderMap,
  defaults: { defaultSource: string; defaultYear: string }
): { ranking: SchoolRanking; errors: string[] } {
  const source = getCell(row, headerMap, "source") || defaults.defaultSource;
  const year = getCell(row, headerMap, "year") || defaults.defaultYear;
  const rank = getCell(row, headerMap, "rank");
  const url = getCell(row, headerMap, "url");
  const rawScore = getCell(row, headerMap, "score");
  const score = parseScore(rawScore);
  const errors: string[] = [];

  if (!source) errors.push("Source is required.");
  if (!year) errors.push("Year is required.");
  if (score === null) errors.push("Score must be a number from 0 to 10.");
  if (score === undefined && !rank) errors.push("A score or rank is required.");

  return {
    errors,
    ranking: {
      source,
      year,
      score: score ?? undefined,
      rank: rank || undefined,
      url: url || undefined
    }
  };
}

async function commitRankings(firestore: FirebaseFirestore.Firestore, results: RankingImportResult[]): Promise<number> {
  const now = new Date().toISOString();
  let batch = firestore.batch();
  let pending = 0;
  let updated = 0;

  for (const result of results) {
    if (result.status !== "matched" || !result.schoolId || !result.ranking) continue;

    const reference = firestore.collection(COLLECTIONS.schools).doc(result.schoolId);
    batch.set(
      reference,
      {
        ranking: result.ranking,
        rankingUpdatedAt: now,
        updatedAt: now
      },
      { merge: true }
    );
    pending += 1;
    updated += 1;

    if (pending === 400) {
      await batch.commit();
      batch = firestore.batch();
      pending = 0;
    }
  }

  if (pending > 0) {
    await batch.commit();
  }

  return updated;
}

function countResults(results: RankingImportResult[]) {
  return results.reduce(
    (counts, result) => {
      counts[result.status] += 1;
      return counts;
    },
    { matched: 0, unmatched: 0, ambiguous: 0, invalid: 0 }
  );
}

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let isQuoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];

    if (isQuoted) {
      if (char === "\"") {
        if (csv[index + 1] === "\"") {
          field += "\"";
          index += 1;
        } else {
          isQuoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === "\"") {
      isQuoted = true;
      continue;
    }

    if (char === ",") {
      row.push(field.trim());
      field = "";
      continue;
    }

    if (char === "\n") {
      row.push(field.trim());
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    if (char !== "\r") {
      field += char;
    }
  }

  if (isQuoted) {
    throw new Error("CSV has an unclosed quoted value.");
  }

  if (field || row.length > 0) {
    row.push(field.trim());
    rows.push(row);
  }

  return rows.filter((csvRow) => csvRow.some((cell) => cell.trim()));
}

function mapHeaders(headers: string[]): HeaderMap {
  const normalizedHeaders = headers.map(normalizeHeader);
  const headerMap: HeaderMap = {};

  for (const [column, aliases] of Object.entries(COLUMN_ALIASES) as Array<[RankingColumn, string[]]>) {
    const index = normalizedHeaders.findIndex((header) => aliases.map(normalizeHeader).includes(header));
    if (index >= 0) {
      headerMap[column] = index;
    }
  }

  return headerMap;
}

function getCell(row: string[], headerMap: HeaderMap, column: RankingColumn): string {
  const index = headerMap[column];
  if (index === undefined) return "";
  return (row[index] ?? "").trim();
}

function parseScore(value: string): number | undefined | null {
  if (!value) return undefined;
  const score = Number.parseFloat(value.replace(/\/10$/i, "").trim());
  if (!Number.isFinite(score) || score < 0 || score > 10) return null;
  return score;
}

function parseLevel(value: string): SchoolLevel | undefined {
  const normalized = normalizeLookup(value);
  if (!normalized) return undefined;
  if (normalized === "e" || normalized.includes("elementary")) return "elementary";
  if (normalized === "s" || normalized.includes("secondary") || normalized.includes("high")) return "secondary";
  return undefined;
}

function toCandidateSummary(school: School) {
  return {
    id: school.id,
    slug: school.slug,
    name: school.name,
    municipality: school.municipality,
    level: school.level,
    board: school.board
  };
}

function normalizeHeader(value: string): string {
  return normalizeLookup(value).replace(/\s+/g, "");
}

function normalizeSchoolName(value: string): string {
  return normalizeLookup(value)
    .replace(/\bp s\b/g, "public school")
    .replace(/\bs s\b/g, "secondary school")
    .replace(/\bh s\b/g, "high school")
    .replace(/\belementaire\b/g, "elementary")
    .replace(/\bsecondaire\b/g, "secondary")
    .replace(/\b(public|school|elementary|secondary|high)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLookup(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\bcatholic district school board\b/g, "cdsb")
    .replace(/\bdistrict school board\b/g, "dsb")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
