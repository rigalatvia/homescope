import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type { CrmContactCreateInput, CrmContactRecord, CrmContactUpdateInput } from "@/types/crm";

const CRM_CONTACTS_COLLECTION = "crmContacts";

interface ImportedCsvRow {
  name_last?: string;
  name_first?: string;
  email1?: string;
  birthday?: string;
  phone?: string;
  notes?: string;
}

function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (inQuotes) {
      if (char === '"') {
        const nextChar = text[index + 1];
        if (nextChar === '"') {
          currentField += '"';
          index += 1;
          continue;
        }
        inQuotes = false;
        continue;
      }

      currentField += char;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if (char === "\n") {
      currentRow.push(currentField);
      if (currentRow.some((value) => value.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
      continue;
    }

    currentField += char;
  }

  currentRow.push(currentField);
  if (currentRow.some((value) => value.trim().length > 0)) {
    rows.push(currentRow);
  }

  return rows;
}

function mapCsvRows(csvText: string): ImportedCsvRow[] {
  const rows = parseCsv(normalizeLineEndings(csvText));
  if (rows.length === 0) {
    return [];
  }

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map((value) => value.trim());

  return dataRows.map((row) =>
    headers.reduce<ImportedCsvRow>((record, header, index) => {
      record[header as keyof ImportedCsvRow] = row[index] ?? "";
      return record;
    }, {})
  );
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return phone.trim();
}

function sanitizeText(value: string): string {
  return value.trim();
}

function collapseWhitespace(value: string): string {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function parseBirthday(value: string): Pick<CrmContactRecord, "birthdayRaw" | "birthdayMonth" | "birthdayDay" | "birthdayYear"> {
  const trimmed = value.trim();
  if (!trimmed) {
    return {
      birthdayRaw: "",
      birthdayMonth: null,
      birthdayDay: null,
      birthdayYear: null
    };
  }

  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (!match) {
    return {
      birthdayRaw: trimmed,
      birthdayMonth: null,
      birthdayDay: null,
      birthdayYear: null
    };
  }

  const month = Number(match[1]);
  const day = Number(match[2]);
  const parsedYear = match[3] ? Number(match[3]) : null;
  const year = parsedYear && parsedYear < 100 ? 1900 + parsedYear : parsedYear;

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return {
      birthdayRaw: trimmed,
      birthdayMonth: null,
      birthdayDay: null,
      birthdayYear: year
    };
  }

  return {
    birthdayRaw: trimmed,
    birthdayMonth: month,
    birthdayDay: day,
    birthdayYear: year
  };
}

function buildFullName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ").trim();
}

function buildContactId(email: string): string {
  return normalizeEmail(email);
}

function buildManualContactId(): string {
  return `manual-${crypto.randomUUID()}`;
}

function sanitizeNotes(notes: string): string {
  return collapseWhitespace(notes.trim());
}

function sanitizeTags(tags: string[]): string[] {
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
    )
  );
}

function sanitizeConsentStatus(value: unknown): CrmContactRecord["emailConsentStatus"] {
  return value === "subscribed" || value === "unsubscribed" ? value : "unknown";
}

function buildStoredContactRecord(id: string, data: Partial<CrmContactRecord>): CrmContactRecord {
  const firstName = sanitizeText(data.firstName ?? "");
  const lastName = sanitizeText(data.lastName ?? "");
  const email = normalizeEmail(data.email ?? "");
  const birthday = parseBirthday(data.birthdayRaw ?? "");
  const fullName = buildFullName(firstName, lastName) || sanitizeText(data.fullName ?? "") || email;

  return {
    id,
    firstName,
    lastName,
    fullName,
    email,
    phone: normalizePhone(data.phone ?? ""),
    birthdayRaw: birthday.birthdayRaw,
    birthdayMonth: birthday.birthdayMonth,
    birthdayDay: birthday.birthdayDay,
    birthdayYear: birthday.birthdayYear,
    notes: sanitizeNotes(data.notes ?? ""),
    tags: sanitizeTags(Array.isArray(data.tags) ? data.tags : []),
    city: sanitizeText(data.city ?? ""),
    source: data.source === "manual" || data.source === "website" ? data.source : "csv-import",
    emailConsentStatus: sanitizeConsentStatus(data.emailConsentStatus),
    isActive: data.isActive !== false,
    createdAt: sanitizeText(data.createdAt ?? ""),
    updatedAt: sanitizeText(data.updatedAt ?? "")
  };
}

