"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { ListingFilters } from "@/types/listing";

export function SearchTracker({
  filters,
  resultsTotal
}: {
  filters: ListingFilters;
  resultsTotal: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastSentSignature = useRef<string>("");

  useEffect(() => {
    const queryString = searchParams.toString();
    const signature = `${pathname}?${queryString}|${resultsTotal}`;
    if (lastSentSignature.current === signature) return;
    lastSentSignature.current = signature;

    void fetch("/api/searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        queryString,
        resultsTotal,
        filters
      })
    }).catch((error) => {
      console.error("[searches] Failed to send search log", error);
    });
  }, [filters, pathname, resultsTotal, searchParams]);

  return null;
}
