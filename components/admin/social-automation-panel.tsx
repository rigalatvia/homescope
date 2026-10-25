"use client";
import { useCallback, useEffect, useState } from "react";
/* eslint-disable @next/next/no-img-element -- Preview the exact generated JPEGs without image transformation. */
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, Clock3, ExternalLink, RefreshCw, Settings2, X } from "lucide-react";
import type { SocialCampaign, SocialSettings, Platform } from "@/lib/social/types";
interface Overview {
    settings: SocialSettings;
    campaigns: SocialCampaign[];
    nextCursor: string | null;
    counts: Record<string, number>;
    liveEnvironmentEnabled: boolean;
}
const button = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40";
const field = "mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-brand-900";
const labels: Record<string, string> = { discovered: "Eligible campaigns", queued: "In the queue", scheduled: "Scheduled", instagram: "Instagram published", facebook: "Facebook published", failed: "Needs attention" };
function date(value: string | null) { return value ? new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Not scheduled"; }
function Status({ value }: {
    value: string;
}) { return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${value === "published" ? "bg-emerald-50 text-emerald-800" : value === "failed" || value === "uncertain" ? "bg-amber-50 text-amber-900" : "bg-slate-100 text-slate-600"}`}>{value}</span>; }
export function SocialAutomationPanel() {
    const [data, setData] = useState<Overview | null>(null), [error, setError] = useState(""), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
    const [settings, setSettings] = useState<SocialSettings | null>(null), [showSettings, setShowSettings] = useState(false), [listingId, setListingId] = useState("");
    const [selected, setSelected] = useState<SocialCampaign | null>(null), [slide, setSlide] = useState(0), [tab, setTab] = useState<"carousel" | Platform>("carousel"), [caption, setCaption] = useState("");
    const [health, setHealth] = useState<{
        ok: boolean;
        pageId: string;
        pageName: string;
        instagramId: string;
        username: string;
        missingScopes: string[];
        expiresAt: string | null;
        checkedAt: string;
    } | null>(null);
    const load = useCallback(async (before?: string) => {
        const response = await fetch(`/api/admin/social${before ? `?before=${encodeURIComponent(before)}` : ""}`, { cache: "no-store" });
        const result = await response.json();
        if (!response.ok)
            throw new Error(result.error || "Unable to load social campaigns.");
        setData(current => before && current ? { ...result, campaigns: [...current.campaigns, ...result.campaigns] } : result);
        setSettings(result.settings);
        return result as Overview;
    }, []);
    useEffect(() => { void load().catch(e => setError(e.message)); }, [load]);
    async function act(payload: Record<string, unknown>) {
        setBusy(true);
        setError("");
        setMessage("");
        try {
            const response = await fetch("/api/admin/social", { method: "POST", headers: { "Content-Type": "application/json", "x-social-admin": "1" }, body: JSON.stringify(payload) });
            const result = await response.json();
            if (!response.ok)
                throw new Error(result.error || "Action failed.");
            if (payload.action === "health")
                setHealth(result);
            const fresh = await load();
            if (selected) {
                const updated = fresh.campaigns.find(c => c.id === selected.id);
                if (updated)
                    setSelected(updated);
            }
            setMessage(payload.action === "dryRun" ? "Dry run generated. Open the campaign to inspect every slide and caption." : payload.action === "publishNow" ? "Publishing started. The worker will publish as soon as the media is ready." : "Changes saved.");
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "Action failed.");
        }
        finally {
            setBusy(false);
        }
    }
    function open(c: SocialCampaign, view: "carousel" | Platform = "carousel") { setSelected(c); setSlide(0); setTab(view); if (view !== "carousel")
        setCaption(c[view].caption); }
    return <div className="space-y-6">
    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white sm:p-9">
      <div className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[.25em] text-amber-200">HomeScope GTA · Marketing studio</p><h1 className="mt-3 font-heading text-3xl sm:text-4xl">Social Media Automation</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">New RE/MAX METROPOLIS REALTY listings, thoughtfully presented. One property campaign. Two connected accounts.</p></div><span className={`rounded-full px-4 py-2 text-sm font-semibold ${data?.settings.enabled ? "bg-emerald-900 text-emerald-100" : "bg-white/10 text-amber-100"}`}>{data?.settings.enabled ? "Automation on" : "Automation off"}</span></div>
      <div className="mt-6 flex flex-wrap gap-3"><button disabled={busy} className={button} onClick={() => setShowSettings(!showSettings)}><Settings2 size={16}/>Settings & connections</button><button disabled={busy} className={button} onClick={() => act({ action: "process" })}><RefreshCw size={16}/>Run next queue step</button><button disabled={busy} className={button} onClick={() => { setError(""); void load().catch(e => setError(e.message)); }}>Refresh</button></div>
      <p className="mt-4 text-xs text-slate-400">America/Toronto · JUST LISTED campaigns · Live posting requires activation and a configured scheduler.</p>
    </header>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</p>}
    {message && settings?.notifications === "dashboard" && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{message}</p>}
    {busy && <p role="status" className="text-sm text-brand-700">Working… image generation can take a few minutes. Please keep this page open.</p>}
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">{Object.entries(labels).map(([key, label]) => <div key={key} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-soft"><p className="text-xs text-brand-600">{label}</p><p className="mt-3 text-3xl font-semibold text-brand-900">{data?.counts[key] ?? "—"}</p></div>)}</div>
    {showSettings && settings && <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-soft"><h2 className="text-xl font-semibold text-brand-900">Publishing settings</h2><p className="mt-2 text-sm text-brand-600">Brokerage selection: RE/MAX METROPOLIS REALTY · Template: Navy editorial · Branding: Yan Ginzburg, 416-577-0691</p>
      <p className="mt-5 text-sm text-brand-800">Publish every new eligible property as soon as its carousel is ready. No daily cap, spacing delay, or publishing-hours restriction.</p>
      <div className="mt-4 flex flex-wrap items-end gap-4"><label className="text-sm text-brand-800">Notifications<select className={field} value={settings.notifications} onChange={e => setSettings({ ...settings, notifications: e.target.value as SocialSettings['notifications'] })}><option value="failures">Dashboard failure notices</option><option value="dashboard">All dashboard status updates</option></select></label><button className={button} disabled={busy} onClick={() => act({ action: "settings", settings: { notifications: settings.notifications } })}>Save preferences</button><button className={button} disabled={busy} onClick={() => act({ action: "health" })}>Check Meta connections</button><button className={`${button} border-amber-400`} disabled={busy} onClick={() => act({ action: "settings", settings: { enabled: !data?.settings.enabled } })}>{data?.settings.enabled ? "Turn automation off" : "Enable automatic publishing"}</button></div>
      <div className="mt-5 rounded-xl bg-brand-50 p-4 text-sm leading-7 text-brand-800"><p>Server live switch: {data?.liveEnvironmentEnabled ? "enabled" : "off"} · Last successful dry run: {date(settings.dryRunPassedAt)}</p><p>Activation watermark: {date(settings.activatedAt)} · Existing-listing baseline: {settings.baselineComplete ? "complete" : "not yet complete"}</p><p>Credentials are configured on the server and are never shown here. Automatic publishing remains off until a dry run and connection check succeed.</p></div>
      {health && <div className="mt-4 rounded-xl border border-brand-200 p-4 text-sm"><p className="font-semibold">{health.ok ? "Connections verified" : "Connection requires attention"}</p><p>Facebook: {health.pageName} ({health.pageId})</p><p>Instagram: @{health.username} ({health.instagramId})</p><p>Token expiry: {health.expiresAt ? date(health.expiresAt) : "No scheduled expiry returned"}</p>{health.missingScopes.length > 0 && <p>Missing permissions: {health.missingScopes.join(", ")}</p>}<p>Checked {date(health.checkedAt)}</p></div>}
    </section>}
    <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-soft"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-lg font-semibold text-brand-900">Create a dry-run preview</h2><p className="mt-1 text-sm text-brand-600">Use an existing eligible listing. This generates actual assets and captions without publishing to Meta.</p></div><div className="flex w-full gap-2 sm:w-auto"><input aria-label="Listing ID" placeholder="Listing ID (source:key)" value={listingId} onChange={e => setListingId(e.target.value)} className={`${field} !mt-0 sm:w-72`}/><button className={button} disabled={busy || !listingId.trim()} onClick={() => act({ action: "dryRun", listingId: listingId.trim() })}><Camera size={16}/>Generate</button></div></div></section>
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{data?.campaigns.filter(c => c.state !== "skipped").map(c => <article key={c.id} className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-soft">
      <div className="relative aspect-[16/9] bg-slate-100">{c.assets[0] || c.property.photo ? <img src={c.assets[0] || c.property.photo!} alt={`Property in ${c.property.city}`} className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center text-brand-400"><Camera size={36}/></div>}<div className="absolute left-3 top-3"><Status value={c.dryRun ? "dry run" : c.state}/></div></div>
      <div className="space-y-4 p-5"><div><p className="text-xs font-semibold uppercase tracking-wider text-brand-500">{c.property.city} · MLS {c.mlsNumber}</p><h3 className="mt-2 text-xl font-semibold text-brand-900">{c.property.price == null ? "Explore property" : new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(c.property.price)}</h3><p className="mt-1 text-sm text-brand-700">{c.property.address}</p><p className="mt-1 text-xs text-brand-500">{c.property.brokerage}</p></div>
      <p className="flex items-center gap-2 text-xs text-brand-600"><Clock3 size={14}/>{date(c.scheduledAt)}</p><div className="flex flex-wrap gap-3 text-xs"><span className="flex items-center gap-1"><Camera size={14}/><Status value={c.instagram.status}/></span><span>Facebook <Status value={c.facebook.status}/></span></div>
      {(c.lastError || c.instagram.lastError || c.facebook.lastError) && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">{c.lastError || c.instagram.lastError || c.facebook.lastError}</p>}
      <div className="flex flex-wrap gap-2"><button className={button} disabled={!c.assets.length} onClick={() => open(c)}>Preview carousel</button><button className={button} onClick={() => open(c, "instagram")}>Instagram caption</button><button className={button} onClick={() => open(c, "facebook")}>Facebook caption</button><button className={button} disabled={busy || !!c.instagram.submittedAt || !!c.facebook.submittedAt} onClick={() => act({ action: "regenerate", id: c.id })}>Regenerate</button><button className={button} disabled={busy || !data.settings.enabled || !["ready", "scheduled"].includes(c.state)} onClick={() => act({ action: "publishNow", id: c.id })}>Publish now</button><button className={button} disabled={busy || ["published", "cancelled"].includes(c.state)} onClick={() => act({ action: "cancel", id: c.id })}>Cancel scheduled post</button></div>
      {(["instagram", "facebook"] as const).map(p => <div key={p} className="flex flex-wrap gap-2">{c[p].status === "failed" && <button className={button} disabled={busy} onClick={() => act({ action: "retry", id: c.id, platform: p })}>Retry {p} only</button>}{c[p].status === "uncertain" && <button className={button} disabled={busy} onClick={() => act({ action: "reconcile", id: c.id, platform: p })}>Reconcile {p}</button>}<span className="text-xs text-brand-600">First comment: {c[p].firstComment?.status || "pending"}</span>{c[p].firstComment?.lastError && <p className="text-xs text-amber-800">{c[p].firstComment?.lastError}</p>}{c[p].firstComment?.status === "failed" && <button className={button} disabled={busy} onClick={() => act({ action: "retryComment", id: c.id, platform: p })}>Retry {p} comment</button>}{c[p].firstComment?.status === "uncertain" && <button className={button} disabled={busy} onClick={() => act({ action: "reconcileComment", id: c.id, platform: p })}>Reconcile {p} comment</button>}{c[p].permalink && <a className={button} href={c[p].permalink!} target="_blank" rel="noreferrer"><CheckCircle2 size={14}/>View {p}<ExternalLink size={13}/></a>}</div>)}
      </div></article>)}</div>
    {data && !data.campaigns.some(c => c.state !== "skipped") && <div className="rounded-2xl border border-dashed border-brand-200 p-12 text-center text-brand-600"><Camera className="mx-auto mb-4"/><h2 className="font-semibold text-brand-900">Your next campaign starts here</h2><p className="mt-2 text-sm">Generate a dry run, connect your accounts, then enable automation for new brokerage listings.</p></div>}
    {data?.nextCursor && <button className={button} disabled={busy} onClick={() => void load(data.nextCursor!).catch(e => setError(e.message))}>Load older campaigns</button>}
    {selected && <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/80 p-3 sm:p-8" role="dialog" aria-modal="true" aria-label="Campaign preview"><div className="mx-auto max-w-3xl rounded-2xl bg-white p-4 sm:p-6"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold text-brand-900">MLS {selected.mlsNumber} · Preview</h2><button aria-label="Close preview" className={button} onClick={() => setSelected(null)}><X size={18}/></button></div><div className="my-4 flex flex-wrap gap-2">{(["carousel", "instagram", "facebook"] as const).map(view => <button key={view} className={`${button} ${tab === view ? "!bg-brand-900 !text-white" : ""}`} onClick={() => { setTab(view); if (view !== "carousel")
            setCaption(selected[view].caption); }}>{view}</button>)}</div>
      {tab === "carousel" ? <><div className="mx-auto aspect-[4/5] max-h-[70vh] overflow-hidden rounded-xl bg-slate-100">{selected.assets[slide] ? <img src={selected.assets[slide]} alt={`Carousel slide ${slide + 1}`} className="h-full w-full object-contain"/> : <p className="p-8 text-center">Generate the carousel to preview its slides.</p>}</div><div className="mt-4 flex items-center justify-center gap-5"><button aria-label="Previous slide" className={button} disabled={slide === 0} onClick={() => setSlide(slide - 1)}><ArrowLeft size={18}/></button><span className="text-sm text-brand-600">{slide + 1} of {selected.assets.length}</span><button aria-label="Next slide" className={button} disabled={slide >= selected.assets.length - 1} onClick={() => setSlide(slide + 1)}><ArrowRight size={18}/></button></div></> : <><label className="text-sm font-semibold text-brand-800">{tab} caption<textarea className={`${field} min-h-[420px] font-normal leading-7`} value={caption} onChange={e => setCaption(e.target.value)} readOnly={!!selected[tab].submittedAt || selected[tab].mediaIds.length > 0}/></label><div className="mt-4 rounded-lg bg-brand-50 p-4 text-sm"><p className="font-semibold">First comment</p><p className="mt-2">Explore this property on HomeScope GTA:</p><a className="break-all underline" href={selected.property.url} target="_blank" rel="noreferrer">{selected.property.url}</a><p className="mt-2 text-xs">Posted immediately after the carousel. Instagram comment links may require copying into a browser.</p></div><button className={`${button} mt-4`} disabled={busy || !!selected[tab].submittedAt || selected[tab].mediaIds.length > 0} onClick={() => act({ action: "caption", id: selected.id, platform: tab, caption })}>Save caption</button></>}
    </div></div>}
  </div>;
}