function mapImportedRow(row: ImportedCsvRow, timestamp: string): CrmContactRecord | null {
  const email = normalizeEmail(row.email1 ?? "");
  if (!email) return null;

  const firstName = (row.name_first ?? "").trim();
  const lastName = (row.name_last ?? "").trim();
  const birthday = parseBirthday(row.birthday ?? "");

  return {
    id: buildContactId(email),
    firstName,
    lastName,
    fullName: buildFullName(firstName, lastName),
    email,
    phone: normalizePhone(row.phone ?? ""),
    birthdayRaw: birthday.birthdayRaw,
    birthdayMonth: birthday.birthdayMonth,
    birthdayDay: birthday.birthdayDay,
    birthdayYear: birthday.birthdayYear,
    notes: sanitizeNotes(row.notes ?? ""),
    tags: [],
    city: "",
    source: "csv-import",
    emailConsentStatus: "unknown",
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export async function importCrmContactsFromCsv(csvText: string): Promise<{
  contacts: CrmContactRecord[];
  importedCount: number;
}> {
  const firestore = getFirebaseAdminFirestore();
  const importedAt = new Date().toISOString();
  const records = mapCsvRows(csvText)
    .map((row) => mapImportedRow(row, importedAt))
    .filter((record): record is CrmContactRecord => Boolean(record));

  const batch = firestore.batch();

  for (const record of records) {
    batch.set(
      firestore.collection(CRM_CONTACTS_COLLECTION).doc(record.id),
      {
        ...record,
        updatedAtServer: FieldValue.serverTimestamp(),
        importedAt: importedAt
      },
      { merge: true }
    );
  }

  if (records.length > 0) {
    await batch.commit();
  }

  return {
    contacts: await listCrmContacts(),
    importedCount: records.length
  };
}

export async function listCrmContacts(limitCount = 500): Promise<CrmContactRecord[]> {
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore.collection(CRM_CONTACTS_COLLECTION).limit(limitCount).get();

  return snapshot.docs
    .map((doc) => buildStoredContactRecord(doc.id, doc.data() as Partial<CrmContactRecord>))
    .sort((left, right) => left.fullName.localeCompare(right.fullName, "en", { sensitivity: "base" }));
}

export async function saveCrmContact(input: CrmContactUpdateInput): Promise<CrmContactRecord> {
  const firestore = getFirebaseAdminFirestore();
  const contactId = sanitizeText(input.id);

  if (!contactId) {
    throw new Error("Contact id is required.");
  }

  const docRef = firestore.collection(CRM_CONTACTS_COLLECTION).doc(contactId);
  const existingSnapshot = await docRef.get();
  const existing = existingSnapshot.exists ? (existingSnapshot.data() as Partial<CrmContactRecord>) : null;
  const now = new Date().toISOString();

  const record = buildStoredContactRecord(contactId, {
    ...existing,
    id: contactId,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    birthdayRaw: input.birthdayRaw,
    notes: input.notes,
    tags: input.tags,
    city: input.city,
    emailConsentStatus: input.emailConsentStatus,
    isActive: input.isActive,
    source: existing?.source ?? "manual",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  });

  await docRef.set(
    {
      ...record,
      updatedAtServer: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  return record;
}

export async function createCrmContact(input: CrmContactCreateInput): Promise<CrmContactRecord> {
  const firestore = getFirebaseAdminFirestore();
  const normalizedEmail = normalizeEmail(input.email);
  const preferredId = normalizedEmail || buildManualContactId();
  const docRef = firestore.collection(CRM_CONTACTS_COLLECTION).doc(preferredId);
  const existingSnapshot = await docRef.get();

  if (existingSnapshot.exists) {
    throw new Error(
      normalizedEmail
        ? "A contact with this email already exists. Open that contact and update it instead."
        : "Could not create the contact because this id already exists. Please try again."
    );
  }

  const now = new Date().toISOString();
  const record = buildStoredContactRecord(preferredId, {
    id: preferredId,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    birthdayRaw: input.birthdayRaw,
    notes: input.notes,
    tags: input.tags,
    city: input.city,
    emailConsentStatus: input.emailConsentStatus,
    isActive: input.isActive,
    source: "manual",
    createdAt: now,
    updatedAt: now
  });

  await docRef.set(
    {
      ...record,
      updatedAtServer: FieldValue.serverTimestamp()
    },
    { merge: false }
  );

  return record;
}

export async function deleteCrmContact(contactId: string): Promise<void> {
  const firestore = getFirebaseAdminFirestore();
  const normalizedId = sanitizeText(contactId);

  if (!normalizedId) {
    throw new Error("Contact id is required.");
  }

  await firestore.collection(CRM_CONTACTS_COLLECTION).doc(normalizedId).delete();
}
