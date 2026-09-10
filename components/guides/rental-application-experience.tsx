"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, Download, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { SITE_CONFIG } from "@/config/site";
import { trackEvent } from "@/lib/analytics";
import { getNeighborhoodBySlug, getNeighborhoodsByCity } from "@/lib/locations/neighborhoods";
import type { PropertyType } from "@/types/listing";
import type { School } from "@/types/school";

const RENTALS_URL = "/listings?transactionType=lease&sort=newest";
const PDF_URL = "/forms/410-rental-application-ontario.pdf";
const fieldClass = "mt-1 min-h-11 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-brand-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200";
const PROPERTY_TYPES: PropertyType[] = ["Detached", "Semi-Detached", "Townhouse", "Condo Townhouse", "Condo", "Apartment", "Freehold"];
const COUNT_FILTER_OPTIONS = ["1", "1+", "2", "2+", "3", "3+", "4", "4+", "5", "5+"] as const;

interface RentalHeroProps {
  schools: School[];
}

interface RentalSearchFormState {
  city: string;
  neighborhoodSlug: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  bathrooms: string;
  propertyType: string;
  schoolSearch: string;
  schoolSlug: string;
  schoolRadiusKm: string;
}

export function RentalHero({ schools }: RentalHeroProps) {
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
      <RentalSearchForm schools={schools} />
    </section>
  );
}

