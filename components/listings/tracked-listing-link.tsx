"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

export function TrackedListingLink({ href, listingId, isRental, className, children }: { href:string; listingId:string; isRental:boolean; className?:string; children:React.ReactNode }) {
  return <Link href={href} className={className} onClick={() => { if (isRental) trackEvent("rental_listing_clicked", { listing_id: listingId }); }}>{children}</Link>;
}
