"use client";

import Link from "next/link";
import { useState, type MouseEvent, type ReactNode } from "react";

interface PendingSchoolLinkProps {
  href: string;
  className: string;
  children: ReactNode;
}

export function PendingSchoolLink({ href, className, children }: PendingSchoolLinkProps) {
  const [isPending, setIsPending] = useState(false);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
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

  return (
    <button
      type="submit"
      onClick={() => setIsPending(true)}
      disabled={isPending}
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
