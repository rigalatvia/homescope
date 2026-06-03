import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const workspaceRoot = process.cwd();
const pdfjsPath = path.join(workspaceRoot, ".tmp-pdf-tools", "node_modules", "pdfjs-dist", "legacy", "build", "pdf.mjs");
const pdfjs = await import(pathToFileURL(pdfjsPath).href);

const reports = [
  {
    level: "elementary",
    pdfPath: "C:/Users/rashe/Downloads/ontario-elementary-school-rankings-2025.pdf",
    totalRanked: 3047,
    tableStartPage: 13,
    tableEndPage: 38
  },
  {
    level: "secondary",
    pdfPath: "C:/Users/rashe/Downloads/ontario-secondary-school-rankings-2025_0.pdf",
    totalRanked: 747,
    tableStartPage: 13,
    tableEndPage: 19
  }
];

const source = "Fraser Institute";
const year = "2025";
const sourceUrl = "https://www.compareschoolrankings.org/";
const outputCsvPath = path.join(workspaceRoot, ".tmp-school-rankings-2025.csv");
const outputSummaryPath = path.join(workspaceRoot, ".tmp-school-rankings-2025-summary.json");

const schools = await loadSeedSchools();
const extractedRows = [];

for (const report of reports) {
  const rows = await extractReportRows(report);
  extractedRows.push(...rows);
}

const relevantRows = extractedRows.filter((row) => isRelevantCity(row.city));
const matchedRows = [];
const unmatchedRows = [];
const ambiguousRows = [];

for (const row of relevantRows) {
  const candidates = findSchoolCandidates(row, schools);

  if (candidates.length === 1) {
    matchedRows.push({ row, school: candidates[0] });
  } else if (candidates.length > 1) {
    ambiguousRows.push({ row, candidates: candidates.map(toSchoolSummary) });
  } else {
    unmatchedRows.push(row);
  }
}

const csvRows = [
  ["schoolId", "slug", "schoolName", "municipality", "level", "board", "source", "year", "score", "rank", "url"],
  ...matchedRows.map(({ row, school }) => [
    school.id,
    school.slug,
    school.name,
    school.municipality,
    school.level,
    school.board,
    source,
    year,
    row.score.toFixed(1),
    `${row.rank}/${row.totalRanked}`,
    sourceUrl
  ])
];

await fs.writeFile(outputCsvPath, toCsv(csvRows));
await fs.writeFile(
  outputSummaryPath,
  `${JSON.stringify(
    {
      extractedRows: extractedRows.length,
      relevantRows: relevantRows.length,
      matchedRows: matchedRows.length,
      unmatchedRows: unmatchedRows.length,
      ambiguousRows: ambiguousRows.length,
      outputCsvPath,
      samples: {
        matched: matchedRows.slice(0, 10).map(({ row, school }) => ({ row, school: toSchoolSummary(school) })),
        unmatched: unmatchedRows.slice(0, 40),
        ambiguous: ambiguousRows.slice(0, 20)
      }
    },
    null,
    2
  )}\n`
);

console.log(
  JSON.stringify(
    {
      extractedRows: extractedRows.length,
      relevantRows: relevantRows.length,
      matchedRows: matchedRows.length,
      unmatchedRows: unmatchedRows.length,
      ambiguousRows: ambiguousRows.length,
      outputCsvPath,
      outputSummaryPath
    },
    null,
    2
  )
);

async function loadSeedSchools() {
  const schoolsModulePath = path.join(workspaceRoot, "data", "schools.ts");
  let sourceText = await fs.readFile(schoolsModulePath, "utf8");
  sourceText = sourceText
    .replace(/^import type .*?;\s*/s, "")
    .replace("export const schools: School[] = ", "const schools = ")
    .replace(/;\s*$/s, "");

  return Function(`${sourceText}; return schools;`)();
}

async function extractReportRows(report) {
  const doc = await pdfjs.getDocument({
    url: pathToFileURL(report.pdfPath).href,
    disableWorker: true
  }).promise;
  const rows = [];

  for (let pageNumber = report.tableStartPage; pageNumber <= Math.min(report.tableEndPage, doc.numPages); pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const textContent = await page.getTextContent();
    rows.push(...extractTableRows(textContent.items, report, pageNumber));
  }

  return rows;
}

function extractTableRows(items, report, pageNumber) {
  const groupedRows = [];

  for (const item of items) {
    const value = normalizeCell(item.str);
    if (!value) continue;

    const x = item.transform[4];
    const y = item.transform[5];
    if (y < 80 || y > 690) continue;

    let row = groupedRows.find((candidate) => Math.abs(candidate.y - y) < 2);
    if (!row) {
      row = { y, items: [] };
      groupedRows.push(row);
    }
    row.items.push({ x, value });
  }

  groupedRows.sort((a, b) => b.y - a.y);

  return groupedRows.flatMap((row) =>
    [
      parseRecord(row.items, report, pageNumber, {
        rank: [60, 82],
        previousRank: [82, 101],
        trend: [101, 116],
        name: [116, 216],
        city: [216, 263],
        score: [263, 286],
        fiveYearScore: [286, 311]
      }),
      parseRecord(row.items, report, pageNumber, {
        rank: [306, 329],
        previousRank: [329, 347],
        trend: [347, 362],
        name: [362, 462],
        city: [462, 512],
        score: [512, 532],
        fiveYearScore: [532, 560]
      })
    ].filter(Boolean)
  );
}

