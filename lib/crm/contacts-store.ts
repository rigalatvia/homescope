import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type { CrmContactRecord } from "@/types/crm";

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

function sanitizeNotes(notes: string): string {
  return collapseWhitespace(notes.trim());
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
    .map((doc) => {
      const data = doc.data() as Partial<CrmContactRecord>;
      const source: CrmContactRecord["source"] =
        data.source === "manual" || data.source === "website" ? data.source : "csv-import";
      const emailConsentStatus: CrmContactRecord["emailConsentStatus"] =
        data.emailConsentStatus === "subscribed" || data.emailConsentStatus === "unsubscribed"
          ? data.emailConsentStatus
          : "unknown";

      return {
        id: doc.id,
        firstName: data.firstName ?? "",
        lastName: data.lastName ?? "",
        fullName: data.fullName ?? buildFullName(data.firstName ?? "", data.lastName ?? ""),
        email: data.email ?? "",
        phone: data.phone ?? "",
        birthdayRaw: data.birthdayRaw ?? "",
        birthdayMonth: typeof data.birthdayMonth === "number" ? data.birthdayMonth : null,
        birthdayDay: typeof data.birthdayDay === "number" ? data.birthdayDay : null,
        birthdayYear: typeof data.birthdayYear === "number" ? data.birthdayYear : null,
        notes: data.notes ?? "",
        tags: Array.isArray(data.tags) ? data.tags.filter((item): item is string => typeof item === "string") : [],
        city: data.city ?? "",
        source,
        emailConsentStatus,
        isActive: data.isActive !== false,
        createdAt: data.createdAt ?? "",
        updatedAt: data.updatedAt ?? ""
      };
    })
    .sort((left, right) => left.fullName.localeCompare(right.fullName, "en", { sensitivity: "base" }));
}
