import { schools } from "@/data/schools";
import { ALLOWED_PUBLIC_CITIES } from "@/config/site";
import { getAllPublicListings } from "@/lib/listings/service";
import { calculateDistanceKm } from "@/lib/schools/geo";
import type { Listing } from "@/types/listing";
import type { School, SchoolSearchFilters } from "@/types/school";

const DEFAULT_NEARBY_RADIUS_KM = 3;

export function getSchools(filters: SchoolSearchFilters = {}): School[] {
  const query = normalize(filters.query);
  const municipality = normalize(filters.municipality);

  return schools
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

export function getSchoolBySlug(slug: string): School | undefined {
  return schools.find((school) => school.slug === slug);
}

export function getSchoolMunicipalities(): string[] {
  return Array.from(new Set(schools.map((school) => school.municipality))).sort((a, b) => a.localeCompare(b));
}

export async function getNearbyListingsForSchool(
  school: School,
  radiusKm = DEFAULT_NEARBY_RADIUS_KM
): Promise<Array<{ listing: Listing; distanceKm: number }>> {
  const listings = await getAllPublicListings();

  return listings
    .filter((listing) => listing.latitude != null && listing.longitude != null)
    .map((listing) => ({
      listing,
      distanceKm: calculateDistanceKm(school.latitude, school.longitude, listing.latitude!, listing.longitude!)
    }))
    .filter((result) => result.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm || a.listing.price - b.listing.price);
}

function normalize(value?: string): string {
  return (value || "").trim().toLowerCase();
}
