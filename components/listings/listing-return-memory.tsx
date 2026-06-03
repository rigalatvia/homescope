"use client";

import { useEffect } from "react";

const LAST_LISTINGS_URL_KEY = "homescope:lastListingsUrl";

export function ListingReturnMemory() {
  useEffect(() => {
    const url = `${window.location.pathname}${window.location.search}`;
    if (url.startsWith("/listings") && !url.startsWith("/listings/")) {
      window.sessionStorage.setItem(LAST_LISTINGS_URL_KEY, url);
    }
  }, []);

  return null;
}

export function getLastListingsUrl(): string | null {
  if (typeof window === "undefined") return null;

  const savedUrl = window.sessionStorage.getItem(LAST_LISTINGS_URL_KEY);
  if (!savedUrl) return null;
  if (!savedUrl.startsWith("/listings") || savedUrl.startsWith("/listings/")) return null;

  return savedUrl;
}
