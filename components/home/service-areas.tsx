import { SITE_CONFIG } from "@/config/site";

export function ServiceAreasSection() {
  return (
    <section className="site-container py-14 sm:py-16">
      <div className="rounded-3xl border border-brand-100 bg-white p-8 shadow-soft sm:p-10">
        <h2 className="font-heading text-3xl text-brand-900">Explore Key GTA Markets</h2>
        <p className="mt-3 max-w-3xl text-brand-700">
          Discover available homes across some of the most in-demand communities in the Greater Toronto Area.
        </p>
        <ul className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {SITE_CONFIG.primaryMarkets.map((city) => (
            <li
              key={city}
              className="rounded-xl border border-brand-100 bg-gradient-to-b from-white to-brand-50 px-4 py-4 text-center font-semibold text-brand-900"
            >
              {city}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
