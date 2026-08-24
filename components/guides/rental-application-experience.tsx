"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, Download, Loader2 } from "lucide-react";
import { SignInButton } from "@/components/auth/SignInButton";
import { useAuth } from "@/hooks/useAuth";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import { trackEvent } from "@/lib/analytics";
import type { SavedSearchAlertFrequency } from "@/lib/savedSearches";

const RENTALS_URL = "/listings?transactionType=lease&sort=newest";
const PDF_URL = "/forms/410-rental-application-ontario.pdf";
const fieldClass = "mt-1 min-h-11 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-brand-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

export function RentalHero() {
  const [downloaded, setDownloaded] = useState(false);

  return (
    <section className="grid gap-6 lg:grid-cols-[1.08fr_.92fr] lg:items-start">
      <div className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-9">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Ontario Rental Resource</p>
        <h1 className="mt-3 font-heading text-4xl leading-tight text-brand-900 sm:text-5xl">Ontario Rental Application Form 410 PDF</h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-brand-700 sm:text-lg">Download the Ontario rental application form, review the information commonly requested by landlords and prepare your supporting documents before you apply.</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <a href={PDF_URL} download onClick={() => { setDownloaded(true); trackEvent("form410_download", { resource_path: PDF_URL }); }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand-900 px-5 py-3 font-semibold text-white transition hover:bg-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700">
            <Download className="h-5 w-5" /> Download Form 410 PDF
          </a>
          <Link href={RENTALS_URL} className="inline-flex min-h-12 items-center justify-center rounded-lg border border-brand-300 bg-white px-5 py-3 font-semibold text-brand-900 transition hover:bg-brand-50">Search GTA Rentals</Link>
        </div>
        <p className="mt-3 text-sm font-medium text-brand-600">Instant PDF download. No email required.</p>
        {downloaded ? (
          <div role="status" aria-live="polite" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
            <p className="font-semibold">Your Form 410 download has started.</p>
            <p className="mt-1 text-sm leading-6">Looking for somewhere to use it? Create a rental alert and see new GTA rentals that match your budget.</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold">
              <a href="#rental-alert" className="underline underline-offset-4">Create a Rental Alert</a>
              <Link href={RENTALS_URL} className="underline underline-offset-4">View Current Rentals</Link>
            </div>
          </div>
        ) : null}
      </div>
      <RentalAlertForm />
    </section>
  );
}

function RentalAlertForm() {
  const { user, loading: authLoading } = useAuth();
  const { saveSearch, isPending } = useSavedSearches();
  const [form, setForm] = useState({ city: "", maxPrice: "", bedrooms: "", propertyType: "", frequency: "instant" as SavedSearchAlertFrequency });
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const createAfterSignIn = useRef(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const createAlert = async () => {
    if (!user) { createAfterSignIn.current = true; setNeedsSignIn(true); return; }
    setError("");
    const filters = { transactionType: "lease" as const, sort: "newest" as const, city: form.city || undefined, maxPrice: form.maxPrice ? Number(form.maxPrice) : undefined, bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined, bedroomsMatch: form.bedrooms ? "atLeast" as const : undefined, propertyType: form.propertyType || undefined };
    const params = new URLSearchParams({ transactionType: "lease", sort: "newest" });
    if (form.city) params.set("city", form.city);
    if (form.maxPrice) params.set("maxPrice", form.maxPrice);
    if (form.bedrooms) params.set("bedrooms", `${form.bedrooms}+`);
    if (form.propertyType) params.set("propertyType", form.propertyType);
    try {
      await saveSearch({ label: `${form.city || "GTA"} Rental Search`, path: "/listings", queryString: params.toString(), filters, resultsTotal: 0, alertsEnabled: true, alertFrequency: form.frequency });
      setNeedsSignIn(false); setStatus("Your rental search is saved and alerts are on."); trackEvent("rental_alert_created", { frequency: form.frequency });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "We could not create your alert right now."); }
  };

  useEffect(() => {
    if (user && createAfterSignIn.current) {
      createAfterSignIn.current = false;
      void createAlert();
    }
    // createAlert intentionally uses the criteria retained in this mounted form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div id="rental-alert" className="scroll-mt-28 rounded-[2rem] bg-brand-900 p-6 text-white shadow-soft sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-200">Looking for a rental?</p>
      <h2 className="mt-2 font-heading text-3xl">Let new GTA rentals come to you</h2>
      <p className="mt-3 leading-7 text-brand-100">Choose what you need once. HomeScope can notify you when a new matching rental appears.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <AlertField label="Preferred city"><select className={fieldClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}><option value="">All GTA</option>{["Toronto", "Vaughan", "Richmond Hill", "Aurora", "Newmarket", "King"].map((city) => <option key={city}>{city}</option>)}</select></AlertField>
        <AlertField label="Maximum monthly rent"><input className={fieldClass} type="number" min="0" step="100" inputMode="numeric" value={form.maxPrice} onChange={(e) => setForm({ ...form, maxPrice: e.target.value })} /></AlertField>
        <AlertField label="Bedrooms"><select className={fieldClass} value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}><option value="">Any</option>{[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}+</option>)}</select></AlertField>
        <AlertField label="Property type"><select className={fieldClass} value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })}><option value="">Any</option><option>Condo</option><option>Townhouse</option><option>Detached</option><option>Semi-Detached</option></select></AlertField>
        <AlertField label="Alert frequency"><select className={fieldClass} value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as SavedSearchAlertFrequency })}><option value="instant">Instant</option><option value="daily">Daily</option><option value="weekly">Weekly</option></select></AlertField>
      </div>
      <button type="button" disabled={authLoading || isPending()} onClick={() => { trackEvent("rental_alert_started"); void createAlert(); }} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-brand-900 transition hover:bg-brand-50 disabled:opacity-60">{isPending() ? <Loader2 className="h-5 w-5 animate-spin" /> : <Bell className="h-5 w-5" />} Create My Rental Alert</button>
      {needsSignIn ? <div className="mt-4 rounded-xl bg-white/10 p-4"><p className="text-sm">Sign in to save these criteria. Your entries will stay in this form.</p><SignInButton label="Sign in with Google" className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-900" onSuccess={() => setNeedsSignIn(false)} onError={setError} /></div> : null}
      {status ? <p role="status" className="mt-4 rounded-lg bg-emerald-100 p-3 text-sm font-semibold text-emerald-900">{status}</p> : null}
      {error ? <p role="alert" className="mt-4 rounded-lg bg-red-100 p-3 text-sm font-semibold text-red-900">{error}</p> : null}
      <p className="mt-4 text-sm text-brand-200">Save your criteria once and return whenever you are ready.</p>
    </div>
  );
}

