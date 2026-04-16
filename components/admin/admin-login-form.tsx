"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AdminLoginFormProps {
  nextPath: string;
  initialError: string | null;
}

export function AdminLoginForm({ nextPath, initialError }: AdminLoginFormProps) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, next: nextPath })
      });

      const payload = (await response.json()) as { error?: string; redirectTo?: string };
      if (!response.ok) {
        setError(payload.error || "Unable to sign in.");
        return;
      }

      router.replace(payload.redirectTo || "/admin");
      router.refresh();
    } catch {
      setError("Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <label className="block text-sm font-semibold text-brand-900" htmlFor="adminToken">
        MLS Sync Admin Token
      </label>
      <input
        id="adminToken"
        type="password"
        value={token}
        onChange={(event) => setToken(event.target.value)}
        required
        className="w-full rounded-xl border border-brand-200 px-4 py-3 text-sm text-brand-900 outline-none ring-brand-500 focus:ring-2"
        placeholder="Enter token"
        autoComplete="off"
      />

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Signing in..." : "Access Dashboard"}
      </button>
    </form>
  );
}
