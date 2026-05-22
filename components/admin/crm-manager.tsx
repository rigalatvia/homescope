"use client";

import { useState } from "react";
import type { CrmContactRecord, CrmTemplateRecord } from "@/types/crm";

interface CrmManagerProps {
  initialContacts: CrmContactRecord[];
  initialTemplates: CrmTemplateRecord[];
}

interface ContactsImportResponse {
  success?: boolean;
  importedCount?: number;
  contacts?: CrmContactRecord[];
  error?: string;
}

interface TemplateResponse {
  success?: boolean;
  template?: CrmTemplateRecord;
  storageMode?: string;
  error?: string;
}

function formatTemplateUpdatedAt(value: string): string {
  if (!value) return "Not saved yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function formatBirthday(contact: CrmContactRecord): string {
  return contact.birthdayRaw || "-";
}

function formatTemplateKind(kind: CrmTemplateRecord["kind"]): string {
  return kind === "birthday" ? "Birthday" : "Holiday";
}

function createEmptyTemplate(): CrmTemplateRecord {
  return {
    id: "",
    kind: "holiday",
    name: "",
    subject: "",
    previewText: "",
    headline: "",
    body: "",
    signature: "",
    imageUrl: "",
    imageStoragePath: "",
    imageStorageMode: "none",
    enabled: true,
    createdAt: "",
    updatedAt: ""
  };
}

