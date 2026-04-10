"use client";

import { useEffect, useState } from "react";

interface FavoriteButtonProps {
  listingId: string;
}

const STORAGE_KEY = "homescope-favorite-listings";

export function FavoriteButton({ listingId }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const current = getFavorites();
    setIsFavorite(current.includes(listingId));
  }, [listingId]);

  const toggle = () => {
    const current = getFavorites();
    const next = current.includes(listingId) ? current.filter((id) => id !== listingId) : [...current, listingId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setIsFavorite(next.includes(listingId));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isFavorite}
      className="rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-800 transition hover:border-brand-400"
    >
      {isFavorite ? "Saved" : "Save"}
    </button>
  );
}

function getFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string") : [];
  } catch {
    return [];
  }
}
