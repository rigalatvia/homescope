import Link from "next/link";
import { getSavedSearchUnsubscribePreview } from "@/lib/searches/unsubscribe";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Unsubscribe From Listing Alerts | HomeScope GTA",
  robots: {
    index: false,
    follow: false
  }
};

interface SavedSearchUnsubscribePageProps {
  searchParams?: {
    search?: string;
    token?: string;
    status?: string;
  };
}

export default async function SavedSearchUnsubscribePage({ searchParams }: SavedSearchUnsubscribePageProps) {
  const searchId = searchParams?.search || "";
  const token = searchParams?.token || "";
  const status = searchParams?.status || "";

  if (status === "paused" || status === "already-paused") {
    return (
      <UnsubscribeShell
        title="Listing alerts paused"
        message={
          status === "already-paused"
            ? "Email alerts for this saved search were already paused."
            : "Email alerts for this saved search have been paused."
        }
      />
    );
  }

  if (status === "error") {
    return (
      <UnsubscribeShell
        title="We could not pause this alert"
        message="This unsubscribe link could not be confirmed. Please contact HomeScope GTA and we will help."
        isError
      />
    );
  }

  try {
    const preview = await getSavedSearchUnsubscribePreview({ searchId, token });

    if (!preview.alertsEnabled) {
      return (
        <UnsubscribeShell
          title="Listing alerts already paused"
          message={`Email alerts for "${preview.label}" are already paused.`}
        />
      );
    }

    return (
      <main className="min-h-screen bg-[#f7fbfb] px-6 py-20 text-[#073044]">
        <section className="mx-auto max-w-xl rounded-[24px] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,76,92,0.12)]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#0f4c5c]">HomeScope GTA</p>
          <h1 className="font-serif text-3xl text-[#102a43]">Pause listing alerts?</h1>
          <p className="mt-4 text-base leading-7 text-slate-700">
            Please confirm that you want to stop email alerts for <strong>{preview.label}</strong>. Your saved search
            will stay in your dashboard.
          </p>
          <form action="/saved-searches/unsubscribe/confirm" method="post" className="mt-8 flex flex-wrap gap-3">
            <input type="hidden" name="search" value={searchId} />
            <input type="hidden" name="token" value={token} />
            <button type="submit" className="inline-flex rounded-full bg-[#243f46] px-5 py-3 text-sm font-semibold text-white">
              Yes, pause alerts
            </button>
            <Link
              href="/"
              className="inline-flex rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-[#243f46]"
            >
              Keep alerts on
            </Link>
          </form>
        </section>
      </main>
    );
  } catch (error) {
    return (
      <UnsubscribeShell
        title="We could not pause this alert"
        message={error instanceof Error ? error.message : "Please contact HomeScope GTA and we will help."}
        isError
      />
    );
  }
}

function UnsubscribeShell({ title, message, isError = false }: { title: string; message: string; isError?: boolean }) {
  return (
    <main className="min-h-screen bg-[#f7fbfb] px-6 py-20 text-[#073044]">
      <section className="mx-auto max-w-xl rounded-[24px] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,76,92,0.12)]">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#0f4c5c]">HomeScope GTA</p>
        <h1 className="font-serif text-3xl text-[#102a43]">{title}</h1>
        <p className={`mt-4 text-base leading-7 ${isError ? "text-red-700" : "text-slate-700"}`}>{message}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="inline-flex rounded-full bg-[#243f46] px-5 py-3 text-sm font-semibold text-white">
            Back to HomeScope GTA
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-[#243f46]"
          >
            Manage alerts
          </Link>
        </div>
      </section>
    </main>
  );
}
