"use client";

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import { formatPrice } from "@/lib/utils/format";
import type { Listing } from "@/types/listing";

interface ListingsMapSearchProps {
  listings: Listing[];
  initialBounds?: {
    minLatitude?: number;
    maxLatitude?: number;
    minLongitude?: number;
    maxLongitude?: number;
  };
}

export function ListingsMapSearch({ listings, initialBounds }: ListingsMapSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [draftBounds, setDraftBounds] = useState(initialBounds || {});

  const mappableListings = useMemo(
    () =>
      listings.filter(
        (listing): listing is Listing & { latitude: number; longitude: number } =>
          typeof listing.latitude === "number" && typeof listing.longitude === "number"
      ),
    [listings]
  );

  if (mappableListings.length === 0) {
    return (
      <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-soft">
        <p className="text-sm text-brand-700">Map search is unavailable because these listings do not include coordinates.</p>
      </div>
    );
  }

  const center = {
    lat: average(mappableListings.map((listing) => listing.latitude)),
    lng: average(mappableListings.map((listing) => listing.longitude))
  };
  const mapViewCount = mappableListings.filter((listing) => withinBounds(listing, draftBounds)).length;

  const applyMapArea = () => {
    const next = new URLSearchParams(searchParams.toString());
    setOrDelete(next, "minLatitude", draftBounds.minLatitude);
    setOrDelete(next, "maxLatitude", draftBounds.maxLatitude);
    setOrDelete(next, "minLongitude", draftBounds.minLongitude);
    setOrDelete(next, "maxLongitude", draftBounds.maxLongitude);
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  };

  const clearMapArea = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("minLatitude");
    next.delete("maxLatitude");
    next.delete("minLongitude");
    next.delete("maxLongitude");
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-brand-100 bg-white p-4 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-brand-900">Map Search</p>
        <p className="text-xs text-brand-600">{mapViewCount} listing(s) in current map view</p>
      </div>
      <div className="h-[26rem] overflow-hidden rounded-xl border border-brand-100">
        <MapContainer center={[center.lat, center.lng]} zoom={11} scrollWheelZoom className="h-full w-full">
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapBoundsTracker onBoundsChange={setDraftBounds} />
          {mappableListings.map((listing) => (
            <Marker key={listing.id} position={[listing.latitude, listing.longitude]}>
              <Popup>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-brand-900">{formatPrice(listing.price)}</p>
                  <p className="text-brand-700">{listing.address}</p>
                  <p className="text-xs text-brand-600">MLS {listing.mlsNumber}</p>
                  <Link href={`/listings/${listing.listingUrlSlug}`} className="text-xs font-semibold text-brand-800 underline">
                    View Details
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={applyMapArea}
          className="rounded-full bg-brand-800 px-4 py-2 text-xs font-semibold text-white"
        >
          Search this map area
        </button>
        <button
          type="button"
          onClick={clearMapArea}
          className="rounded-full border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-800"
        >
          Clear map area
        </button>
      </div>
    </div>
  );
}

function MapBoundsTracker({
  onBoundsChange
}: {
  onBoundsChange: (bounds: {
    minLatitude: number;
    maxLatitude: number;
    minLongitude: number;
    maxLongitude: number;
  }) => void;
}) {
  const map = useMapEvents({
    moveend: updateBounds,
    zoomend: updateBounds
  });

  function updateBounds(): void {
    const bounds = map.getBounds();
    onBoundsChange({
      minLatitude: bounds.getSouth(),
      maxLatitude: bounds.getNorth(),
      minLongitude: bounds.getWest(),
      maxLongitude: bounds.getEast()
    });
  }

  return null;
}

function setOrDelete(params: URLSearchParams, key: string, value?: number): void {
  if (typeof value !== "number" || Number.isNaN(value)) {
    params.delete(key);
    return;
  }
  params.set(key, String(value));
}

function average(values: number[]): number {
  if (values.length === 0) return 43.75;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function withinBounds(
  listing: Listing & { latitude: number; longitude: number },
  bounds: {
    minLatitude?: number;
    maxLatitude?: number;
    minLongitude?: number;
    maxLongitude?: number;
  }
): boolean {
  if (bounds.minLatitude != null && listing.latitude < bounds.minLatitude) return false;
  if (bounds.maxLatitude != null && listing.latitude > bounds.maxLatitude) return false;
  if (bounds.minLongitude != null && listing.longitude < bounds.minLongitude) return false;
  if (bounds.maxLongitude != null && listing.longitude > bounds.maxLongitude) return false;
  return true;
}
