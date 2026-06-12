"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackToListingsButton() {
  const router = useRouter();

  const handleClick = () => {
    router.back();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-800 shadow-sm transition hover:border-brand-300 hover:bg-brand-50"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to listings
    </button>
  );
}
