import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, GraduationCap, MapPin, ShieldCheck } from "lucide-react";
import { ListingCard } from "@/components/listings/listing-card";
import { SITE_CONFIG } from "@/config/site";
import { getNearbyListingsForSchool, getSchoolBySlug } from "@/lib/schools/service";
import type { School, SchoolRanking } from "@/types/school";

export const revalidate = 3600;
const NEARBY_LISTINGS_DISPLAY_LIMIT = 24;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const school = await getSchoolBySlug(params.slug);
  if (!school) {
    return { title: "School Not Found" };
  }

  const title = `${school.name} ${school.municipality} Rankings & Nearby Homes | HomeScope GTA`;
  const description = `View ${school.name} in ${school.municipality}, including ranking details, board information, grades, programs, and nearby GTA listings.`;
  const url = `${SITE_CONFIG.baseUrl}/schools/${school.slug}`;

  return {
    title: {
      absolute: title
    },
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_CONFIG.name,
      type: "website",
      images: ["/og-image.png"]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"]
    }
  };
}

export default async function SchoolDetailPage({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const school = await getSchoolBySlug(params.slug);
  if (!school) notFound();

  const radiusKm = parseRadiusKm(toString(searchParams.radiusKm));
  const nearbyListings = await getNearbyListingsForSchool(school, radiusKm, {
    limit: NEARBY_LISTINGS_DISPLAY_LIMIT
  });
  const hasMoreNearbyListings = nearbyListings.length >= NEARBY_LISTINGS_DISPLAY_LIMIT;
  const schoolUrl = `${SITE_CONFIG.baseUrl}/schools/${school.slug}`;
  const schoolJsonLd = buildSchoolJsonLd(school, schoolUrl);

  return (
    <section className="site-container py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schoolJsonLd) }} />
      <div className="mb-6">
        <Link
          href="/schools"
          className="inline-flex rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-900 transition hover:bg-brand-50"
        >
          Back to school search
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-5">
          <div className="rounded-xl border border-brand-100 bg-white p-6 shadow-soft">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
              <GraduationCap className="h-4 w-4" />
              {titleCase(school.level)} School
            </p>
            <h1 className="mt-4 font-heading text-4xl text-brand-900">{school.name}</h1>
            <p className="mt-2 flex items-center gap-2 text-brand-700">
              <MapPin className="h-4 w-4" />
              {school.address || school.municipality}
            </p>
            <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-brand-500">{school.board}</p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <InfoPanel label="Municipality" value={school.municipality} />
              <InfoPanel label="Grades" value={school.grades || "Verify with board"} />
              <InfoPanel label="Programs" value={school.programs.join(", ")} />
            </div>
          </div>

          <RankingPanel ranking={school.ranking} />

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Use this as a search guide, not a final eligibility decision. School boundaries, holding areas, and
                programs can change; verify the exact address with the school board before making an offer.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {school.boundaryMapUrl ? <ExternalButton href={school.boundaryMapUrl}>Official boundary map</ExternalButton> : null}
            {school.boundaryDirectoryUrl ? (
              <ExternalButton href={school.boundaryDirectoryUrl}>Boundary directory</ExternalButton>
            ) : null}
            {school.locatorUrl ? <ExternalButton href={school.locatorUrl}>Verify address</ExternalButton> : null}
            {school.profileUrl ? <ExternalButton href={school.profileUrl}>Ontario profile lookup</ExternalButton> : null}
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-heading text-2xl text-brand-900">Homes near {school.name}</h2>
              {school.latitude != null && school.longitude != null ? (
                <p className="text-sm text-brand-700">
                  Showing up to {NEARBY_LISTINGS_DISPLAY_LIMIT} closest listing(s) within {radiusKm} km.
                </p>
              ) : (
                <p className="text-sm text-brand-700">
                  This school has directory details but still needs geocoding before nearby listings can be matched.
                </p>
              )}
            </div>
            {school.latitude != null && school.longitude != null ? (
              <form action={`/schools/${school.slug}`} method="get" autoComplete="off" className="flex items-end gap-2">
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
                <button className="h-10 rounded-full border border-brand-200 bg-white px-4 text-sm font-semibold text-brand-900 transition hover:bg-brand-50">
                  Apply
                </button>
              </form>
            ) : null}
          </div>

          {school.latitude == null || school.longitude == null ? (
            <div className="rounded-xl border border-brand-100 bg-white p-8 text-center shadow-soft">
              <h3 className="font-heading text-2xl text-brand-900">Geocoding needed</h3>
              <p className="mt-2 text-brand-700">
                Add latitude and longitude to enable radius-based home matching for this school.
              </p>
            </div>
          ) : nearbyListings.length === 0 ? (
            <div className="rounded-xl border border-brand-100 bg-white p-8 text-center shadow-soft">
              <h3 className="font-heading text-2xl text-brand-900">No nearby listings yet</h3>
              <p className="mt-2 text-brand-700">Try a larger radius or browse all listings.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                {nearbyListings.map(({ listing, distanceKm }) => (
                  <div key={listing.id} className="space-y-2">
                    <p className="text-sm font-semibold text-brand-700">{distanceKm.toFixed(1)} km from school</p>
                    <ListingCard listing={listing} showStatLabels={false} />
                  </div>
                ))}
              </div>
              {hasMoreNearbyListings ? (
                <div className="rounded-xl border border-brand-100 bg-white p-5 text-center shadow-soft">
                  <p className="text-sm text-brand-700">Open listings search to browse every visible match.</p>
                  <Link
                    href={`/listings?schoolSlug=${school.slug}&schoolRadiusKm=${radiusKm}&sort=distance`}
                    className="mt-3 inline-flex rounded-full bg-brand-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
                  >
                    View all nearby listings
                  </Link>
                </div>
              ) : null}
            </>
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
    <div className={`rounded-lg border px-5 py-4 text-sm ${band.panelClassName}`}>
      <span className="block text-xs font-semibold uppercase tracking-wide opacity-80">Ranking</span>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <span className="block text-4xl font-bold leading-none">
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

function buildSchoolJsonLd(school: School, url: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: SITE_CONFIG.baseUrl
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Schools",
          item: `${SITE_CONFIG.baseUrl}/schools`
        },
        {
          "@type": "ListItem",
          position: 3,
          name: school.name,
          item: url
        }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "School",
      name: school.name,
      url,
      address: school.address
        ? {
            "@type": "PostalAddress",
            streetAddress: school.address,
            addressLocality: school.municipality,
            addressRegion: "ON",
            addressCountry: "CA"
          }
        : undefined,
      geo:
        school.latitude != null && school.longitude != null
          ? {
              "@type": "GeoCoordinates",
              latitude: school.latitude,
              longitude: school.longitude
            }
          : undefined,
      educationalLevel: school.level,
      department: school.board,
      additionalProperty: [
        {
          "@type": "PropertyValue",
          name: "Grades",
          value: school.grades || "Verify with board"
        },
        {
          "@type": "PropertyValue",
          name: "Programs",
          value: school.programs.join(", ")
        },
        ...(school.ranking?.score != null
          ? [
              {
                "@type": "PropertyValue",
                name: "Ranking score",
                value: formatRankingScore(school.ranking.score)
              }
            ]
          : [])
      ]
    }
  ];
}

function getRankingBand(score?: number): {
  label: string;
  panelClassName: string;
} {
  if (score == null) {
    return {
      label: "Pending",
      panelClassName: "border-brand-100 bg-brand-50 text-brand-800"
    };
  }

  if (score >= 8) {
    return {
      label: "High",
      panelClassName: "border-emerald-200 bg-emerald-50 text-emerald-900"
    };
  }

  if (score >= 6) {
    return {
      label: "Mid-high",
      panelClassName: "border-yellow-200 bg-yellow-50 text-yellow-950"
    };
  }

  if (score >= 4) {
    return {
      label: "Mid-low",
      panelClassName: "border-orange-200 bg-orange-50 text-orange-950"
    };
  }

  return {
    label: "Low",
    panelClassName: "border-red-200 bg-red-50 text-red-900"
  };
}

function formatRankingScore(score: number): string {
  return `${Number.isInteger(score) ? score.toFixed(0) : score.toFixed(1)}/10`;
}

function parseRadiusKm(value?: string): number {
  const parsed = Number(value);
  if ([1, 3, 5, 10].includes(parsed)) return parsed;
  return 3;
}

function toString(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  return undefined;
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
