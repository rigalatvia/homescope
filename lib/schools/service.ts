import { schools as seedSchools } from "@/data/schools";
import { ALLOWED_PUBLIC_CITIES } from "@/config/site";
import { getNearbyListingCandidates } from "@/lib/listings/service";
import { getSchoolDirectory } from "@/lib/schools/firestore-data";
import { calculateDistanceKm } from "@/lib/schools/geo";
import type { Listing } from "@/types/listing";
import type { School, SchoolSearchFilters } from "@/types/school";

const DEFAULT_NEARBY_RADIUS_KM = 3;
const DEFAULT_NEARBY_LISTING_LIMIT = 24;

export async function getSchools(filters: SchoolSearchFilters = {}): Promise<School[]> {
  const directory = await getSchoolDirectory();
  return filterSchools(directory, filters);
}

export function getSeedSchools(filters: SchoolSearchFilters = {}): School[] {
  return filterSchools(seedSchools, filters);
}

export async function getSchoolBySlug(slug: string): Promise<School | undefined> {
  const directory = await getSchoolDirectory();
  return directory.find((school) => school.slug === slug);
}

export function getSeedSchoolBySlug(slug: string): School | undefined {
  return seedSchools.find((school) => school.slug === slug);
}

export function getSchoolMunicipalities(): string[] {
  return Array.from(new Set(seedSchools.map((school) => school.municipality))).sort((a, b) => a.localeCompare(b));
}

function filterSchools(directory: School[], filters: SchoolSearchFilters = {}): School[] {
  const query = normalize(filters.query);
  const municipality = normalize(filters.municipality);

  return directory
    .filter((school) => {
      if (!ALLOWED_PUBLIC_CITIES.has(school.municipality as never)) return false;
      if (filters.level && school.level !== filters.level) return false;
      if (municipality && normalize(school.municipality) !== municipality) return false;
      if (!query) return true;

      const haystack = normalize(
        [
          school.name,
          school.board,
          school.municipality,
          school.level,
          school.grades,
          school.programs.join(" ")
        ].join(" ")
      );

      return haystack.includes(query);
    })
    .sort((a, b) => a.municipality.localeCompare(b.municipality) || a.name.localeCompare(b.name));
}

export async function getNearbyListingsForSchool(
  school: School,
  radiusKm = DEFAULT_NEARBY_RADIUS_KM,
  options: { limit?: number } = {}
): Promise<Array<{ listing: Listing; distanceKm: number }>> {
  if (school.latitude == null || school.longitude == null) {
    return [];
  }

  const schoolLatitude = school.latitude;
  const schoolLongitude = school.longitude;
  const limit = Math.max(1, options.limit ?? DEFAULT_NEARBY_LISTING_LIMIT);
  const listings = await getNearbyListingCandidates({
    latitude: schoolLatitude,
    longitude: schoolLongitude,
    radiusKm,
    municipality: school.municipality,
    maxCandidates: Math.max(150, limit * 10)
  });

  return listings
    .filter((listing) => listing.latitude != null && listing.longitude != null)
    .map((listing) => ({
      listing,
      distanceKm: calculateDistanceKm(schoolLatitude, schoolLongitude, listing.latitude!, listing.longitude!)
    }))
    .filter((result) => result.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm || a.listing.price - b.listing.price)
    .slice(0, limit);
}

function normalize(value?: string): string {
  return (value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\bp s\b/g, "public school")
    .replace(/\bps\b/g, "public school")
    .replace(/\bs s\b/g, "secondary school")
    .replace(/\bss\b/g, "secondary school")
    .replace(/\bh s\b/g, "high school")
    .replace(/\bhs\b/g, "high school")
    .replace(/\s+/g, " ");
}
