import Link from "next/link";

export interface CTASectionLink {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
}

export function CTASection({
  title,
  description,
  links
}: {
  title: string;
  description: string;
  links: CTASectionLink[];
}) {
  return (
    <section className="mt-12 rounded-3xl bg-brand-900 px-6 py-8 text-white shadow-soft sm:px-8">
      <h2 className="font-heading text-3xl">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-brand-100 sm:text-base">{description}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        {links.map((link) => (
          <Link
            key={`${link.href}-${link.label}`}
            href={link.href}
            className={
              link.variant === "secondary"
                ? "inline-flex rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white"
                : "inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-900 transition hover:bg-brand-50"
            }
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