export function CrmManager({ initialContacts, initialTemplates }: CrmManagerProps) {
  const [contacts, setContacts] = useState(initialContacts);
  const [templates, setTemplates] = useState(initialTemplates);
  const [searchQuery, setSearchQuery] = useState("");
  const [contactsMessage, setContactsMessage] = useState("");
  const [contactsError, setContactsError] = useState("");
  const [templatesMessage, setTemplatesMessage] = useState("");
  const [templatesError, setTemplatesError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [draftTemplate, setDraftTemplate] = useState<CrmTemplateRecord>(initialTemplates[0] ?? createEmptyTemplate());

  const contactsWithBirthdays = contacts.filter((contact) => contact.birthdayMonth && contact.birthdayDay).length;
  const filteredContacts = contacts.filter((contact) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return [contact.fullName, contact.email, contact.phone, contact.notes].some((field) => field.toLowerCase().includes(query));
  });

  function selectTemplate(templateId: string) {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;
    setDraftTemplate(template);
    setTemplatesMessage("");
    setTemplatesError("");
  }

  function updateDraft<K extends keyof CrmTemplateRecord>(key: K, value: CrmTemplateRecord[K]) {
    setDraftTemplate((current) => ({
      ...current,
      [key]: value
    }));
  }

  function upsertTemplate(nextTemplate: CrmTemplateRecord) {
    setTemplates((current) => current.map((template) => (template.id === nextTemplate.id ? nextTemplate : template)));
    setDraftTemplate(nextTemplate);
  }

  async function handleImport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("contactsCsv") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];

    if (!file) {
      setContactsError("Choose a CSV file first.");
      setContactsMessage("");
      return;
    }

    setIsImporting(true);
    setContactsError("");
    setContactsMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/crm/import-contacts", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as ContactsImportResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Could not import contacts.");
      }

      setContacts(payload.contacts ?? []);
      setContactsMessage(`Imported ${payload.importedCount ?? 0} contacts from ${file.name}.`);
      form.reset();
    } catch (error) {
      setContactsError(error instanceof Error ? error.message : "Could not import contacts.");
    } finally {
      setIsImporting(false);
    }
  }

  async function handleSaveTemplate() {
    setIsSavingTemplate(true);
    setTemplatesError("");
    setTemplatesMessage("");

    try {
      const response = await fetch("/api/admin/crm/templates", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(draftTemplate)
      });
      const payload = (await response.json()) as TemplateResponse;

      if (!response.ok || !payload.success || !payload.template) {
        throw new Error(payload.error || "Could not save template.");
      }

      upsertTemplate(payload.template);
      setTemplatesMessage("Template saved.");
    } catch (error) {
      setTemplatesError(error instanceof Error ? error.message : "Could not save template.");
    } finally {
      setIsSavingTemplate(false);
    }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !draftTemplate.id) {
      return;
    }

    setIsUploadingImage(true);
    setTemplatesError("");
    setTemplatesMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("templateId", draftTemplate.id);

      const response = await fetch("/api/admin/crm/templates/image", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as TemplateResponse;

      if (!response.ok || !payload.success || !payload.template) {
        throw new Error(payload.error || "Could not upload image.");
      }

      upsertTemplate(payload.template);
      setTemplatesMessage(
        payload.storageMode === "embedded"
          ? "Image uploaded and stored in the database."
          : "Image uploaded successfully."
      );
    } catch (error) {
      setTemplatesError(error instanceof Error ? error.message : "Could not upload image.");
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  }

  function handleRemoveImage() {
    updateDraft("imageUrl", "");
    updateDraft("imageStoragePath", "");
    updateDraft("imageStorageMode", "none");
    setTemplatesMessage("Image removed from the draft. Save the template to keep the change.");
    setTemplatesError("");
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="CRM Contacts" value={String(contacts.length)} />
        <MetricCard label="Birthdays Recorded" value={String(contactsWithBirthdays)} />
        <MetricCard label="Card Templates" value={String(templates.length)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.3fr]">
        <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-heading text-2xl text-brand-900">Contacts</h2>
              <p className="mt-2 text-sm text-brand-700">
                Import Yan&apos;s CSV list and keep all contact data in one CRM table.
              </p>
            </div>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
              {contacts.length} total
            </span>
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleImport}>
            <label className="block text-sm font-semibold text-brand-900" htmlFor="contactsCsv">
              Upload contacts CSV
            </label>
            <input
              id="contactsCsv"
              name="contactsCsv"
              type="file"
              accept=".csv,text/csv"
              className="w-full rounded-xl border border-dashed border-brand-300 px-4 py-3 text-sm text-brand-800"
            />
            <button
              type="submit"
              disabled={isImporting}
              className="rounded-full bg-brand-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isImporting ? "Importing..." : "Import Contacts"}
            </button>
          </form>

          {contactsMessage ? (
            <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{contactsMessage}</p>
          ) : null}
          {contactsError ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{contactsError}</p>
          ) : null}

          <div className="mt-6">
            <label className="block text-sm font-semibold text-brand-900" htmlFor="crmContactSearch">
              Search contacts
            </label>
            <input
              id="crmContactSearch"
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, email, phone, or notes"
              className="mt-2 w-full rounded-xl border border-brand-200 px-4 py-3 text-sm text-brand-900 outline-none ring-brand-500 focus:ring-2"
            />
          </div>

          <div className="mt-5 overflow-x-auto rounded-xl border border-brand-100">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-brand-50 text-brand-800">
                <tr>
                  <th className="px-3 py-2 font-semibold">Name</th>
                  <th className="px-3 py-2 font-semibold">Email</th>
                  <th className="px-3 py-2 font-semibold">Birthday</th>
                  <th className="px-3 py-2 font-semibold">Phone</th>
                  <th className="px-3 py-2 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-brand-700">
                      No CRM contacts found yet.
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((contact) => (
                    <tr key={contact.id} className="border-t border-brand-100 align-top">
                      <td className="px-3 py-2 text-brand-900">{contact.fullName || "-"}</td>
                      <td className="px-3 py-2 text-brand-700">{contact.email || "-"}</td>
                      <td className="px-3 py-2 text-brand-700">{formatBirthday(contact)}</td>
                      <td className="px-3 py-2 text-brand-700">{contact.phone || "-"}</td>
                      <td className="max-w-sm whitespace-pre-line px-3 py-2 text-brand-700">{contact.notes || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-soft">
          <div>
            <h2 className="font-heading text-2xl text-brand-900">Card Templates</h2>
            <p className="mt-2 text-sm text-brand-700">
              Upload an image and update the text for birthday and holiday cards whenever Yan wants.
            </p>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => selectTemplate(template.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    draftTemplate.id === template.id
                      ? "border-brand-900 bg-brand-900 text-white"
                      : "border-brand-200 bg-white text-brand-900 hover:border-brand-400"
                  }`}
                >
                  <p className="font-semibold">{template.name}</p>
                  <p className={`mt-1 text-xs ${draftTemplate.id === template.id ? "text-white/80" : "text-brand-600"}`}>
                    {formatTemplateKind(template.kind)}
                  </p>
                </button>
              ))}
            </div>

            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Template Name" value={draftTemplate.name} onChange={(value) => updateDraft("name", value)} />
                <Field label="Email Subject" value={draftTemplate.subject} onChange={(value) => updateDraft("subject", value)} />
              </div>

              <Field label="Preview Text" value={draftTemplate.previewText} onChange={(value) => updateDraft("previewText", value)} />

              <Field label="Headline" value={draftTemplate.headline} onChange={(value) => updateDraft("headline", value)} />

              <TextAreaField label="Message Body" value={draftTemplate.body} onChange={(value) => updateDraft("body", value)} rows={7} />

              <TextAreaField label="Signature" value={draftTemplate.signature} onChange={(value) => updateDraft("signature", value)} rows={4} />

              <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-brand-900">Card Image</p>
                    <p className="mt-1 text-xs text-brand-700">
                      Upload a holiday or birthday image. Use wide images for the best email layout.
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-800">
                    {draftTemplate.imageStorageMode === "storage"
                      ? "Stored in Firebase Storage"
                      : draftTemplate.imageStorageMode === "embedded"
                        ? "Stored in Firestore"
                        : "No image yet"}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <label className="rounded-full bg-brand-900 px-4 py-2 text-sm font-semibold text-white">
                    {isUploadingImage ? "Uploading..." : "Upload Image"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploadingImage} />
                  </label>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="rounded-full border border-brand-300 px-4 py-2 text-sm font-semibold text-brand-900"
                  >
                    Remove Image
                  </button>
                </div>

                {draftTemplate.imageUrl ? (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-brand-100 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={draftTemplate.imageUrl} alt={draftTemplate.name} className="h-48 w-full object-cover" />
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-brand-200 bg-white px-4 py-8 text-center text-sm text-brand-600">
                    No image uploaded yet.
                  </div>
                )}
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm text-brand-900">
                <input
                  type="checkbox"
                  checked={draftTemplate.enabled}
                  onChange={(event) => updateDraft("enabled", event.target.checked)}
                  className="h-4 w-4 rounded border-brand-300"
                />
                Template is active and ready to use.
              </label>

              {templatesMessage ? (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{templatesMessage}</p>
              ) : null}
              {templatesError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{templatesError}</p>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-brand-600">Last updated: {formatTemplateUpdatedAt(draftTemplate.updatedAt)}</p>
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  disabled={isSavingTemplate}
                  className="rounded-full bg-brand-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSavingTemplate ? "Saving..." : "Save Template"}
                </button>
              </div>

              <div className="rounded-[28px] border border-brand-100 bg-[#fffdf7] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Preview</p>
                {draftTemplate.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={draftTemplate.imageUrl} alt={`${draftTemplate.name} preview`} className="mt-4 h-48 w-full rounded-2xl object-cover" />
                ) : null}
                <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-brand-600">{draftTemplate.subject}</p>
                  <h3 className="mt-2 font-heading text-3xl text-brand-900">{draftTemplate.headline}</h3>
                  <p className="mt-4 whitespace-pre-line text-sm leading-7 text-brand-800">{draftTemplate.body}</p>
                  <p className="mt-6 whitespace-pre-line text-sm font-semibold text-brand-900">{draftTemplate.signature}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-soft">
      <p className="text-sm font-semibold text-brand-700">{label}</p>
      <p className="mt-1 font-heading text-3xl text-brand-900">{value}</p>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-semibold text-brand-900">
      {label}
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-brand-200 px-4 py-3 text-sm text-brand-900 outline-none ring-brand-500 focus:ring-2"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
}) {
  return (
    <label className="block text-sm font-semibold text-brand-900">
      {label}
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-brand-200 px-4 py-3 text-sm text-brand-900 outline-none ring-brand-500 focus:ring-2"
      />
    </label>
  );
}
