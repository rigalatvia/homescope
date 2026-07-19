import Link from "next/link";
import { unsubscribeCrmContactFromEmailLink } from "@/lib/crm/contacts-store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Unsubscribe | HomeScope GTA",
  robots: {
    index: false,
    follow: false
  }
};

interface CrmUnsubscribePageProps {
  searchParams?: {
    contact?: string;
    token?: string;
  };
}

export default async function CrmUnsubscribePage({ searchParams }: CrmUnsubscribePageProps) {
  const contactId = searchParams?.contact || "";
  const token = searchParams?.token || "";

  let title = "You have been unsubscribed";
  let message = "You will no longer receive Yan Ginzburg birthday or holiday CRM emails.";
  let isError = false;

  try {
    const result = await unsubscribeCrmContactFromEmailLink({ contactId, token });
    message = result.alreadyUnsubscribed
      ? `${result.email} was already unsubscribed from Yan Ginzburg birthday and holiday CRM emails.`
      : `${result.email} has been unsubscribed from Yan Ginzburg birthday and holiday CRM emails.`;
  } catch (error) {
    title = "We could not unsubscribe this contact";
    message = error instanceof Error ? error.message : "Please contact HomeScope GTA and we will help.";
    isError = true;
  }

  return (
    <main className="min-h-screen bg-[#f7fbfb] px-6 py-20 text-[#073044]">
      <section className="mx-auto max-w-xl rounded-[24px] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,76,92,0.12)]">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#0f4c5c]">HomeScope GTA</p>
        <h1 className="font-serif text-3xl text-[#102a43]">{title}</h1>
        <p className={`mt-4 text-base leading-7 ${isError ? "text-red-700" : "text-slate-700"}`}>{message}</p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full bg-[#243f46] px-5 py-3 text-sm font-semibold text-white"
        >
          Back to HomeScope GTA
        </Link>
      </section>
    </main>
  );
}