function parseRecord(items, report, pageNumber, ranges) {
  const rank = parseInteger(readRange(items, ranges.rank));
  const previousRank = readRange(items, ranges.previousRank);
  const trend = readRange(items, ranges.trend);
  const schoolName = readRange(items, ranges.name);
  const city = readRange(items, ranges.city);
  const score = parseScore(readRange(items, ranges.score));
  const fiveYearScore = readRange(items, ranges.fiveYearScore);

  if (!rank || score == null || !schoolName || !city) return null;

  return {
    level: report.level,
    rank,
    previousRank,
    trend,
    schoolName,
    city,
    score,
    fiveYearScore,
    totalRanked: report.totalRanked,
    pageNumber
  };
}

function findSchoolCandidates(row, allSchools) {
  const rowCity = normalizeLookup(row.city);
  const parentMunicipality = cityToMunicipality(row.city);
  const normalizedName = normalizeSchoolName(row.schoolName);
  const scopedSchools = getScopedSchools(rowCity, parentMunicipality, row.level, allSchools);

  const exactCandidates = scopedSchools.filter((school) => {
    return normalizeSchoolName(school.name) === normalizedName;
  });

  if (exactCandidates.length > 0) return exactCandidates;

  const compactRowName = compactName(normalizedName);
  return scopedSchools.filter((school) => {
    return compactName(normalizeSchoolName(school.name)) === compactRowName;
  });
}

function getScopedSchools(reportCity, parentMunicipality, level, allSchools) {
  const levelSchools = allSchools.filter((school) => school.level === level);
  const exactCitySchools = levelSchools.filter((school) => {
    const sourceCity = normalizeLookup(school.sourceCity || "");
    const municipality = normalizeLookup(school.municipality);
    return sourceCity === reportCity || municipality === reportCity;
  });

  if (exactCitySchools.length > 0) return exactCitySchools;

  const parent = normalizeLookup(parentMunicipality);
  return parent ? levelSchools.filter((school) => normalizeLookup(school.municipality) === parent) : [];
}

function isRelevantCity(city) {
  return Boolean(cityToMunicipality(city));
}

function cityToMunicipality(city) {
  const normalized = normalizeLookup(city);
  const aliases = {
    aurora: "Aurora",
    concord: "Vaughan",
    "east york": "Toronto",
    etobicoke: "Toronto",
    "king city": "King",
    kleinburg: "Vaughan",
    maple: "Vaughan",
    newmarket: "Newmarket",
    nobleton: "King",
    "north york": "Toronto",
    "richmond hill": "Richmond Hill",
    scarborough: "Toronto",
    schomberg: "King",
    thornhill: "Vaughan",
    toronto: "Toronto",
    vaughan: "Vaughan",
    woodbridge: "Vaughan",
    york: "Toronto"
  };

  return aliases[normalized] || "";
}

function readRange(items, [minX, maxX]) {
  return normalizeCell(
    items
      .filter((item) => item.x >= minX && item.x < maxX)
      .sort((a, b) => a.x - b.x)
      .map((item) => item.value)
      .join(" ")
  );
}

function normalizeCell(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseInteger(value) {
  const match = value.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : null;
}

function parseScore(value) {
  const match = value.match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const score = Number.parseFloat(match[0]);
  return Number.isFinite(score) ? score : null;
}

function normalizeSchoolName(value) {
  return normalizeLookup(value)
    .replace(/\bst\b/g, "saint")
    .replace(/\bste\b/g, "sainte")
    .replace(/\bdr\b/g, "doctor")
    .replace(/\bfr\b/g, "father")
    .replace(/\bcatholic s\b/g, "catholic school")
    .replace(/\bpublic s\b/g, "public school")
    .replace(/\beec\b/g, " ")
    .replace(/\besc\b/g, " ")
    .replace(/\bec\b/g, " ")
    .replace(/\bps\b/g, "public school")
    .replace(/\bss\b/g, "secondary school")
    .replace(/\bchs\b/g, "catholic high school")
    .replace(/\bcatholic\b/g, " ")
    .replace(/\bcatholique\b/g, " ")
    .replace(/\bpublic\b/g, " ")
    .replace(/\bschool\b/g, " ")
    .replace(/\belementary\b/g, " ")
    .replace(/\belementaire\b/g, " ")
    .replace(/\bsecondary\b/g, " ")
    .replace(/\bsecondaire\b/g, " ")
    .replace(/\bhigh\b/g, " ")
    .replace(/\becole\b/g, " ")
    .replace(/\bcommunity\b/g, " ")
    .replace(/\balternative\b/g, " ")
    .replace(/\bjr\b/g, " ")
    .replace(/\bsr\b/g, " ")
    .replace(/\bjunior\b/g, " ")
    .replace(/\bsenior\b/g, " ")
    .replace(/\bmiddle\b/g, " ")
    .replace(/\band\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLookup(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactName(value) {
  return value.replace(/\s+/g, "");
}

function toCsv(rows) {
  return `${rows.map((row) => row.map(escapeCsv).join(",")).join("\n")}\n`;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toSchoolSummary(school) {
  return {
    id: school.id,
    slug: school.slug,
    name: school.name,
    municipality: school.municipality,
    sourceCity: school.sourceCity,
    level: school.level,
    board: school.board
  };
}
