"use client";

import { useEffect, useRef } from "react";
import { trackPropertyView } from "@/lib/analytics";

export function PropertyViewTracker({ propertyId, city }: { propertyId: string; city: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackPropertyView({ propertyId, city });
  }, [city, propertyId]);

  return null;
}
