"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/analytics";
import { CONSENT_UPDATED_EVENT, hasTrackingConsent } from "@/lib/consent";

export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() || "";
  const lastTrackedUrl = useRef<string | null>(null);
  const [consentVersion, setConsentVersion] = useState(0);

  useEffect(() => {
    const handleConsentUpdated = (_event: Event) => {
      setConsentVersion((current) => current + 1);
    };

    window.addEventListener(CONSENT_UPDATED_EVENT, handleConsentUpdated as EventListener);
    window.addEventListener("storage", handleConsentUpdated as EventListener);

    return () => {
      window.removeEventListener(CONSENT_UPDATED_EVENT, handleConsentUpdated as EventListener);
      window.removeEventListener("storage", handleConsentUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!pathname) return;
    if (!hasTrackingConsent()) return;

    const url = search ? `${pathname}?${search}` : pathname;
    if (lastTrackedUrl.current === url) return;

    lastTrackedUrl.current = url;
    trackPageView(url);
  }, [pathname, search, consentVersion]);

  return null;
}
