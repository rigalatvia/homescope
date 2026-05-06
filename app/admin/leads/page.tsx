import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { getAdminLeads } from "@/lib/admin/queries";
import type { LeadStatus, LeadSubmissionRecord } from "@/types/lead";

export const metadata: Metadata = {
  title: "Admin Leads",
  description: "View leads and manage showing request statuses.",
  robots: {
    index: false,
    follow: false
  }
};

async function updateShowingStatus(formData: FormData) {
  "use server";

  const leadId = String(formData.get("leadId") || "").trim();
  const nextStatus = String(formData.get("status") || "").trim() as LeadStatus;

  if (!leadId || !["pending", "confirmed"].includes(nextStatus)) {
    return;
  }

  const firestore = getFirebaseAdminFirestore();
  const docRef = firestore.collection("leads").doc(leadId);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    return;
  }

  const lead = snapshot.data() as Partial<LeadSubmissionRecord>;
  const intent = String(lead.intent ?? "");
  const isShowing = lead.formType === "showing" || intent === "showing" || intent === "showing_request";

  if (!isShowing) {
    return;
  }

  await docRef.set(
    {
      status: nextStatus,
      statusUpdatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  revalidatePath("/admin/leads");
}

export default async function AdminLeadsPage() {
  const leads = await getAdminLeads();
  const showingLeads = leads.filter(isShowingLead);
  const confirmedShowings = showingLeads.filter((lead) => normalizeLeadStatus(lead) === "confirmed");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl text-brand-900">Leads &amp; Showings</h1>
            <p className="mt-2 text-sm text-brand-700">
              Review incoming leads and manage private showing request statuses in one place.
            </p>
          </div>
          <p className="text-sm text-brand-700">{leads.length} records</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="All Leads" value={leads.length} />
          <MetricCard label="Showing Requests" value={showingLeads.length} />
          <MetricCard label="Confirmed Showings" value={confirmedShowings.length} />
        </div>
      </div>

      {leads.length === 0 ? (
        <p className="rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700 shadow-soft">
          No leads yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-soft">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-brand-50 text-brand-800">
              <tr>
                <th className="px-3 py-3 font-semibold">Date</th>
                <th className="px-3 py-3 font-semibold">Type</th>
                <th className="px-3 py-3 font-semibold">Name</th>
                <th className="px-3 py-3 font-semibold">Contact</th>
                <th className="px-3 py-3 font-semibold">Property</th>
                <th className="px-3 py-3 font-semibold">Preferred Date/Time</th>
                <th className="px-3 py-3 font-semibold">Showing Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const showingLead = isShowingLead(lead);
                const status = normalizeLeadStatus(lead);

                return (
                  <tr key={lead.id} className="border-t border-brand-100 align-top">
                    <td className="px-3 py-3 text-brand-700">{formatLeadDate(lead.createdAt)}</td>
                    <td className="px-3 py-3">
                      <TypeBadge isShowing={showingLead} />
                    </td>
                    <td className="px-3 py-3 text-brand-900">
                      <div className="space-y-1">
                        <p className="font-semibold">{lead.fullName || "-"}</p>
                        {lead.userName && lead.userName !== lead.fullName ? (
                          <p className="text-xs text-brand-600">Signed in as {lead.userName}</p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-brand-700">
                      <div className="space-y-1">
                        <p>{lead.email || lead.userEmail || "-"}</p>
                        <p>{lead.phone || "-"}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-brand-700">
                      <div className="space-y-1">
                        <p className="font-medium text-brand-900">{lead.listingAddress || "-"}</p>
                        <p>{lead.listingCity || "-"}</p>
                        <p className="text-xs text-brand-600">MLS: {lead.listingMlsNumber || "-"}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-brand-700">{formatLeadDate(lead.preferredDateTime)}</td>
                    <td className="px-3 py-3">
                      {showingLead ? (
                        <form action={updateShowingStatus} className="flex min-w-[200px] flex-col gap-2">
                          <input type="hidden" name="leadId" value={lead.id} />
                          <StatusBadge status={status} />
                          <div className="flex items-center gap-2">
                            <select
                              name="status"
                              defaultValue={status}
                              className="rounded-full border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                            </select>
                            <button
                              type="submit"
                              className="rounded-full bg-brand-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-800"
                            >
                              Update
                            </button>
                          </div>
                        </form>
                      ) : (
                        <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                          General lead
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function isShowingLead(lead: LeadSubmissionRecord): boolean {
  const intent = String(lead.intent ?? "");
  return lead.formType === "showing" || intent === "showing" || intent === "showing_request";
}

function normalizeLeadStatus(lead: LeadSubmissionRecord): LeadStatus {
  return lead.status === "confirmed" ? "confirmed" : "pending";
}

function formatLeadDate(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
      <p className="text-sm font-semibold text-brand-700">{label}</p>
      <p className="mt-1 font-heading text-3xl text-brand-900">{value.toLocaleString()}</p>
    </div>
  );
}

function TypeBadge({ isShowing }: { isShowing: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        isShowing ? "bg-brand-900 text-white" : "bg-brand-100 text-brand-700"
      }`}
    >
      {isShowing ? "Showing" : "Lead"}
    </span>
  );
}

function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
        status === "confirmed" ? "bg-emerald-100 text-emerald-800" : "bg-brand-100 text-brand-700"
      }`}
    >
      {status === "confirmed" ? "Confirmed" : "Pending"}
    </span>
  );
}
