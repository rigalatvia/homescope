import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Showing Request Submitted | HomeScope GTA",
  description:
    "Thank you for your showing request. Check your email from homescopegta@gmail.com and review next steps from HomeScope GTA.",
  robots: {
    index: false,
    follow: false
  }
};

export default function ShowingRequestThankYouPage({
  searchParams
}: {
  searchParams: { returnTo?: string; listingTitle?: string };
}) {
  const returnTo = typeof searchParams.returnTo === "string" && searchParams.returnTo.startsWith("/")
    ? searchParams.returnTo
    : "/listings";
  const listingTitle =
    typeof searchParams.listingTitle === "string" && searchParams.listingTitle.trim()
      ? decodeURIComponent(searchParams.listingTitle)
      : "";

  return (
    <section className="site-container py-16">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-brand-100 bg-white p-8 shadow-soft sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Showing Request Submitted</p>
        <h1 className="mt-3 font-heading text-4xl text-brand-900 sm:text-5xl">Thank you for your request</h1>
        <p className="mt-4 text-base leading-8 text-brand-700 sm:text-lg">
          {listingTitle
            ? `We received your request for ${listingTitle}.`
            : "We received your showing request."}{" "}
          Please expect an email from <span className="font-semibold text-brand-900">homescopegta@gmail.com</span> and
          check your junk folder if you do not see it in the next few hours.
        </p>

        <div className="mt-8 rounded-3xl border border-brand-100 bg-brand-50/60 p-6">
          <h2 className="font-heading text-2xl text-brand-900">What happens next</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-brand-700 sm:text-base">
            <li>We review your request details and preferred showing time.</li>
            <li>We follow up by email to confirm next steps.</li>
            <li>For rental listings, you may be asked to share lease documents before scheduling is finalized.</li>
          </ul>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={returnTo}
            className="inline-flex rounded-full bg-brand-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            Return Back
          </Link>
          <Link
            href="/listings"
            className="inline-flex rounded-full border border-brand-200 px-6 py-3 text-sm font-semibold text-brand-900 transition hover:border-brand-300 hover:bg-brand-50"
          >
            Browse Listings
          </Link>
        </div>
      </div>
    </section>
  );
}
