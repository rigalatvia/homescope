"use client";

import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import L from "leaflet";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { formatPrice } from "@/lib/utils/format";
import type { Listing } from "@/types/listing";

interface ListingsMapSearchInnerProps {
  mapQueryString: string;
  initialListings?: Listing[];
  hasMoreListings?: boolean;
  initialBounds?: {
    minLatitude?: number;
    maxLatitude?: number;
    minLongitude?: number;
    maxLongitude?: number;
  };
}

const MAX_RENDERED_MARKERS = 3000;
const MAP_PIN_ICON = L.divIcon({
  className: "homescope-map-pin-wrapper",
  html: '<span class="homescope-map-pin" />',
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

export function ListingsMapSearchInner({
  mapQueryString,
  initialListings,
  hasMoreListings,
  initialBounds
}: ListingsMapSearchInnerProps) {
  const [draftBounds, setDraftBounds] = useState(initialBounds || {});
  const [listings, setListings] = useState<Listing[] | null>(initialListings ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedFullResults, setHasLoadedFullResults] = useState(false);
  const loadedListings = useMemo(() => listings ?? [], [listings]);

  useEffect(() => {
    setListings(initialListings ?? null);
    setDraftBounds(initialBounds || {});
    setIsLoading(false);
    setError(null);
    setHasLoadedFullResults(false);
  }, [initialBounds, initialListings, mapQueryString]);

  useEffect(() => {
    if (!hasMoreListings || hasLoadedFullResults || isLoading) return;

    let cancelled = false;

    async function loadListings() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/listings/map${mapQueryString ? `?${mapQueryString}` : ""}`, {
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("Unable to load map listings.");
        }

        const data = (await response.json()) as { listings?: Listing[] };
        if (!cancelled) {
          setListings(Array.isArray(data.listings) ? data.listings : []);
          setHasLoadedFullResults(true);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load map listings.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadListings();

    return () => {
      cancelled = true;
    };
  }, [hasLoadedFullResults, hasMoreListings, isLoading, mapQueryString]);

  const mappableListings = useMemo(
    () =>
      loadedListings.filter(
        (listing): listing is Listing & { latitude: number; longitude: number } =>
          typeof listing.latitude === "number" && typeof listing.longitude === "number"
      ),
    [loadedListings]
  );
  const renderedListings = useMemo(() => mappableListings.slice(0, MAX_RENDERED_MARKERS), [mappableListings]);
  const missingCoordinatesCount = loadedListings.length - mappableListings.length;

  if (listings == null) {
    return (
      <div className="space-y-3 rounded-2xl border border-brand-100 bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-brand-900">Map Search</p>
          <p className="text-xs text-brand-600">Loading matching listing locations...</p>
        </div>
        <div className="rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-5 text-sm text-brand-700">
          Preparing the map for your current filters.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3 rounded-2xl border border-brand-100 bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-brand-900">Map Search</p>
          <p className="text-xs text-brand-600">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setListings(null);
            setError(null);
          }}
          className="rounded-full border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-800 hover:border-brand-400"
        >
          Try again
        </button>
      </div>
    );
  }

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

  return (
    <div className="space-y-3 rounded-2xl border border-brand-100 bg-white p-4 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-brand-900">Map Search</p>
        <p className="text-xs text-brand-600">
          {mappableListings.length} mapped of {loadedListings.length} result(s) | {mapViewCount} in current map view
          {missingCoordinatesCount > 0 ? ` | ${missingCoordinatesCount} without coordinates` : ""}
          {mappableListings.length > MAX_RENDERED_MARKERS ? ` | rendering first ${MAX_RENDERED_MARKERS}` : ""}
          {isLoading ? " | refreshing full map results..." : ""}
        </p>
      </div>
      <div className="h-[24rem] overflow-hidden rounded-xl border border-brand-100">
        <MapContainer center={[center.lat, center.lng]} zoom={11} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewportController listings={renderedListings} initialBounds={initialBounds} onBoundsChange={setDraftBounds} />
          <MapBoundsTracker onBoundsChange={setDraftBounds} />
          <MarkerClusterGroup chunkedLoading maxClusterRadius={50} disableClusteringAtZoom={16}>
            {renderedListings.map((listing) => (
              <Marker key={listing.id} position={[listing.latitude, listing.longitude]} icon={MAP_PIN_ICON}>
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
          </MarkerClusterGroup>
        </MapContainer>
      </div>
      <style jsx global>{`
        .homescope-map-pin-wrapper {
          background: transparent;
          border: 0;
        }
        .homescope-map-pin {
          display: block;
          width: 14px;
          height: 14px;
          border-radius: 9999px;
          border: 2px solid #fff;
          background: #2f4f58;
          box-shadow: 0 1px 6px rgba(0, 0, 0, 0.35);
        }
      `}</style>
    </div>
  );
}

function MapViewportController({
  listings,
  initialBounds,
  onBoundsChange
}: {
  listings: Array<Listing & { latitude: number; longitude: number }>;
  initialBounds?: {
    minLatitude?: number;
    maxLatitude?: number;
    minLongitude?: number;
    maxLongitude?: number;
  };
  onBoundsChange: (bounds: {
    minLatitude: number;
    maxLatitude: number;
    minLongitude: number;
    maxLongitude: number;
  }) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (listings.length === 0) return;

    if (
      initialBounds?.minLatitude != null &&
      initialBounds?.maxLatitude != null &&
      initialBounds?.minLongitude != null &&
      initialBounds?.maxLongitude != null
    ) {
      map.fitBounds(
        [
          [initialBounds.minLatitude, initialBounds.minLongitude],
          [initialBounds.maxLatitude, initialBounds.maxLongitude]
        ],
        { padding: [20, 20] }
      );
      onBoundsChange({
        minLatitude: initialBounds.minLatitude,
        maxLatitude: initialBounds.maxLatitude,
        minLongitude: initialBounds.minLongitude,
        maxLongitude: initialBounds.maxLongitude
      });
      return;
    }

    const bounds = L.latLngBounds(listings.map((listing) => [listing.latitude, listing.longitude]));
    map.fitBounds(bounds, { padding: [20, 20] });
    const fittedBounds = map.getBounds();
    onBoundsChange({
      minLatitude: fittedBounds.getSouth(),
      maxLatitude: fittedBounds.getNorth(),
      minLongitude: fittedBounds.getWest(),
      maxLongitude: fittedBounds.getEast()
    });
  }, [initialBounds, listings, map, onBoundsChange]);

  return null;
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
  const map = useMap();

  const updateBounds = useCallback((): void => {
    const bounds = map.getBounds();
    onBoundsChange({
      minLatitude: bounds.getSouth(),
      maxLatitude: bounds.getNorth(),
      minLongitude: bounds.getWest(),
      maxLongitude: bounds.getEast()
    });
  }, [map, onBoundsChange]);

  useMapEvents({
    moveend: updateBounds,
    zoomend: updateBounds
  });

  useEffect(() => {
    updateBounds();
  }, [updateBounds]);

  return null;
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
