export type SchoolLevel = "elementary" | "secondary";

export interface SchoolRanking {
  source: string;
  year: string;
  score?: number;
  rank?: string;
  url?: string;
}

export interface School {
  id: string;
  slug: string;
  name: string;
  board: string;
  municipality: string;
  sourceCity?: string;
  level: SchoolLevel;
  address?: string;
  latitude?: number;
  longitude?: number;
  grades?: string;
  programs: string[];
  ranking?: SchoolRanking;
  geocodeProvider?: string;
  geocodedAt?: string;
  geocodeAttemptedAt?: string;
  geocodeStatus?: string;
  geocodeFormattedAddress?: string;
  geocodePlaceId?: string;
  geocodeLocationType?: string;
  geocodePartialMatch?: boolean;
  boundaryMapUrl?: string;
  boundaryDirectoryUrl?: string;
  locatorUrl?: string;
  profileUrl?: string;
  notes?: string;
  dataSource: string;
  updatedLabel?: string;
}

export interface SchoolSearchFilters {
  query?: string;
  municipality?: string;
  level?: SchoolLevel;
}

export interface SchoolNearbyListing {
  distanceKm: number;
  listingId: string;
}
