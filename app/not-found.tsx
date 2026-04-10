import Link from "next/link";

export default function NotFoundPage() {
  return (
    <section className="site-container py-20 text-center">
      <h1 className="font-heading text-5xl text-brand-900">Listing Not Found</h1>
      <p className="mt-3 text-brand-700">This listing may be unavailable or not approved for public display.</p>
      <Link href="/listings" className="mt-8 inline-block rounded-full bg-brand-800 px-6 py-3 text-sm font-semibold text-white">
        Return to Listings
      </Link>
    </section>
  );
}
