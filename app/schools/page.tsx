import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ExternalLink, GraduationCap, MapPin, Search, ShieldCheck } from "lucide-react";
import { ListingCard } from "@/components/listings/listing-card";
import { SearchTracker } from "@/components/listings/search-tracker";
import { PendingSchoolLink, PendingSubmitButton } from "@/components/schools/school-pending-controls";
import { SITE_CONFIG } from "@/config/site";
import {
  getNearbyListingsForSchool,
  getSchoolBySlug,
  getSchools
} from "@/lib/schools/service";
import type { ListingFilters } from "@/types/listing";
import type { School, SchoolLevel, SchoolRanking } from "@/types/school";

export const revalidate = 3600;
const NEARBY_LISTINGS_DISPLAY_LIMIT = 24;
const SCHOOL_RESULTS_DISPLAY_LIMIT = 75;
type SchoolSort = "name_asc" | "name_desc" | "rating_desc" | "rating_asc";

export async function generateMetadata({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  const hasSchoolFilters = Object.values(searchParams).some((value) => {
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.some((item) => item.trim().length > 0);
    return false;
  });

  return {
    title: "GTA School Search, Rankings & Nearby Homes",
    description:
      "Search schools across Toronto, Vaughan, Richmond Hill, Aurora, Newmarket, and King. Compare rankings, board details, and nearby homes on HomeScope GTA.",
    alternates: {
      canonical: `${SITE_CONFIG.baseUrl}/schools`
    },
    openGraph: {
      title: "GTA School Search, Rankings & Nearby Homes",
      description:
        "Search schools across Toronto, Vaughan, Richmond Hill, Aurora, Newmarket, and King. Compare rankings, board details, and nearby homes on HomeScope GTA.",
      url: `${SITE_CONFIG.baseUrl}/schools`,
      siteName: SITE_CONFIG.name,
      type: "website",
      images: ["/og-image.png"]
    },
    twitter: {
      card: "summary_large_image",
      title: "GTA School Search, Rankings & Nearby Homes",
      description:
        "Search schools across Toronto, Vaughan, Richmond Hill, Aurora, Newmarket, and King. Compare rankings, board details, and nearby homes on HomeScope GTA.",
      images: ["/og-image.png"]
    },
    robots: hasSchoolFilters
      ? {
          index: false,
          follow: true,
          googleBot: {
            index: false,
            follow: true
          }
        }
      : undefined
  };
}

export default async function SchoolsPage({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const query = toString(searchParams.q);
  const municipality = toString(searchParams.municipality);
  const level = parseLevel(toString(searchParams.level));
  const selectedSlug = toString(searchParams.school);
  const radiusKm = parseRadiusKm(toString(searchParams.radiusKm));
  const schoolSort = parseSchoolSort(toString(searchParams.schoolSort));
  const schoolPage = parseSchoolPage(toString(searchParams.schoolPage));

  const municipalities = SITE_CONFIG.primaryMarkets;
  const selectedSchoolBySlug = selectedSlug ? await getSchoolBySlug(selectedSlug) : undefined;
  const listMunicipality = municipality || (!query && !level ? selectedSchoolBySlug?.municipality : undefined);
  const schoolResults = await getSchools({ query, municipality: listMunicipality, level });
  const sortedSchoolResults = sortSchools(schoolResults, schoolSort);
  const selectedSchool = selectedSchoolBySlug;
  const schoolTotalPages = Math.max(1, Math.ceil(sortedSchoolResults.length / SCHOOL_RESULTS_DISPLAY_LIMIT));
  const currentSchoolPage = Math.min(schoolPage, schoolTotalPages);
  const visibleSchoolResults = getVisibleSchoolResults(sortedSchoolResults, selectedSchool, currentSchoolPage);
  const firstVisibleSchoolNumber =
    sortedSchoolResults.length === 0 ? 0 : (currentSchoolPage - 1) * SCHOOL_RESULTS_DISPLAY_LIMIT + 1;
  const lastVisibleSchoolNumber = Math.min(currentSchoolPage * SCHOOL_RESULTS_DISPLAY_LIMIT, sortedSchoolResults.length);
  const hasSchoolFilters = Boolean(query || listMunicipality || level);
  const nearbyListings = selectedSchool
    ? await getNearbyListingsForSchool(selectedSchool, radiusKm, { limit: NEARBY_LISTINGS_DISPLAY_LIMIT })
    : [];
  const hasMoreNearbyListings = nearbyListings.length >= NEARBY_LISTINGS_DISPLAY_LIMIT;
  const trackingFilters: ListingFilters = selectedSchool
    ? {
        city: selectedSchool.municipality,
        schoolSlug: selectedSchool.slug,
        schoolRadiusKm: radiusKm,
        sort: "distance",
        schoolSearchMode: "nearby",
        ...(query ? { schoolSearchQuery: query } : {}),
        ...(level ? { schoolLevel: level } : {})
      }
    : {
        ...(listMunicipality ? { city: listMunicipality } : {}),
        ...(query ? { schoolSearchQuery: query } : {}),
        ...(level ? { schoolLevel: level } : {}),
        schoolSearchMode: "directory"
      };
  const shouldTrackSchoolSearch = Boolean(selectedSchool || hasSchoolFilters);
  const trackingResultsTotal = selectedSchool ? nearbyListings.length : schoolResults.length;

  return (
    <section className="site-container py-10">
      {shouldTrackSchoolSearch ? <SearchTracker filters={trackingFilters} resultsTotal={trackingResultsTotal} /> : null}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
            <GraduationCap className="h-4 w-4" />
            School Search
          </p>
          <h1 className="mt-4 font-heading text-4xl text-brand-900">Find homes around the schools that matter.</h1>
          <p className="mt-3 text-brand-700">
            Search the official school directory for our six markets. Schools with coordinates can show nearby listings;
            catchment polygons can be added school-by-school as boundaries are digitized.
          </p>
        </div>
        <Link
          href="/listings"
          className="inline-flex items-center justify-center rounded-full border border-brand-200 bg-white px-5 py-3 text-sm font-semibold text-brand-900 transition hover:bg-brand-50"
        >
          Browse all listings
        </Link>
      </div>

      <form
        action="/schools"
        method="get"
        autoComplete="off"
        className="mt-8 grid gap-3 rounded-xl border border-brand-100 bg-white p-4 shadow-soft md:grid-cols-[minmax(0,1fr)_180px_160px_180px_120px]"
      >
        <label className="min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">School, board, program</span>
          <div className="mt-1 flex items-center gap-2 rounded-lg border border-brand-100 bg-brand-50 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-brand-500" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Moraine Hills, Bayview, IB..."
              className="w-full bg-transparent text-sm text-brand-900 outline-none placeholder:text-brand-400"
            />
          </div>
        </label>

        <label>
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">Municipality</span>
          <select
            name="municipality"
            defaultValue={listMunicipality || ""}
            className="mt-1 h-10 w-full rounded-lg border border-brand-100 bg-brand-50 px-3 text-sm text-brand-900 outline-none"
          >
            <option value="">All cities</option>
            {municipalities.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">Level</span>
          <select
            name="level"
            defaultValue={level || ""}
            className="mt-1 h-10 w-full rounded-lg border border-brand-100 bg-brand-50 px-3 text-sm text-brand-900 outline-none"
          >
            <option value="">Any level</option>
            <option value="elementary">Elementary</option>
            <option value="secondary">Secondary</option>
          </select>
        </label>

        <label>
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">Sort</span>
          <select
            name="schoolSort"
            defaultValue={schoolSort}
            className="mt-1 h-10 w-full rounded-lg border border-brand-100 bg-brand-50 px-3 text-sm text-brand-900 outline-none"
          >
            <option value="name_asc">Name A-Z</option>
            <option value="name_desc">Name Z-A</option>
            <option value="rating_desc">Rating high-low</option>
            <option value="rating_asc">Rating low-high</option>
          </select>
        </label>

        <div className="flex items-end">
          <PendingSubmitButton className="inline-flex h-10 w-full items-center justify-center rounded-full bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-80">
            Search
          </PendingSubmitButton>
        </div>
      </form>

      <div className="mt-8 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl text-brand-900">Schools</h2>
            <span className="text-sm text-brand-600">
              {schoolResults.length === 0
                ? "0 found"
                : `${schoolResults.length} found; showing ${firstVisibleSchoolNumber}-${lastVisibleSchoolNumber}`}
            </span>
          </div>

          {schoolTotalPages > 1 ? (
            <p className="rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm text-brand-700">
              Page {currentSchoolPage} of {schoolTotalPages}. Use the controls below to view the rest of the directory.
            </p>
          ) : null}

          {visibleSchoolResults.map((school) => {
            const isSelected = selectedSchool?.slug === school.slug;
            const href = buildSchoolSearchHref(school, {
              query,
              municipality: listMunicipality,
              level,
              radiusKm,
              schoolSort
            });

            return (
              <PendingSchoolLink
                key={school.id}
                href={href}
                className={`block rounded-xl border bg-white p-4 shadow-soft transition hover:-translate-y-0.5 ${
                  isSelected ? "border-brand-700 ring-2 ring-brand-100" : "border-brand-100"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-brand-900">{school.name}</h3>
                    <p className="text-sm text-brand-700">{school.municipality}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold capitalize text-brand-700">
                      {school.level}
                    </span>
                    <RankingPill ranking={school.ranking} compact />
                  </div>
                </div>
                <p className="mt-2 text-xs text-brand-600">{school.board}</p>
                <p className="mt-2 text-sm text-brand-700">{school.programs.join(", ")}</p>
              </PendingSchoolLink>
            );
          })}

          {schoolTotalPages > 1 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-100 bg-white p-3 shadow-soft">
              <PaginationLink
                href={buildSchoolPageHref({
                  query,
                  municipality: listMunicipality,
                  level,
                  schoolSort,
                  schoolPage: Math.max(1, currentSchoolPage - 1)
                })}
                disabled={currentSchoolPage <= 1}
              >
                Previous
              </PaginationLink>
              <span className="px-2 text-sm font-semibold text-brand-700">
                {currentSchoolPage} / {schoolTotalPages}
              </span>
              <PaginationLink
                href={buildSchoolPageHref({
                  query,
                  municipality: listMunicipality,
                  level,
                  schoolSort,
                  schoolPage: Math.min(schoolTotalPages, currentSchoolPage + 1)
                })}
                disabled={currentSchoolPage >= schoolTotalPages}
              >
                Next
              </PaginationLink>
            </div>
          ) : null}
        </aside>

        <div>
          {selectedSchool ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-brand-100 bg-white p-5 shadow-soft">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">
                      {selectedSchool.board}
                    </p>
                    <h2 className="mt-1 font-heading text-3xl text-brand-900">{selectedSchool.name}</h2>
                    <p className="mt-2 flex items-center gap-2 text-brand-700">
                      <MapPin className="h-4 w-4" />
                      {selectedSchool.municipality}
                    </p>
                  </div>
                  <RankingPanel ranking={selectedSchool.ranking} />
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <InfoPanel label="Level" value={titleCase(selectedSchool.level)} />
                  <InfoPanel label="Grades" value={selectedSchool.grades || "Verify with board"} />
                  <InfoPanel label="Programs" value={selectedSchool.programs.join(", ")} />
                </div>

                <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      Use this as a search guide, not a final eligibility decision. School boundaries, holding areas,
                      and programs can change; verify the exact address with the school board before making an offer.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {selectedSchool.boundaryMapUrl ? (
                    <ExternalButton href={selectedSchool.boundaryMapUrl}>Official boundary map</ExternalButton>
                  ) : null}
                  {selectedSchool.boundaryDirectoryUrl ? (
                    <ExternalButton href={selectedSchool.boundaryDirectoryUrl}>Boundary directory</ExternalButton>
                  ) : null}
                  {selectedSchool.locatorUrl ? (
                    <ExternalButton href={selectedSchool.locatorUrl}>Verify address</ExternalButton>
                  ) : null}
                  {selectedSchool.profileUrl ? (
                    <ExternalButton href={selectedSchool.profileUrl}>Ontario profile lookup</ExternalButton>
                  ) : null}
                </div>

                {selectedSchool.notes ? <p className="mt-4 text-sm text-brand-600">{selectedSchool.notes}</p> : null}
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="font-heading text-2xl text-brand-900">Nearby listings</h2>
                  {selectedSchool.latitude != null && selectedSchool.longitude != null ? (
                    <p className="text-sm text-brand-700">
                      Showing up to {NEARBY_LISTINGS_DISPLAY_LIMIT} closest listing(s) within {radiusKm} km of{" "}
                      {selectedSchool.name}
                    </p>
                  ) : (
                    <p className="text-sm text-brand-700">
                      This school has official directory details but still needs geocoding before nearby listings can be matched.
                    </p>
                  )}
                </div>
                {selectedSchool.latitude != null && selectedSchool.longitude != null ? (
                  <form action="/schools" method="get" autoComplete="off" className="flex items-end gap-2">
                  <input type="hidden" name="school" value={selectedSchool.slug} />
                  {query ? <input type="hidden" name="q" value={query} /> : null}
                  {listMunicipality ? <input type="hidden" name="municipality" value={listMunicipality} /> : null}
                  {level ? <input type="hidden" name="level" value={level} /> : null}
                  <label>
                    <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">Radius</span>
                    <select
                      name="radiusKm"
                      defaultValue={String(radiusKm)}
                      className="mt-1 h-10 rounded-lg border border-brand-100 bg-white px-3 text-sm text-brand-900 outline-none"
                    >
                      <option value="1">1 km</option>
                      <option value="3">3 km</option>
                      <option value="5">5 km</option>
                      <option value="10">10 km</option>
                    </select>
                  </label>
                  <PendingSubmitButton className="h-10 rounded-full border border-brand-200 bg-white px-4 text-sm font-semibold text-brand-900 transition hover:bg-brand-50 disabled:cursor-wait disabled:opacity-80">
                    Apply
                  </PendingSubmitButton>
                  </form>
                ) : null}
              </div>

              {selectedSchool.latitude == null || selectedSchool.longitude == null ? (
                <div className="rounded-xl border border-brand-100 bg-white p-8 text-center shadow-soft">
                  <h3 className="font-heading text-2xl text-brand-900">Geocoding needed</h3>
                  <p className="mt-2 text-brand-700">
                    The school is in the directory. Add latitude and longitude to enable radius-based home matching.
                  </p>
                </div>
              ) : nearbyListings.length === 0 ? (
                <div className="rounded-xl border border-brand-100 bg-white p-8 text-center shadow-soft">
                  <h3 className="font-heading text-2xl text-brand-900">No nearby listings yet</h3>
                  <p className="mt-2 text-brand-700">
                    Try a larger radius or browse all listings while we expand school coverage.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {nearbyListings.map(({ listing, distanceKm }) => (
                      <div key={listing.id} className="space-y-2">
                        <p className="text-sm font-semibold text-brand-700">{distanceKm.toFixed(1)} km from school</p>
                        <ListingCard listing={listing} showStatLabels={false} />
                      </div>
                    ))}
                  </div>
                  {hasMoreNearbyListings ? (
                    <div className="rounded-xl border border-brand-100 bg-white p-5 text-center shadow-soft">
                      <p className="text-sm text-brand-700">
                        Open the full listings search to browse every visible match for this school radius.
                      </p>
                      <Link
                        href={`/listings?schoolSlug=${selectedSchool.slug}&schoolRadiusKm=${radiusKm}&sort=distance`}
                        className="mt-3 inline-flex rounded-full bg-brand-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
                      >
                        View all nearby listings
                      </Link>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-brand-100 bg-white p-10 text-center shadow-soft">
              <h2 className="font-heading text-3xl text-brand-900">
                {schoolResults.length === 0
                  ? "No schools found"
                  : hasSchoolFilters
                    ? "Select a school from the list"
                    : "Choose a school to see details"}
              </h2>
              <p className="mt-2 text-brand-700">
                {schoolResults.length === 0
                  ? "Try a different school name, municipality, or level."
                  : hasSchoolFilters
                    ? `${schoolResults.length} school(s) match these filters. Click a school on the left to see details and nearby homes.`
                    : "Search the official school directory, then use board links to verify boundaries."}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function InfoPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3">
      <span className="block text-xs font-semibold uppercase tracking-wide text-brand-500">{label}</span>
      <span className="mt-1 block text-sm font-semibold text-brand-900">{value}</span>
    </div>
  );
}

function RankingPanel({ ranking }: { ranking?: SchoolRanking }) {
  const band = getRankingBand(ranking?.score);

  return (
    <div className={`min-w-48 rounded-lg border px-4 py-3 text-sm ${band.panelClassName}`}>
      <span className="block text-xs font-semibold uppercase tracking-wide opacity-80">Ranking</span>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <span className="block text-3xl font-bold leading-none">
            {ranking?.score != null ? formatRankingScore(ranking.score) : "--"}
          </span>
          <span className="mt-1 block text-xs font-semibold uppercase tracking-wide">{band.label}</span>
        </div>
        {ranking?.rank ? <span className="text-right text-sm font-semibold">{ranking.rank}</span> : null}
      </div>
      {ranking ? (
        <p className="mt-3 text-xs leading-5 opacity-85">
          {ranking.source}
          {ranking.year ? `, ${ranking.year}` : ""}
        </p>
      ) : (
        <p className="mt-3 text-xs leading-5 opacity-85">Ready for approved ranking data</p>
      )}
      {ranking?.url ? (
        <a href={ranking.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-semibold underline">
          View source
        </a>
      ) : null}
    </div>
  );
}

function RankingPill({ ranking, compact = false }: { ranking?: SchoolRanking; compact?: boolean }) {
  const band = getRankingBand(ranking?.score);

  if (!ranking?.score && !ranking?.rank) return null;

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${band.pillClassName}`}>
      {ranking?.score != null ? `${compact ? "" : "Rating "}${formatRankingScore(ranking.score)}` : ranking.rank}
    </span>
  );
}

function getRankingBand(score?: number): {
  label: string;
  panelClassName: string;
  pillClassName: string;
} {
  if (score == null) {
    return {
      label: "Pending",
      panelClassName: "border-brand-100 bg-brand-50 text-brand-800",
      pillClassName: "border-brand-100 bg-brand-50 text-brand-700"
    };
  }

  if (score >= 8) {
    return {
      label: "High",
      panelClassName: "border-emerald-200 bg-emerald-50 text-emerald-900",
      pillClassName: "border-emerald-200 bg-emerald-50 text-emerald-800"
    };
  }

  if (score >= 6) {
    return {
      label: "Mid-high",
      panelClassName: "border-yellow-200 bg-yellow-50 text-yellow-950",
      pillClassName: "border-yellow-200 bg-yellow-50 text-yellow-900"
    };
  }

  if (score >= 4) {
    return {
      label: "Mid-low",
      panelClassName: "border-orange-200 bg-orange-50 text-orange-950",
      pillClassName: "border-orange-200 bg-orange-50 text-orange-900"
    };
  }

  return {
    label: "Low",
    panelClassName: "border-red-200 bg-red-50 text-red-900",
    pillClassName: "border-red-200 bg-red-50 text-red-800"
  };
}

function formatRankingScore(score: number): string {
  return `${Number.isInteger(score) ? score.toFixed(0) : score.toFixed(1)}/10`;
}

function ExternalButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-900 transition hover:bg-brand-50"
    >
      {children}
      <ExternalLink className="h-4 w-4" />
    </a>
  );
}

function toString(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  return undefined;
}

function parseLevel(value?: string): SchoolLevel | undefined {
  if (value === "elementary" || value === "secondary") return value;
  return undefined;
}

function parseRadiusKm(value?: string): number {
  const parsed = Number(value);
  if ([1, 3, 5, 10].includes(parsed)) return parsed;
  return 3;
}

function parseSchoolSort(value?: string): SchoolSort {
  if (value === "name_desc" || value === "rating_desc" || value === "rating_asc") return value;
  return "name_asc";
}

function parseSchoolPage(value?: string): number {
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed > 0) return parsed;
  return 1;
}

function sortSchools(schools: School[], sort: SchoolSort): School[] {
  return [...schools].sort((left, right) => {
    if (sort === "rating_desc" || sort === "rating_asc") {
      const leftScore = left.ranking?.score;
      const rightScore = right.ranking?.score;

      if (leftScore == null && rightScore != null) return 1;
      if (leftScore != null && rightScore == null) return -1;
      if (leftScore != null && rightScore != null && leftScore !== rightScore) {
        return sort === "rating_desc" ? rightScore - leftScore : leftScore - rightScore;
      }
    }

    const nameComparison = left.name.localeCompare(right.name, "en", { sensitivity: "base" });
    if (nameComparison !== 0) return sort === "name_desc" ? -nameComparison : nameComparison;

    return left.municipality.localeCompare(right.municipality, "en", { sensitivity: "base" });
  });
}

function getVisibleSchoolResults(schools: School[], selectedSchool: School | undefined, page: number) {
  const startIndex = (page - 1) * SCHOOL_RESULTS_DISPLAY_LIMIT;
  const visible = schools.slice(startIndex, startIndex + SCHOOL_RESULTS_DISPLAY_LIMIT);
  if (!selectedSchool || visible.some((school) => school.slug === selectedSchool.slug)) {
    return visible;
  }

  return [
    selectedSchool,
    ...schools
      .filter((school) => school.slug !== selectedSchool.slug)
      .slice(startIndex, startIndex + Math.max(0, SCHOOL_RESULTS_DISPLAY_LIMIT - 1))
  ];
}

function buildSchoolSearchHref(
  school: School,
  options: {
    query?: string;
    municipality?: string;
    level?: SchoolLevel;
    radiusKm: number;
    schoolSort: SchoolSort;
  }
): string {
  const params = new URLSearchParams();
  params.set("radiusKm", String(options.radiusKm));

  return `/schools/${school.slug}?${params.toString()}`;
}

function buildSchoolPageHref(options: {
  query?: string;
  municipality?: string;
  level?: SchoolLevel;
  schoolSort: SchoolSort;
  schoolPage: number;
}): string {
  const params = new URLSearchParams();
  if (options.query) params.set("q", options.query);
  if (options.municipality) params.set("municipality", options.municipality);
  if (options.level) params.set("level", options.level);
  if (options.schoolSort !== "name_asc") params.set("schoolSort", options.schoolSort);
  if (options.schoolPage > 1) params.set("schoolPage", String(options.schoolPage));

  const queryString = params.toString();
  return `/schools${queryString ? `?${queryString}` : ""}`;
}

function PaginationLink({
  href,
  disabled,
  children
}: {
  href: string;
  disabled: boolean;
  children: ReactNode;
}) {
  const className =
    "inline-flex h-9 items-center justify-center rounded-full border border-brand-200 px-4 text-sm font-semibold transition";

  if (disabled) {
    return <span className={`${className} cursor-not-allowed bg-brand-50 text-brand-300`}>{children}</span>;
  }

  return (
    <Link href={href} className={`${className} bg-white text-brand-900 hover:bg-brand-50`}>
      {children}
    </Link>
  );
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
