import type { School, SchoolRanking } from "@/types/school";

const schoolRankingOverrides: Record<string, SchoolRanking> = {
  "on-893978": {
    source: "Fraser Institute",
    year: "2025",
    score: 9.2,
    rank: "12/747",
    url: "https://www.compareschoolrankings.org/school/on/secondary/893978"
  }
};

export function applySchoolRankingOverrides(schools: School[]): School[] {
  return schools.map((school) => applySchoolRankingOverride(school));
}

export function applySchoolRankingOverride(school: School): School {
  const ranking = schoolRankingOverrides[school.id];
  if (!ranking) return school;

  return {
    ...school,
    ranking,
    rankingUpdatedAt: school.rankingUpdatedAt ?? "2026-07-19"
  };
}
