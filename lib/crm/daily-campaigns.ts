import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { listCrmContacts } from "@/lib/crm/contacts-store";
import { sendCrmTemplateEmail } from "@/lib/crm/email";
import { listCrmTemplates } from "@/lib/crm/templates-store";
import type { CrmCampaignSendLogRecord, CrmContactRecord, CrmTemplateRecord } from "@/types/crm";

const CRM_SEND_LOG_COLLECTION = "crmSendLog";
const SETTINGS_COLLECTION = "settings";
const CRM_CAMPAIGN_STATUS_DOC_ID = "crmCampaignSchedulerStatus";
const CRM_TIME_ZONE = "America/Toronto";

export interface CrmDailyCampaignRunSummary {
  runDate: string;
  birthdaysDue: number;
  holidaysDue: number;
  contactsEligible: number;
  sent: number;
  skipped: number;
  failed: number;
  sentBirthday: number;
  sentHoliday: number;
  errors: string[];
}

function getDateParts(date = new Date()): { year: string; month: string; day: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CRM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  return {
    year: parts.find((part) => part.type === "year")?.value ?? "",
    month: parts.find((part) => part.type === "month")?.value ?? "",
    day: parts.find((part) => part.type === "day")?.value ?? ""
  };
}

function getTorontoDateKey(date = new Date()): string {
  const { year, month, day } = getDateParts(date);
  return `${year}-${month}-${day}`;
}

function getTorontoMonthDay(date = new Date()): string {
  const { month, day } = getDateParts(date);
  return `${month}/${day}`;
}

function isEligibleContact(contact: CrmContactRecord): boolean {
  return Boolean(contact.isActive && contact.email && contact.emailConsentStatus !== "unsubscribed");
}

function getContactRecipientName(contact: CrmContactRecord): string {
  return contact.firstName || contact.fullName || "";
}

function buildSendLogId(templateId: string, sendDateKey: string, contactId: string): string {
  return `${sendDateKey}__${templateId}__${contactId}`;
}

async function getSendLogStatus(logId: string): Promise<CrmCampaignSendLogRecord | null> {
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore.collection(CRM_SEND_LOG_COLLECTION).doc(logId).get();
  if (!snapshot.exists) return null;
  return snapshot.data() as CrmCampaignSendLogRecord;
}

async function saveSendLog(record: CrmCampaignSendLogRecord): Promise<void> {
  const firestore = getFirebaseAdminFirestore();
  await firestore.collection(CRM_SEND_LOG_COLLECTION).doc(record.id).set(record, { merge: true });
}

async function saveRunSummary(summary: CrmDailyCampaignRunSummary, status: "success" | "failed"): Promise<void> {
  const firestore = getFirebaseAdminFirestore();
  await firestore.collection(SETTINGS_COLLECTION).doc(CRM_CAMPAIGN_STATUS_DOC_ID).set(
    {
      lastRunAt: new Date().toISOString(),
      lastRunStatus: status,
      lastRunDate: summary.runDate,
      lastRunCounts: {
        birthdaysDue: summary.birthdaysDue,
        holidaysDue: summary.holidaysDue,
        contactsEligible: summary.contactsEligible,
        sent: summary.sent,
        skipped: summary.skipped,
        failed: summary.failed,
        sentBirthday: summary.sentBirthday,
        sentHoliday: summary.sentHoliday
      },
      lastErrors: summary.errors.slice(0, 20)
    },
    { merge: true }
  );
}

