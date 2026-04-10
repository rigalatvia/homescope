import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-hero-gradient py-20 sm:py-28">
      <div className="absolute -right-28 top-0 h-72 w-72 rounded-full bg-brand-200/30 blur-3xl" />
      <div className="absolute -bottom-20 left-8 h-56 w-56 rounded-full bg-amber-200/45 blur-3xl" />
      <div className="site-container relative">
        <p className="text-sm uppercase tracking-[0.24em] text-brand-700">ONTARIO REAL ESTATE</p>
        <h1 className="mt-4 max-w-3xl font-heading text-4xl leading-tight text-brand-900 sm:text-6xl">
          Find Your Next Home in the GTA
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-brand-800">
          Browse curated public listings across Vaughan, Richmond Hill, Aurora, Newmarket, King, and Toronto through a clean,
          modern home search experience.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/listings"
            className="rounded-full bg-brand-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Browse Listings
          </Link>
          <Link
            href="/contact"
            className="rounded-full border border-brand-300 bg-white/70 px-6 py-3 text-sm font-semibold text-brand-900 transition hover:bg-white"
          >
            Contact HomeScope GTA
          </Link>
        </div>
      </div>
    </section>
  );
}
