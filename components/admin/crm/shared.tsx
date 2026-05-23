import type { ReactNode } from "react";

export function CrmMetricCard({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-soft">
      <p className="text-sm font-semibold text-brand-700">{label}</p>
      <p className="mt-1 font-heading text-3xl text-brand-900">{value}</p>
      {detail ? <p className="mt-2 text-xs leading-5 text-brand-600">{detail}</p> : null}
    </div>
  );
}

export function CrmField({
  label,
  value,
  onChange,
  placeholder,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "date";
}) {
  return (
    <label className="block text-sm font-semibold text-brand-900">
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm text-brand-900 outline-none ring-brand-500 focus:ring-2"
      />
    </label>
  );
}

export function CrmTextAreaField({
  label,
  value,
  onChange,
  rows
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
}) {
  return (
    <label className="block text-sm font-semibold text-brand-900">
      {label}
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm text-brand-900 outline-none ring-brand-500 focus:ring-2"
      />
    </label>
  );
}

export function CrmMessage({
  tone,
  children
}: {
  tone: "success" | "error" | "info";
  children: ReactNode;
}) {
  const toneClassName =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "error"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-brand-200 bg-brand-50 text-brand-800";

  return <p className={`rounded-xl border px-4 py-3 text-sm ${toneClassName}`}>{children}</p>;
}
