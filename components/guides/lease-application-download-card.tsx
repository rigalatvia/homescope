"use client";

import Link from "next/link";
import { trackRentalApplicationDownload } from "@/lib/analytics";

export function LeaseApplicationDownloadCard({
  title,
  description,
  href,
  buttonLabel
}: {
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
}) {
  function handleDownloadClick() {
    trackRentalApplicationDownload({ resourcePath: href });
  }

  return (
    <section className="my-10 rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-6 shadow-soft sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Downloadable Resource</p>
          <h2 className="mt-2 font-heading text-3xl text-brand-900">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-brand-700 sm:text-base">{description}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={href}
            download
            onClick={handleDownloadClick}
            className="inline-flex items-center justify-center rounded-full bg-brand-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            {buttonLabel}
          </a>
          <Link
            href="/listings"
            className="inline-flex items-center justify-center rounded-full border border-brand-200 px-6 py-3 text-sm font-semibold text-brand-900 transition hover:border-brand-400"
          >
            Browse Listings
          </Link>
        </div>
      </div>
    </section>
  );
}
