import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}

export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-brand-200 bg-brand-50/60 px-6 py-10 text-center">
      <p className="font-heading text-2xl text-brand-900">{title}</p>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-brand-700 sm:text-base">{description}</p>
      <Link
        href={actionHref}
        className="mt-6 inline-flex rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
