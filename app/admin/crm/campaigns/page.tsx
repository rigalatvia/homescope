import type { Metadata } from "next";
import { CrmMetricCard } from "@/components/admin/crm/shared";
import { getCrmCampaignSchedulerStatus, listRecentCrmCampaignLogs } from "@/lib/crm/campaigns-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin CRM Campaigns",
  description: "Review automated birthday and holiday CRM sends.",
  robots: {
    index: false,
    follow: false
  }
};

function formatDateTime(value: string | null): string {
  if (!value) return "Not run yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function formatDate(value: string | null): string {
  if (!value) return "Not scheduled yet";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium"
  }).format(date);
}

function getStatusBadgeClass(status: "success" | "failed" | null): string {
  if (status === "success") return "bg-emerald-100 text-emerald-800";
  if (status === "failed") return "bg-red-100 text-red-700";
  return "bg-brand-100 text-brand-700";
}

export default async function AdminCrmCampaignsPage() {
  const [status, logs] = await Promise.all([getCrmCampaignSchedulerStatus(), listRecentCrmCampaignLogs(120)]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <CrmMetricCard label="Last Run Status" value={status.lastRunStatus ? status.lastRunStatus.toUpperCase() : "IDLE"} detail={formatDateTime(status.lastRunAt)} />
        <CrmMetricCard label="Emails Sent" value={String(status.sent)} detail={`Birthdays ${status.sentBirthday} • Holidays ${status.sentHoliday}`} />
        <CrmMetricCard label="Skipped" value={String(status.skipped)} detail="Already sent earlier today or not due again." />
        <CrmMetricCard label="Failed" value={String(status.failed)} detail="Latest daily campaign run failures." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.45fr)]">
        <section className="space-y-5 rounded-[32px] border border-brand-100 bg-white p-6 shadow-soft lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">Campaign Monitor</p>
              <h2 className="mt-2 font-heading text-3xl text-brand-900">Daily birthday and holiday automation</h2>
              <p className="mt-3 text-sm leading-6 text-brand-700">
                This page shows the latest CRM automation result and the recent send log written by the daily campaign runner.
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(status.lastRunStatus)}`}>
              {status.lastRunStatus ? `Last run ${status.lastRunStatus}` : "Waiting for first run"}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-brand-100 bg-brand-50/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Latest Run</p>
              <p className="mt-3 text-sm text-brand-800">Ran at: {formatDateTime(status.lastRunAt)}</p>
              <p className="mt-2 text-sm text-brand-800">Run date: {formatDate(status.lastRunDate)}</p>
              <p className="mt-2 text-sm text-brand-800">Eligible contacts: {status.contactsEligible}</p>
            </div>

            <div className="rounded-2xl border border-brand-100 bg-brand-50/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Due That Day</p>
              <p className="mt-3 text-sm text-brand-800">Birthdays due: {status.birthdaysDue}</p>
              <p className="mt-2 text-sm text-brand-800">Holiday templates due: {status.holidaysDue}</p>
              <p className="mt-2 text-sm text-brand-800">Sent total: {status.sent}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Scheduler Target</p>
            <p className="mt-3 text-sm leading-6 text-brand-800">
              Daily route: <span className="font-mono text-xs">/api/internal/crm-campaigns/daily</span>
            </p>
            <p className="mt-2 text-sm leading-6 text-brand-800">
              Header: <span className="font-mono text-xs">x-scheduler-token</span> with the same <span className="font-mono text-xs">MLS_SCHEDULER_TOKEN</span> value you already use.
            </p>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Latest Errors</p>
            {status.lastErrors.length > 0 ? (
              <div className="mt-3 space-y-2">
                {status.lastErrors.map((error, index) => (
                  <p key={`${index}-${error}`} className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-brand-700">No errors were recorded in the latest run.</p>
            )}
          </div>
        </section>

        <section className="space-y-5 rounded-[32px] border border-brand-100 bg-white p-6 shadow-soft lg:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">Send Log</p>
            <h2 className="mt-2 font-heading text-3xl text-brand-900">Recent campaign activity</h2>
            <p className="mt-3 text-sm leading-6 text-brand-700">
              Every successful or failed automated send is logged here so Yan can review exactly what happened.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-brand-100">
            <div className="overflow-x-auto">
              <table className="min-w-[920px] w-full text-left text-sm">
                <thead className="bg-brand-50 text-brand-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Sent At</th>
                    <th className="px-4 py-3 font-semibold">Template</th>
                    <th className="px-4 py-3 font-semibold">Recipient</th>
                    <th className="px-4 py-3 font-semibold">Date Key</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Provider</th>
                    <th className="px-4 py-3 font-semibold">Mode</th>
                    <th className="px-4 py-3 font-semibold">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-brand-700">
                        No campaign sends have been logged yet.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="border-t border-brand-100 align-top">
                        <td className="px-4 py-3 text-brand-700">{formatDateTime(log.sentAt)}</td>
                        <td className="px-4 py-3 text-brand-900">
                          <p className="font-semibold">{log.templateName || log.templateId}</p>
                          <p className="mt-1 text-xs text-brand-600">{log.templateKind === "birthday" ? "Birthday" : "Holiday"}</p>
                        </td>
                        <td className="px-4 py-3 text-brand-700">
                          <p>{log.recipientName || "-"}</p>
                          <p className="mt-1 text-xs text-brand-600">{log.recipientEmail}</p>
                        </td>
                        <td className="px-4 py-3 text-brand-700">{formatDate(log.sendDateKey)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              log.status === "sent" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-brand-700">{log.provider || "-"}</td>
                        <td className="px-4 py-3 text-brand-700">{log.mode}</td>
                        <td className="max-w-sm whitespace-pre-line px-4 py-3 text-brand-700">{log.error || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
