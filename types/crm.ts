export type CrmTemplateKind = "birthday" | "holiday";

export type CrmImageStorageMode = "none" | "embedded" | "storage";

export interface CrmContactRecord {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  birthdayRaw: string;
  birthdayMonth: number | null;
  birthdayDay: number | null;
  birthdayYear: number | null;
  notes: string;
  tags: string[];
  city: string;
  source: "csv-import" | "manual" | "website";
  emailConsentStatus: "unknown" | "subscribed" | "unsubscribed";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CrmContactUpdateInput {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthdayRaw: string;
  notes: string;
  tags: string[];
  city: string;
  emailConsentStatus: CrmContactRecord["emailConsentStatus"];
  isActive: boolean;
}

export interface CrmTemplateRecord {
  id: string;
  kind: CrmTemplateKind;
  name: string;
  sendDate: string;
  subject: string;
  previewText: string;
  headline: string;
  body: string;
  signature: string;
  imageUrl: string;
  imageStoragePath: string;
  imageStorageMode: CrmImageStorageMode;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CrmTemplateUpdateInput {
  id: string;
  kind: CrmTemplateKind;
  name: string;
  sendDate: string;
  subject: string;
  previewText: string;
  headline: string;
  body: string;
  signature: string;
  imageUrl?: string;
  imageStoragePath?: string;
  imageStorageMode?: CrmImageStorageMode;
  enabled: boolean;
}

export interface CrmTemplateImageUpdate {
  imageUrl: string;
  imageStoragePath?: string;
  imageStorageMode: CrmImageStorageMode;
}

export interface CrmCampaignSendLogRecord {
  id: string;
  templateId: string;
  templateName: string;
  templateKind: CrmTemplateKind;
  contactId: string;
  recipientEmail: string;
  recipientName: string;
  sendDateKey: string;
  status: "sent" | "failed";
  provider: string;
  mode: "mock" | "live";
  subjectUsed: string;
  sentAt: string;
  error: string | null;
}

export interface CrmCampaignSchedulerStatus {
  lastRunAt: string | null;
  lastRunDate: string | null;
  lastRunStatus: "success" | "failed" | null;
  birthdaysDue: number;
  holidaysDue: number;
  contactsEligible: number;
  sent: number;
  skipped: number;
  failed: number;
  sentBirthday: number;
  sentHoliday: number;
  lastErrors: string[];
}
