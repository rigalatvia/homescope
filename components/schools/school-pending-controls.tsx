"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";

const PENDING_FALLBACK_MS = 12000;

interface PendingSchoolLinkProps {
  href: string;
  className: string;
  children: ReactNode;
}

export function PendingSchoolLink({ href, className, children }: PendingSchoolLinkProps) {
  const [isPending, setIsPending] = useState(false);
  const currentUrl = useCurrentRelativeUrl();

  useEffect(() => {
    setIsPending(false);
  }, [currentUrl]);

  useEffect(() => {
    if (!isPending) return;

    const timeout = window.setTimeout(() => setIsPending(false), PENDING_FALLBACK_MS);
    return () => window.clearTimeout(timeout);
  }, [isPending]);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    if (normalizeRelativeUrl(href) === normalizeRelativeUrl(currentUrl)) {
      return;
    }

    setIsPending(true);
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      aria-busy={isPending}
      className={`${className} relative overflow-hidden ${isPending ? "pointer-events-none opacity-80" : ""}`}
    >
      {children}
      {isPending ? <LoadingVeil label="Loading listings..." /> : null}
    </Link>
  );
}

export function PendingSubmitButton({
  children,
  className
}: {
  children: ReactNode;
  className: string;
}) {
  const [isPending, setIsPending] = useState(false);
  const currentUrl = useCurrentRelativeUrl();

  useEffect(() => {
    setIsPending(false);
  }, [currentUrl]);

  useEffect(() => {
    if (!isPending) return;

    const timeout = window.setTimeout(() => setIsPending(false), PENDING_FALLBACK_MS);
    return () => window.clearTimeout(timeout);
  }, [isPending]);

  return (
    <button
      type="submit"
      onClick={() => setIsPending(true)}
      aria-busy={isPending}
      className={className}
    >
      {isPending ? (
        <span className="inline-flex items-center gap-2">
          <Spinner />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export function BrowserBackButton({
  children,
  className
}: {
  children: ReactNode;
  className: string;
}) {
  const router = useRouter();

  return (
    <button type="button" onClick={() => router.back()} className={className}>
      {children}
    </button>
  );
}

function LoadingVeil({ label }: { label: string }) {
  return (
    <span className="absolute inset-0 z-10 flex items-center justify-center bg-white/85 text-sm font-semibold text-brand-900 backdrop-blur-[1px]">
      <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3 py-2 shadow-sm">
        <Spinner />
        {label}
      </span>
    </span>
  );
}

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-800" aria-hidden="true" />;
}

function useCurrentRelativeUrl(): string {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  return useMemo(() => `${pathname}${search ? `?${search}` : ""}`, [pathname, search]);
}

function normalizeRelativeUrl(value: string): string {
  try {
    const url = new URL(value, "https://homescope.local");
    return `${url.pathname}${url.search}`;
  } catch {
    return value;
  }
}
