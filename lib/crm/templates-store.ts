import { FieldValue } from "firebase-admin/firestore";
import { CRM_TEMPLATE_DEFAULTS, getDefaultCrmTemplateMap } from "@/lib/crm/constants";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type { CrmTemplateImageUpdate, CrmTemplateRecord, CrmTemplateUpdateInput } from "@/types/crm";

const CRM_TEMPLATES_COLLECTION = "crmTemplates";

function sanitizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function sanitizeMultilineText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function sanitizeDate(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : "";
}

function sanitizeBoolean(value: unknown): boolean {
  return value === true;
}

function normalizeTemplateRecord(input: Partial<CrmTemplateRecord>, fallback: CrmTemplateRecord): CrmTemplateRecord {
  const kind = input.kind === "birthday" ? "birthday" : fallback.kind;
  const sendDate = kind === "holiday" ? sanitizeDate(input.sendDate) || fallback.sendDate : "";

  return {
    id: fallback.id,
    kind,
    name: sanitizeText(input.name) || fallback.name,
    sendDate,
    subject: sanitizeText(input.subject) || fallback.subject,
    previewText: sanitizeText(input.previewText) || fallback.previewText,
    headline: sanitizeText(input.headline) || fallback.headline,
    body: sanitizeMultilineText(input.body) || fallback.body,
    signature: sanitizeMultilineText(input.signature) || fallback.signature,
    imageUrl: sanitizeText(input.imageUrl) || "",
    imageStoragePath: sanitizeText(input.imageStoragePath) || "",
    imageStorageMode:
      input.imageStorageMode === "embedded" || input.imageStorageMode === "storage" || input.imageStorageMode === "none"
        ? input.imageStorageMode
        : fallback.imageStorageMode,
    enabled: typeof input.enabled === "boolean" ? input.enabled : fallback.enabled,
    createdAt: sanitizeText(input.createdAt) || fallback.createdAt,
    updatedAt: sanitizeText(input.updatedAt) || fallback.updatedAt
  };
}

export async function listCrmTemplates(): Promise<CrmTemplateRecord[]> {
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore.collection(CRM_TEMPLATES_COLLECTION).get();
  const defaults = getDefaultCrmTemplateMap();
  const savedTemplates = new Map<string, CrmTemplateRecord>();

  for (const doc of snapshot.docs) {
    const existingDefault = defaults.get(doc.id);
    const data = doc.data() as Partial<CrmTemplateRecord>;

    if (existingDefault) {
      savedTemplates.set(doc.id, normalizeTemplateRecord(data, existingDefault));
      continue;
    }

    const now = new Date().toISOString();
    savedTemplates.set(doc.id, {
      id: doc.id,
      kind: data.kind === "birthday" ? "birthday" : "holiday",
      name: sanitizeText(data.name) || doc.id,
      sendDate: data.kind === "birthday" ? "" : sanitizeDate(data.sendDate),
      subject: sanitizeText(data.subject),
      previewText: sanitizeText(data.previewText),
      headline: sanitizeText(data.headline),
      body: sanitizeMultilineText(data.body),
      signature: sanitizeMultilineText(data.signature),
      imageUrl: sanitizeText(data.imageUrl),
      imageStoragePath: sanitizeText(data.imageStoragePath),
      imageStorageMode:
        data.imageStorageMode === "embedded" || data.imageStorageMode === "storage" || data.imageStorageMode === "none"
          ? data.imageStorageMode
          : "none",
      enabled: sanitizeBoolean(data.enabled),
      createdAt: sanitizeText(data.createdAt) || now,
      updatedAt: sanitizeText(data.updatedAt) || now
    });
  }

  return CRM_TEMPLATE_DEFAULTS.map((template) => savedTemplates.get(template.id) ?? template);
}

export async function getCrmTemplateById(templateId: string): Promise<CrmTemplateRecord | null> {
  const templates = await listCrmTemplates();
  return templates.find((template) => template.id === templateId) ?? null;
}

export async function saveCrmTemplate(input: CrmTemplateUpdateInput): Promise<CrmTemplateRecord> {
  const firestore = getFirebaseAdminFirestore();
  const defaults = getDefaultCrmTemplateMap();
  const fallback = defaults.get(input.id);

  if (!fallback) {
    throw new Error("Unsupported template id.");
  }

  const docRef = firestore.collection(CRM_TEMPLATES_COLLECTION).doc(input.id);
  const existingSnapshot = await docRef.get();
  const existing = existingSnapshot.exists ? (existingSnapshot.data() as Partial<CrmTemplateRecord>) : null;
  const now = new Date().toISOString();

  const merged = normalizeTemplateRecord(
    {
      ...fallback,
      ...existing,
      ...input,
      updatedAt: now,
      createdAt: existing?.createdAt ?? now
    },
    fallback
  );

  await docRef.set(
    {
      ...merged,
      updatedAtServer: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  return merged;
}

export async function updateCrmTemplateImage(templateId: string, image: CrmTemplateImageUpdate): Promise<CrmTemplateRecord> {
  const templates = getDefaultCrmTemplateMap();
  const fallback = templates.get(templateId);

  if (!fallback) {
    throw new Error("Unsupported template id.");
  }

  const existingTemplates = await listCrmTemplates();
  const existing = existingTemplates.find((template) => template.id === templateId) ?? fallback;

  return saveCrmTemplate({
    id: templateId,
    kind: existing.kind,
    name: existing.name,
    sendDate: existing.sendDate,
    subject: existing.subject,
    previewText: existing.previewText,
    headline: existing.headline,
    body: existing.body,
    signature: existing.signature,
    imageUrl: image.imageUrl,
    imageStoragePath: image.imageStoragePath ?? "",
    imageStorageMode: image.imageStorageMode,
    enabled: existing.enabled
  });
}
