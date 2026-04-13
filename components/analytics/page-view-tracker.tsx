"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/analytics";

export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() || "";
  const initialized = useRef(false);

  useEffect(() => {
    if (!pathname) return;
    if (!initialized.current) {
      initialized.current = true;
      return;
    }

    const url = search ? `${pathname}?${search}` : pathname;
    trackPageView(url);
  }, [pathname, search]);

  return null;
}
