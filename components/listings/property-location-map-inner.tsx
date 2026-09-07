"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

interface PropertyLocationMapInnerProps {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
}

const PROPERTY_PIN_ICON = L.divIcon({
  className: "homescope-property-pin-wrapper",
  html: '<span class="homescope-property-pin" />',
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

export function PropertyLocationMapInner({ latitude, longitude, address, city }: PropertyLocationMapInnerProps) {
  return (
    <div className="h-[18rem] overflow-hidden rounded-xl border border-brand-100 sm:h-[22rem]">
      <MapContainer center={[latitude, longitude]} zoom={16} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]} icon={PROPERTY_PIN_ICON}>
          <Popup>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-brand-900">{address}</p>
              <p className="text-brand-700">{city}</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
      <style jsx global>{`
        .homescope-property-pin-wrapper {
          background: transparent;
          border: 0;
        }
        .homescope-property-pin {
          display: block;
          width: 22px;
          height: 22px;
          border-radius: 9999px;
          border: 3px solid #fff;
          background: #2f4f58;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
        }
      `}</style>
    </div>
  );
}
