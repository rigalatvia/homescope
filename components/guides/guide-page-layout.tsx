import Link from "next/link";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/guides/breadcrumbs";
import type { FAQItem } from "@/components/guides/faq-section";
import { SITE_CONFIG } from "@/config/site";

export interface RelatedGuideLink {
  href: string;
  label: string;
  description?: string;
}

export interface ArticleSchemaInput {
  title: string;
  description: string;
  url: string;
}

export function GuidePageLayout({
  title,
  intro,
  breadcrumbs,
  relatedLinks,
  articleSchema,
  faqItems,
  children
}: {
  title: string;
  intro: string;
  breadcrumbs: BreadcrumbItem[];
  relatedLinks: RelatedGuideLink[];
  articleSchema: ArticleSchemaInput;
  faqItems?: FAQItem[];
  children: React.ReactNode;
}) {
  const articleSchemaJson = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: articleSchema.title,
    description: articleSchema.description,
    mainEntityOfPage: articleSchema.url,
    author: {
      "@type": "Organization",
      name: "HomeScope GTA"
    },
    publisher: {
      "@type": "Organization",
      name: "HomeScope GTA"
    }
  };
  const breadcrumbSchemaJson = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.href ? `${SITE_CONFIG.baseUrl}${item.href}` : articleSchema.url
    }))
  };
  const faqSchemaJson =
    faqItems && faqItems.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer
            }
          }))
        }
      : null;

  return (
    <section className="site-container py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchemaJson) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchemaJson) }}
      />
      {faqSchemaJson ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchemaJson) }} />
      ) : null}
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-10">
        <Breadcrumbs items={breadcrumbs} />
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Ontario Guide</p>
          <h1 className="mt-3 font-heading text-4xl text-brand-900 sm:text-5xl">{title}</h1>
          <p className="mt-4 text-base leading-8 text-brand-700 sm:text-lg">{intro}</p>
        </header>

        <article className="mt-10 prose prose-slate max-w-none prose-headings:font-heading prose-headings:text-brand-900 prose-p:text-brand-700 prose-li:text-brand-700 prose-strong:text-brand-900">
          {children}
        </article>

        <aside className="mt-12 rounded-3xl border border-brand-100 bg-brand-50/60 p-6">
          <h2 className="font-heading text-2xl text-brand-900">Related Resources</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl border border-brand-100 bg-white p-5 transition hover:border-brand-300"
              >
                <h3 className="text-lg font-semibold text-brand-900">{link.label}</h3>
                {link.description ? <p className="mt-2 text-sm leading-6 text-brand-700">{link.description}</p> : null}
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
