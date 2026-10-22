import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PropertySearchLandingPage } from "@/components/seo/property-search-landing-page";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getPropertySearchLanding } from "@/lib/seo/property-search-landings";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { citySlug: string } }): Metadata {
  const landing = getPropertySearchLanding("homes-for-sale", params.citySlug);
  if (!landing) return { title: "Location Not Found", robots: { index: false, follow: false } };
  return buildPageMetadata({ title: landing.title, description: landing.description, path: `/homes-for-sale/${landing.citySlug}` });
}

export default async function HomesForSalePage({ params }: { params: { citySlug: string } }) {
  const landing = getPropertySearchLanding("homes-for-sale", params.citySlug);
  if (!landing) notFound();
  return <PropertySearchLandingPage landing={landing} />;
}
