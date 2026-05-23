import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type { CrmCampaignSchedulerStatus, CrmCampaignSendLogRecord } from "@/types/crm";

const CRM_SEND_LOG_COLLECTION = "crmSendLog";
const SETTINGS_COLLECTION = "settings";
const CRM_CAMPAIGN_STATUS_DOC_ID = "crmCampaignSchedulerStatus";

function sanitizeNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function sanitizeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function sanitizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeSendLog(record: Partial<CrmCampaignSendLogRecord>, fallbackId: string): CrmCampaignSendLogRecord {
  return {
    id: record.id || fallbackId,
    templateId: sanitizeString(record.templateId),
    templateName: sanitizeString(record.templateName),
    templateKind: record.templateKind === "birthday" ? "birthday" : "holiday",
    contactId: sanitizeString(record.contactId),
    recipientEmail: sanitizeString(record.recipientEmail),
    recipientName: sanitizeString(record.recipientName),
    sendDateKey: sanitizeString(record.sendDateKey),
    status: record.status === "failed" ? "failed" : "sent",
    provider: sanitizeString(record.provider),
    mode: record.mode === "mock" ? "mock" : "live",
    subjectUsed: sanitizeString(record.subjectUsed),
    sentAt: sanitizeString(record.sentAt),
    error: sanitizeString(record.error) || null
  };
}

export async function listRecentCrmCampaignLogs(limitCount = 100): Promise<CrmCampaignSendLogRecord[]> {
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore.collection(CRM_SEND_LOG_COLLECTION).orderBy("sentAt", "desc").limit(limitCount).get();

  return snapshot.docs.map((doc) => normalizeSendLog(doc.data() as Partial<CrmCampaignSendLogRecord>, doc.id));
}

export async function getCrmCampaignSchedulerStatus(): Promise<CrmCampaignSchedulerStatus> {
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore.collection(SETTINGS_COLLECTION).doc(CRM_CAMPAIGN_STATUS_DOC_ID).get();
  const data = (snapshot.data() ?? {}) as {
    lastRunAt?: unknown;
    lastRunDate?: unknown;
    lastRunStatus?: unknown;
    lastRunCounts?: {
      birthdaysDue?: unknown;
      holidaysDue?: unknown;
      contactsEligible?: unknown;
      sent?: unknown;
      skipped?: unknown;
      failed?: unknown;
      sentBirthday?: unknown;
      sentHoliday?: unknown;
    };
    lastErrors?: unknown;
  };

  return {
    lastRunAt: sanitizeString(data.lastRunAt) || null,
    lastRunDate: sanitizeString(data.lastRunDate) || null,
    lastRunStatus: data.lastRunStatus === "success" || data.lastRunStatus === "failed" ? data.lastRunStatus : null,
    birthdaysDue: sanitizeNumber(data.lastRunCounts?.birthdaysDue),
    holidaysDue: sanitizeNumber(data.lastRunCounts?.holidaysDue),
    contactsEligible: sanitizeNumber(data.lastRunCounts?.contactsEligible),
    sent: sanitizeNumber(data.lastRunCounts?.sent),
    skipped: sanitizeNumber(data.lastRunCounts?.skipped),
    failed: sanitizeNumber(data.lastRunCounts?.failed),
    sentBirthday: sanitizeNumber(data.lastRunCounts?.sentBirthday),
    sentHoliday: sanitizeNumber(data.lastRunCounts?.sentHoliday),
    lastErrors: sanitizeStringList(data.lastErrors)
  };
}
