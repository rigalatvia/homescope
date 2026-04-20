import type { LucideIcon } from "lucide-react";

export function GuideQuickChecklist({
  eyebrow = "Quick Checklist",
  title,
  description,
  items,
  icon: Icon
}: {
  eyebrow?: string;
  title: string;
  description: string;
  items: string[];
  icon: LucideIcon;
}) {
  return (
    <section className="not-prose rounded-[2rem] border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-6 shadow-soft sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-800">
            <Icon className="h-4 w-4" />
            {eyebrow}
          </div>
          <h2 className="mt-4 font-heading text-3xl text-brand-900">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-brand-700 sm:text-base">{description}</p>
        </div>

        <div className="rounded-3xl border border-brand-100 bg-white p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">At a Glance</h3>
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-6 text-brand-700">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-900 text-white">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function GuideSectionCard({
  title,
  description,
  bullets,
  icon: Icon,
  eyebrow
}: {
  title: string;
  description: string;
  bullets?: string[];
  icon: LucideIcon;
  eyebrow?: string;
}) {
  return (
    <section className="not-prose rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
      <div className="flex items-start gap-4">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-900">
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">{eyebrow}</p> : null}
          <h2 className="mt-2 font-heading text-3xl text-brand-900">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-brand-700 sm:text-base">{description}</p>
          {bullets?.length ? (
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm leading-6 text-brand-700"
                >
                  {bullet}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function GuideDarkHighlight({
  eyebrow = "Pro Tip",
  title,
  description,
  icon: Icon
}: {
  eyebrow?: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <section className="not-prose rounded-[2rem] bg-brand-900 px-6 py-7 text-white shadow-soft sm:px-8">
      <div className="flex items-start gap-4">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-200">{eyebrow}</p>
          <h2 className="mt-2 font-heading text-3xl">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-brand-100 sm:text-base">{description}</p>
        </div>
      </div>
    </section>
  );
}