function AlertField({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold text-brand-100">{label}{children}</label>; }

export function RentalHelpForm() {
  const [form, setForm] = useState({ fullName:"", email:"", phone:"", areas:"", budget:"", bedrooms:"", moveIn:"", pets:"Prefer not to say", message:"", website:"" });
  const [state, setState] = useState<"idle"|"submitting"|"success"|"error">("idle");
  const [message, setMessage] = useState("");
  const change = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async (e: React.FormEvent) => { e.preventDefault(); if (state === "submitting") return; setState("submitting"); setMessage(""); trackEvent("rental_help_started");
    const detail = [`Preferred area(s): ${form.areas}`, `Maximum monthly budget: ${form.budget || "Not provided"}`, `Bedrooms: ${form.bedrooms || "Not provided"}`, `Move-in date: ${form.moveIn || "Not provided"}`, `Pets: ${form.pets}`, form.message && `Message: ${form.message}`].filter(Boolean).join("\n");
    try { const response = await fetch("/api/contact", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ fullName:form.fullName,email:form.email,phone:form.phone,subject:"Rental help request from Form 410 guide",message:detail,website:form.website }) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "Could not submit your request."); setState("success"); setMessage(payload.message || "Your rental request was received."); trackEvent("rental_help_submitted"); }
    catch (cause) { setState("error"); setMessage(cause instanceof Error ? cause.message : "Could not submit your request."); }
  };
  return <form onSubmit={submit} className="mt-6 grid gap-4 rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:grid-cols-2 sm:p-8">
    <HelpField label="Full name" required><input required name="fullName" autoComplete="name" className={fieldClass} value={form.fullName} onChange={change}/></HelpField><HelpField label="Email" required><input required type="email" name="email" autoComplete="email" className={fieldClass} value={form.email} onChange={change}/></HelpField>
    <HelpField label="Phone (optional)"><input name="phone" type="tel" autoComplete="tel" className={fieldClass} value={form.phone} onChange={change}/></HelpField><HelpField label="Preferred area or areas" required><input required name="areas" className={fieldClass} value={form.areas} onChange={change}/></HelpField>
    <HelpField label="Maximum monthly budget" required><input required name="budget" type="number" min="0" step="100" className={fieldClass} value={form.budget} onChange={change}/></HelpField><HelpField label="Bedrooms" required><select required name="bedrooms" className={fieldClass} value={form.bedrooms} onChange={change}><option value="">Select</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}+</option>)}</select></HelpField>
    <HelpField label="Move-in date" required><input required name="moveIn" type="date" className={fieldClass} value={form.moveIn} onChange={change}/></HelpField><HelpField label="Pets"><select name="pets" className={fieldClass} value={form.pets} onChange={change}><option>Yes</option><option>No</option><option>Prefer not to say</option></select></HelpField>
    <div className="sm:col-span-2"><HelpField label="Message (optional)"><textarea name="message" rows={4} className={fieldClass} value={form.message} onChange={change}/></HelpField></div><input aria-hidden="true" tabIndex={-1} name="website" className="hidden" value={form.website} onChange={change}/>
    <div className="sm:col-span-2"><button disabled={state==="submitting"} className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-brand-900 px-5 py-3 font-semibold text-white disabled:opacity-60">{state==="submitting"?"Submitting…":"Help Me Find a Rental"}</button>{message ? <p role={state==="error"?"alert":"status"} className={`mt-3 rounded-lg p-3 text-sm ${state==="error"?"bg-red-50 text-red-800":"bg-emerald-50 text-emerald-900"}`}>{message}</p>:null}<p id="privacy-notice" className="mt-3 text-sm leading-6 text-brand-600">No obligation. Your information will be used to respond to your rental request and any communications you explicitly request. No optional communication consent is selected by this form.</p></div>
  </form>;
}
function HelpField({label,required,children}:{label:string;required?:boolean;children:React.ReactNode}) { return <label className="block text-sm font-semibold text-brand-800">{label}{required?<span className="text-red-600"> *</span>:null}{children}</label>; }
