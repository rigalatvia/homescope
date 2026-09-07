"use client";

import dynamic from "next/dynamic";

interface PropertyLocationMapProps {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
}

const PropertyLocationMapInner = dynamic(
  () => import("@/components/listings/property-location-map-inner").then((module) => module.PropertyLocationMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="h-[18rem] rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-5 text-sm text-brand-700 sm:h-[22rem]">
        Loading the property map.
      </div>
    )
  }
);

export function PropertyLocationMap(props: PropertyLocationMapProps) {
  return <PropertyLocationMapInner {...props} />;
}
