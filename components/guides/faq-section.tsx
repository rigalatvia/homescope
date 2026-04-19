export interface FAQItem {
  question: string;
  answer: string;
}

export function FAQSection({ title = "Frequently Asked Questions", items }: { title?: string; items: FAQItem[] }) {
  return (
    <section className="mt-12">
      <h2 className="font-heading text-3xl text-brand-900">{title}</h2>
      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <details key={item.question} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-soft">
            <summary className="cursor-pointer list-none font-semibold text-brand-900">{item.question}</summary>
            <p className="mt-3 text-sm leading-7 text-brand-700 sm:text-base">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
