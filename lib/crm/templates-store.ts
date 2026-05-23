import { FieldValue } from "firebase-admin/firestore";
import { CRM_TEMPLATE_DEFAULTS, getDefaultCrmTemplateMap } from "@/lib/crm/constants";
import { getFirebaseAdminStorage, getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type { CrmTemplateCreateInput, CrmTemplateImageUpdate, CrmTemplateRecord, CrmTemplateUpdateInput } from "@/types/crm";

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

function sanitizeTemplateId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function buildCustomTemplateFallback(
  id: string,
  kind: CrmTemplateRecord["kind"],
  name?: string
): CrmTemplateRecord {
  const now = new Date().toISOString();
  const safeName = sanitizeText(name ?? "") || (kind === "birthday" ? "New Birthday Card" : "New Holiday Card");

  if (kind === "birthday") {
    return {
      id,
      kind: "birthday",
      name: safeName,
      sendDate: "",
      subject: "Happy Birthday from Yan",
      previewText: "Sending warm birthday wishes from Yan.",
      headline: "Happy Birthday!",
      body: "Wishing you a beautiful birthday filled with joy, health, and happy moments.",
      signature: "Warm wishes,\nYan Ginzburg",
      imageUrl: "",
      imageStoragePath: "",
      imageStorageMode: "none",
      enabled: false,
      createdAt: now,
      updatedAt: now
    };
  }

  return {
    id,
    kind: "holiday",
    name: safeName,
    sendDate: "",
    subject: `Warm wishes from Yan`,
    previewText: "Sharing warm wishes from Yan.",
    headline: "Warm wishes!",
    body: "Wishing you a wonderful day filled with peace, warmth, and happy moments.",
    signature: "Warm wishes,\nYan Ginzburg",
    imageUrl: "",
    imageStoragePath: "",
    imageStorageMode: "none",
    enabled: false,
    createdAt: now,
    updatedAt: now
  };
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
  const deletedTemplateIds = new Set<string>();

  for (const doc of snapshot.docs) {
    const existingDefault = defaults.get(doc.id);
    const data = doc.data() as Partial<CrmTemplateRecord>;

    if (sanitizeText((data as { deletedAt?: string }).deletedAt ?? "")) {
      deletedTemplateIds.add(doc.id);
      continue;
    }

    if (existingDefault) {
      savedTemplates.set(doc.id, normalizeTemplateRecord(data, existingDefault));
      continue;
    }

    const fallback = buildCustomTemplateFallback(doc.id, data.kind === "birthday" ? "birthday" : "holiday", sanitizeText(data.name) || doc.id);
    savedTemplates.set(doc.id, normalizeTemplateRecord(data, fallback));
  }

  const defaultTemplates = CRM_TEMPLATE_DEFAULTS.filter((template) => !deletedTemplateIds.has(template.id)).map(
    (template) => savedTemplates.get(template.id) ?? template
  );
  const customTemplates = Array.from(savedTemplates.values())
    .filter((template) => !defaults.has(template.id))
    .sort((left, right) => left.name.localeCompare(right.name, "en", { sensitivity: "base" }));

  return [...defaultTemplates, ...customTemplates];
}

export async function getCrmTemplateById(templateId: string): Promise<CrmTemplateRecord | null> {
  const templates = await listCrmTemplates();
  return templates.find((template) => template.id === templateId) ?? null;
}

export async function saveCrmTemplate(input: CrmTemplateUpdateInput): Promise<CrmTemplateRecord> {
  const firestore = getFirebaseAdminFirestore();
  const defaults = getDefaultCrmTemplateMap();
  const templateId = sanitizeText(input.id);

  if (!templateId) {
    throw new Error("Template id is required.");
  }

  const docRef = firestore.collection(CRM_TEMPLATES_COLLECTION).doc(templateId);
  const existingSnapshot = await docRef.get();
  const existing = existingSnapshot.exists ? (existingSnapshot.data() as Partial<CrmTemplateRecord>) : null;
  const now = new Date().toISOString();
  const fallback =
    defaults.get(templateId) ??
    buildCustomTemplateFallback(
      templateId,
      input.kind === "birthday" ? "birthday" : existing?.kind === "birthday" ? "birthday" : "holiday",
      input.name || existing?.name || templateId
    );

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
  const existingTemplates = await listCrmTemplates();
  const existing = existingTemplates.find((template) => template.id === templateId);

  if (!existing) {
    throw new Error("Template not found.");
  }

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

export async function createCrmTemplate(input: CrmTemplateCreateInput): Promise<CrmTemplateRecord> {
  const firestore = getFirebaseAdminFirestore();
  const baseSlug = sanitizeTemplateId(input.name || `${input.kind}-card`) || `${input.kind}-card`;
  let templateId = baseSlug;
  let attempt = 1;

  while (true) {
    const snapshot = await firestore.collection(CRM_TEMPLATES_COLLECTION).doc(templateId).get();
    if (!snapshot.exists) {
      break;
    }

    templateId = `${baseSlug}-${attempt}`;
    attempt += 1;
  }

  const template = buildCustomTemplateFallback(templateId, input.kind, input.name);

  await firestore.collection(CRM_TEMPLATES_COLLECTION).doc(templateId).set(
    {
      ...template,
      updatedAtServer: FieldValue.serverTimestamp()
    },
    { merge: false }
  );

  return template;
}

export async function deleteCrmTemplate(templateId: string): Promise<void> {
  const normalizedId = sanitizeText(templateId);

  if (!normalizedId) {
    throw new Error("Template id is required.");
  }

  const firestore = getFirebaseAdminFirestore();
  const existing = await getCrmTemplateById(normalizedId);
  const now = new Date().toISOString();

  if (existing?.imageStorageMode === "storage" && existing.imageStoragePath) {
    try {
      const storage = getFirebaseAdminStorage();
      await storage.bucket().file(existing.imageStoragePath).delete({ ignoreNotFound: true });
    } catch (error) {
      console.warn("[crm][templates] Failed deleting storage image while removing template", {
        templateId: normalizedId,
        error
      });
    }
  }

  await firestore.collection(CRM_TEMPLATES_COLLECTION).doc(normalizedId).set(
    {
      id: normalizedId,
      deletedAt: now,
      updatedAt: now,
      updatedAtServer: FieldValue.serverTimestamp()
    },
    { merge: false }
  );
}
