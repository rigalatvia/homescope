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

export interface CrmTemplateRecord {
  id: string;
  kind: CrmTemplateKind;
  name: string;
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