function RentalSearchForm({ schools }: { schools: School[] }) {
  const router = useRouter();
  const [form, setForm] = useState<RentalSearchFormState>({
    city: "",
    neighborhoodSlug: "",
    minPrice: "",
    maxPrice: "",
    bedrooms: "",
    bathrooms: "",
    propertyType: "",
    schoolSearch: "",
    schoolSlug: "",
    schoolRadiusKm: "3"
  });
  const [error, setError] = useState("");
  const neighborhoodOptions = useMemo(() => (form.city ? getNeighborhoodsByCity(form.city) : []), [form.city]);
  const citySchools = useMemo(() => filterSchoolsByCity(schools, form.city), [form.city, schools]);
  const schoolOptions = useMemo(() => citySchools.map((school) => ({ school, label: formatSchoolOptionLabel(school) })), [citySchools]);

  const updateForm = <K extends keyof RentalSearchFormState>(key: K, value: RentalSearchFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleCityChange = (city: string) => {
    setForm((current) => {
      const selectedSchool = schools.find((school) => school.slug === current.schoolSlug);
      const keepSchool = selectedSchool ? schoolMatchesCity(selectedSchool, city) : false;
      const keepNeighborhood = Boolean(getNeighborhoodBySlug(city, current.neighborhoodSlug));

      return {
        ...current,
        city,
        neighborhoodSlug: keepNeighborhood ? current.neighborhoodSlug : "",
        schoolSearch: keepSchool ? current.schoolSearch : "",
        schoolSlug: keepSchool ? current.schoolSlug : ""
      };
    });
  };

  const handleSchoolSearchChange = (value: string) => {
    updateForm("schoolSearch", value);
    updateForm("schoolSlug", resolveSchoolSlug(citySchools, value));
  };

  const clearSchool = () => {
    updateForm("schoolSearch", "");
    updateForm("schoolSlug", "");
  };

  const submitSearch = () => {
    setError("");

    const minPrice = form.minPrice ? Number(form.minPrice) : 0;
    const maxPrice = form.maxPrice ? Number(form.maxPrice) : undefined;
    if (maxPrice != null && minPrice > maxPrice) {
      setError("Minimum rent cannot be higher than maximum rent.");
      return;
    }

    const params = new URLSearchParams({
      transactionType: "lease",
      sort: form.schoolSlug ? "distance" : "newest",
      minPrice: String(minPrice)
    });

    if (form.city) params.set("city", form.city);
    if (form.neighborhoodSlug) params.set("neighborhoodSlug", form.neighborhoodSlug);
    if (form.maxPrice) params.set("maxPrice", form.maxPrice);
    if (form.bedrooms) params.set("bedrooms", form.bedrooms);
    if (form.bathrooms) params.set("bathrooms", form.bathrooms);
    if (form.propertyType) params.set("propertyType", form.propertyType);
    if (form.schoolSlug) {
      params.set("schoolSlug", form.schoolSlug);
      params.set("schoolRadiusKm", form.schoolRadiusKm);
    }

    trackEvent("rental_alert_started", {
      city: form.city || "All GTA",
      has_school: Boolean(form.schoolSlug),
      has_neighborhood: Boolean(form.neighborhoodSlug)
    });
    router.push(`/listings?${params.toString()}`);
  };

  return (
    <div id="rental-alert" className="scroll-mt-28 rounded-[2rem] bg-brand-900 p-6 text-white shadow-soft sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-200">Looking for a rental?</p>
      <h2 className="mt-2 font-heading text-3xl">Let new GTA rentals come to you</h2>
      <p className="mt-3 leading-7 text-brand-100">Choose your criteria, review matching rentals, then save the search as an alert from the results page.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <AlertField label="Preferred city">
          <select className={fieldClass} value={form.city} onChange={(event) => handleCityChange(event.target.value)}>
            <option value="">All GTA</option>
            {SITE_CONFIG.primaryMarkets.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </AlertField>
        <AlertField label="Neighbourhood">
          <select className={fieldClass} value={form.neighborhoodSlug} onChange={(event) => updateForm("neighborhoodSlug", event.target.value)} disabled={!form.city || neighborhoodOptions.length === 0}>
            <option value="">{form.city ? "All neighbourhoods" : "Choose a city first"}</option>
            {neighborhoodOptions.map((neighborhood) => (
              <option key={neighborhood.slug} value={neighborhood.slug}>{neighborhood.name}</option>
            ))}
          </select>
        </AlertField>
        <AlertField label="Minimum monthly rent">
          <input className={fieldClass} type="number" min="0" step="100" inputMode="numeric" value={form.minPrice} onChange={(event) => updateForm("minPrice", event.target.value)} placeholder="0" />
        </AlertField>
        <AlertField label="Maximum monthly rent">
          <input className={fieldClass} type="number" min="0" step="100" inputMode="numeric" value={form.maxPrice} onChange={(event) => updateForm("maxPrice", event.target.value)} placeholder="e.g. 3600" />
        </AlertField>
        <AlertField label="Bedrooms">
          <select className={fieldClass} value={form.bedrooms} onChange={(event) => updateForm("bedrooms", event.target.value)}>
            <option value="">Any</option>
            {COUNT_FILTER_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </AlertField>
        <AlertField label="Bathrooms">
          <select className={fieldClass} value={form.bathrooms} onChange={(event) => updateForm("bathrooms", event.target.value)}>
            <option value="">Any</option>
            {COUNT_FILTER_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </AlertField>
        <AlertField label="Property type">
          <select className={fieldClass} value={form.propertyType} onChange={(event) => updateForm("propertyType", event.target.value)}>
            <option value="">All Types</option>
            {PROPERTY_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </AlertField>
        <AlertField label="School radius">
          <select className={fieldClass} value={form.schoolRadiusKm} onChange={(event) => updateForm("schoolRadiusKm", event.target.value)}>
            <option value="1">1 km</option>
            <option value="3">3 km</option>
            <option value="5">5 km</option>
            <option value="10">10 km</option>
          </select>
        </AlertField>
      </div>
      <div className="mt-4">
        <AlertField label="School">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input className={fieldClass} type="text" list="rental-school-options" value={form.schoolSearch} onChange={(event) => handleSchoolSearchChange(event.target.value)} placeholder="Type a school name, board, or city" />
            {(form.schoolSearch || form.schoolSlug) ? (
              <button type="button" onClick={clearSchool} className="mt-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/25 px-3 text-sm font-semibold text-white transition hover:bg-white/10">
                <X className="h-4 w-4" />
                Clear
              </button>
            ) : null}
          </div>
          <datalist id="rental-school-options">
            {schoolOptions.map(({ school, label }) => <option key={school.id} value={label} />)}
          </datalist>
        </AlertField>
      </div>
      <button type="button" onClick={submitSearch} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-brand-900 transition hover:bg-brand-50">
        <Search className="h-5 w-5" />
        Show Matching Rentals
      </button>
      {error ? <p role="alert" className="mt-4 rounded-lg bg-red-100 p-3 text-sm font-semibold text-red-900">{error}</p> : null}
      <p className="mt-4 flex items-center gap-2 text-sm text-brand-200"><Bell className="h-4 w-4" /> On the results page, use Save Search + Alerts after you see matching rentals.</p>
    </div>
  );
}

function AlertField({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold text-brand-100">{label}{children}</label>; }

function formatSchoolOptionLabel(school: School): string {
  return `${school.name} - ${school.municipality} - ${school.board} (${school.level})`;
}

function filterSchoolsByCity(schools: School[], city: string): School[] {
  const normalizedCity = city.trim().toLowerCase();
  if (!normalizedCity) return schools;

  return schools.filter((school) => school.municipality.trim().toLowerCase() === normalizedCity);
}

function schoolMatchesCity(school: School, city: string): boolean {
  const normalizedCity = city.trim().toLowerCase();
  if (!normalizedCity) return true;
  return school.municipality.trim().toLowerCase() === normalizedCity;
}

function resolveSchoolSlug(schools: School[], value: string): string {
  const query = value.trim().toLowerCase();
  if (!query) return "";

  const exactLabelMatch = schools.find((school) => formatSchoolOptionLabel(school).toLowerCase() === query);
  if (exactLabelMatch) return exactLabelMatch.slug;

  const exactNameMatches = schools.filter((school) => school.name.trim().toLowerCase() === query);
  if (exactNameMatches.length === 1) return exactNameMatches[0]!.slug;

  const startsWithNameMatches = schools.filter((school) => school.name.trim().toLowerCase().startsWith(query));
  if (startsWithNameMatches.length === 1) return startsWithNameMatches[0]!.slug;

  const includesNameMatches = schools.filter((school) => school.name.trim().toLowerCase().includes(query));
  if (includesNameMatches.length === 1) return includesNameMatches[0]!.slug;

  return "";
}

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
