export function ValuePointsSection() {
  const values = [
    "Curated public listings",
    "Clean and simple search experience",
    "Fast showing request flow"
  ];

  return (
    <section className="site-container py-6 sm:py-8">
      <div className="rounded-3xl border border-brand-100 bg-white p-8 shadow-soft sm:p-10">
        <h2 className="font-heading text-3xl text-brand-900">Why HomeScope GTA</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {values.map((value, index) => (
            <article key={value} className="rounded-2xl border border-brand-100 bg-brand-50/50 p-5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-800 text-xs font-bold text-white">
                {index + 1}
              </span>
              <p className="mt-3 text-sm font-semibold text-brand-900">{value}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