async function sendTemplateToContact(input: {
  template: CrmTemplateRecord;
  contact: CrmContactRecord;
  sendDateKey: string;
}): Promise<{
  status: "sent" | "skipped" | "failed";
  mode?: "mock" | "live";
  provider?: string;
  error?: string;
}> {
  const logId = buildSendLogId(input.template.id, input.sendDateKey, input.contact.id);
  const existingLog = await getSendLogStatus(logId);
  if (existingLog?.status === "sent") {
    return { status: "skipped" };
  }

  try {
    const result = await sendCrmTemplateEmail({
      template: input.template,
      to: input.contact.email,
      recipientName: getContactRecipientName(input.contact)
    });

    await saveSendLog({
      id: logId,
      templateId: input.template.id,
      templateName: input.template.name,
      templateKind: input.template.kind,
      contactId: input.contact.id,
      recipientEmail: input.contact.email,
      recipientName: input.contact.fullName,
      sendDateKey: input.sendDateKey,
      status: "sent",
      provider: result.provider,
      mode: result.mode,
      subjectUsed: result.subjectUsed,
      sentAt: new Date().toISOString(),
      error: null
    });

    return {
      status: "sent",
      mode: result.mode,
      provider: result.provider
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send email.";

    await saveSendLog({
      id: logId,
      templateId: input.template.id,
      templateName: input.template.name,
      templateKind: input.template.kind,
      contactId: input.contact.id,
      recipientEmail: input.contact.email,
      recipientName: input.contact.fullName,
      sendDateKey: input.sendDateKey,
      status: "failed",
      provider: "unknown",
      mode: "live",
      subjectUsed: input.template.subject,
      sentAt: new Date().toISOString(),
      error: message
    });

    return {
      status: "failed",
      error: message
    };
  }
}

export async function runCrmDailyCampaigns(date = new Date()): Promise<CrmDailyCampaignRunSummary> {
  const runDate = getTorontoDateKey(date);
  const monthDay = getTorontoMonthDay(date);

  const [templates, contacts] = await Promise.all([listCrmTemplates(), listCrmContacts(5000)]);

  const birthdayTemplates = templates.filter((template) => template.kind === "birthday" && template.enabled);
  const dueHolidayTemplates = templates.filter(
    (template) => template.kind === "holiday" && template.enabled && template.sendDate === runDate
  );
  const eligibleContacts = contacts.filter(isEligibleContact);
  const birthdayContacts = birthdayTemplates.length > 0
    ? eligibleContacts.filter(
        (contact) =>
          contact.birthdayMonth != null &&
          contact.birthdayDay != null &&
          `${String(contact.birthdayMonth).padStart(2, "0")}/${String(contact.birthdayDay).padStart(2, "0")}` === monthDay
      )
    : [];

  const summary: CrmDailyCampaignRunSummary = {
    runDate,
    birthdaysDue: birthdayContacts.length,
    holidaysDue: dueHolidayTemplates.length,
    contactsEligible: eligibleContacts.length,
    sent: 0,
    skipped: 0,
    failed: 0,
    sentBirthday: 0,
    sentHoliday: 0,
    errors: []
  };

  try {
    for (const template of birthdayTemplates) {
      for (const contact of birthdayContacts) {
        const result = await sendTemplateToContact({
          template,
          contact,
          sendDateKey: runDate
        });

        if (result.status === "sent") {
          summary.sent += 1;
          summary.sentBirthday += 1;
        } else if (result.status === "skipped") {
          summary.skipped += 1;
        } else {
          summary.failed += 1;
          if (result.error) summary.errors.push(`[${template.id}][${contact.email}] ${result.error}`);
        }
      }
    }

    for (const template of dueHolidayTemplates) {
      for (const contact of eligibleContacts) {
        const result = await sendTemplateToContact({
          template,
          contact,
          sendDateKey: runDate
        });

        if (result.status === "sent") {
          summary.sent += 1;
          summary.sentHoliday += 1;
        } else if (result.status === "skipped") {
          summary.skipped += 1;
        } else {
          summary.failed += 1;
          if (result.error) summary.errors.push(`[${template.id}][${contact.email}] ${result.error}`);
        }
      }
    }

    await saveRunSummary(summary, "success");
    return summary;
  } catch (error) {
    const message = error instanceof Error ? error.message : "CRM daily campaign run failed.";
    summary.errors.push(message);
    await saveRunSummary(summary, "failed");
    throw error;
  }
}
