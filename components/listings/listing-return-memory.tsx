"use client";

import { useEffect } from "react";

const LAST_LISTINGS_URL_KEY = "homescope:lastListingsUrl";
const LAST_LISTINGS_SCROLL_KEY_PREFIX = "homescope:listingsScroll";

export function ListingReturnMemory({ currentUrl }: { currentUrl: string }) {
  useEffect(() => {
    const url = currentUrl;
    if (!isListingsSearchUrl(url)) return;

    window.sessionStorage.setItem(LAST_LISTINGS_URL_KEY, url);

    const savedScroll = window.sessionStorage.getItem(getScrollStorageKey(url));
    if (savedScroll) {
      const scrollY = Number.parseInt(savedScroll, 10);
      if (Number.isFinite(scrollY) && scrollY > 0) {
        window.requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: "auto" }));
      }
    }

    let frameId = 0;
    const saveScroll = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        window.sessionStorage.setItem(getScrollStorageKey(url), String(Math.max(0, Math.round(window.scrollY))));
      });
    };

    saveScroll();
    window.addEventListener("scroll", saveScroll, { passive: true });
    window.addEventListener("pagehide", saveScroll);

    return () => {
      window.cancelAnimationFrame(frameId);
      saveScroll();
      window.removeEventListener("scroll", saveScroll);
      window.removeEventListener("pagehide", saveScroll);
    };
  }, [currentUrl]);

  return null;
}

export function getLastListingsUrl(): string | null {
  if (typeof window === "undefined") return null;

  const savedUrl = window.sessionStorage.getItem(LAST_LISTINGS_URL_KEY);
  if (!savedUrl) return null;
  if (!isListingsSearchUrl(savedUrl)) return null;

  return savedUrl;
}

export function isListingsSearchUrl(url: string): boolean {
  if (!url.startsWith("/listings")) return false;
  if (url.startsWith("/listings/")) return false;
  if (url.includes("\n") || url.includes("\r")) return false;
  return true;
}

function getScrollStorageKey(url: string): string {
  return `${LAST_LISTINGS_SCROLL_KEY_PREFIX}:${url}`;
}
