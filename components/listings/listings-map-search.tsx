"use client";

import dynamic from "next/dynamic";
import type { Listing } from "@/types/listing";

interface ListingsMapSearchProps {
  initialListings?: Listing[];
  initialBounds?: {
    minLatitude?: number;
    maxLatitude?: number;
    minLongitude?: number;
    maxLongitude?: number;
  };
}

const ListingsMapSearchInner = dynamic(
  () => import("@/components/listings/listings-map-search-inner").then((module) => module.ListingsMapSearchInner),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3 rounded-2xl border border-brand-100 bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-brand-900">Map Search</p>
          <p className="text-xs text-brand-600">Preparing map tools...</p>
        </div>
        <div className="rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-5 text-sm text-brand-700">
          Loading the interactive map.
        </div>
      </div>
    )
  }
);

export function ListingsMapSearch(props: ListingsMapSearchProps) {
  return <ListingsMapSearchInner {...props} />;
}
