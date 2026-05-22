"use client";

import { useMemo, useState } from "react";
import type { CrmContactRecord, CrmContactUpdateInput, CrmTemplateRecord } from "@/types/crm";

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

interface ContactResponse {
  success?: boolean;
  contact?: CrmContactRecord;
  error?: string;
}

interface TemplateResponse {
  success?: boolean;
  template?: CrmTemplateRecord;
  storageMode?: string;
  error?: string;
}

function getFriendlyAdminError(response: Response, fallbackMessage: string, apiMessage?: string): string {
  if (response.status === 401) {
    return "Your admin session needs to be refreshed. Sign out, sign back in, then try again.";
  }

  return apiMessage || fallbackMessage;
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

function formatContactUpdatedAt(value: string): string {
  if (!value) return "Never";
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

function sortContacts(records: CrmContactRecord[]): CrmContactRecord[] {
  return [...records].sort((left, right) => left.fullName.localeCompare(right.fullName, "en", { sensitivity: "base" }));
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

function createEmptyContact(): CrmContactRecord {
  return {
    id: "",
    firstName: "",
    lastName: "",
    fullName: "",
    email: "",
    phone: "",
    birthdayRaw: "",
    birthdayMonth: null,
    birthdayDay: null,
    birthdayYear: null,
    notes: "",
    tags: [],
    city: "",
    source: "manual",
    emailConsentStatus: "unknown",
    isActive: true,
    createdAt: "",
    updatedAt: ""
  };
}

function parseTagsInput(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getContactDisplayName(contact: CrmContactRecord): string {
  return contact.fullName || contact.email || "Unnamed contact";
}

export function CrmManager({ initialContacts, initialTemplates }: CrmManagerProps) {
  const sortedInitialContacts = useMemo(() => sortContacts(initialContacts), [initialContacts]);
  const [contacts, setContacts] = useState(sortedInitialContacts);
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedContactId, setSelectedContactId] = useState(sortedInitialContacts[0]?.id ?? "");
  const [contactDraft, setContactDraft] = useState<CrmContactRecord>(sortedInitialContacts[0] ?? createEmptyContact());
  const [searchQuery, setSearchQuery] = useState("");
  const [contactsMessage, setContactsMessage] = useState("");
  const [contactsError, setContactsError] = useState("");
  const [contactSaveMessage, setContactSaveMessage] = useState("");
  const [contactSaveError, setContactSaveError] = useState("");
  const [templatesMessage, setTemplatesMessage] = useState("");
  const [templatesError, setTemplatesError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [draftTemplate, setDraftTemplate] = useState<CrmTemplateRecord>(initialTemplates[0] ?? createEmptyTemplate());

  const contactsWithBirthdays = contacts.filter((contact) => contact.birthdayMonth && contact.birthdayDay).length;
  const filteredContacts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return contacts;

    return contacts.filter((contact) =>
      [contact.fullName, contact.email, contact.phone, contact.notes, contact.city, contact.tags.join(", ")]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [contacts, searchQuery]);

  function applySelectedContact(nextContacts: CrmContactRecord[], preferredId?: string) {
    const fallbackId = preferredId && nextContacts.some((contact) => contact.id === preferredId) ? preferredId : nextContacts[0]?.id ?? "";
    const nextSelected = nextContacts.find((contact) => contact.id === fallbackId) ?? createEmptyContact();
    setSelectedContactId(nextSelected.id);
    setContactDraft(nextSelected);
  }

  function selectContact(contactId: string) {
    const contact = contacts.find((item) => item.id === contactId);
    if (!contact) return;
    setSelectedContactId(contact.id);
    setContactDraft(contact);
    setContactSaveMessage("");
    setContactSaveError("");
  }

  function selectTemplate(templateId: string) {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;
    setDraftTemplate(template);
    setTemplatesMessage("");
    setTemplatesError("");
  }

  function updateContactDraft<K extends keyof CrmContactRecord>(key: K, value: CrmContactRecord[K]) {
    setContactDraft((current) => ({
      ...current,
      [key]: value
    }));
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

  function upsertContact(nextContact: CrmContactRecord) {
    const nextContacts = sortContacts(contacts.map((contact) => (contact.id === nextContact.id ? nextContact : contact)));
    setContacts(nextContacts);
    applySelectedContact(nextContacts, nextContact.id);
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
        throw new Error(getFriendlyAdminError(response, "Could not import contacts.", payload.error));
      }

      const nextContacts = sortContacts(payload.contacts ?? []);
      setContacts(nextContacts);
      applySelectedContact(nextContacts, selectedContactId);
      setContactsMessage(`Imported ${payload.importedCount ?? 0} contacts from ${file.name}.`);
      form.reset();
    } catch (error) {
      setContactsError(error instanceof Error ? error.message : "Could not import contacts.");
    } finally {
      setIsImporting(false);
    }
  }

  async function handleSaveContact() {
    if (!contactDraft.id) return;

    setIsSavingContact(true);
    setContactSaveMessage("");
    setContactSaveError("");

    try {
      const requestBody: CrmContactUpdateInput = {
        id: contactDraft.id,
        firstName: contactDraft.firstName,
        lastName: contactDraft.lastName,
        email: contactDraft.email,
        phone: contactDraft.phone,
        birthdayRaw: contactDraft.birthdayRaw,
        notes: contactDraft.notes,
        tags: contactDraft.tags,
        city: contactDraft.city,
        emailConsentStatus: contactDraft.emailConsentStatus,
        isActive: contactDraft.isActive
      };

      const response = await fetch("/api/admin/crm/contacts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
      const payload = (await response.json()) as ContactResponse;

      if (!response.ok || !payload.success || !payload.contact) {
        throw new Error(getFriendlyAdminError(response, "Could not save contact.", payload.error));
      }

      upsertContact(payload.contact);
      setContactSaveMessage("Contact saved.");
    } catch (error) {
      setContactSaveError(error instanceof Error ? error.message : "Could not save contact.");
    } finally {
      setIsSavingContact(false);
    }
  }

  function handleResetContact() {
    const savedContact = contacts.find((contact) => contact.id === selectedContactId);
    setContactDraft(savedContact ?? createEmptyContact());
    setContactSaveMessage("");
    setContactSaveError("");
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
        throw new Error(getFriendlyAdminError(response, "Could not save template.", payload.error));
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
        throw new Error(getFriendlyAdminError(response, "Could not upload image.", payload.error));
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
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="CRM Contacts" value={String(contacts.length)} />
        <MetricCard label="Birthdays Recorded" value={String(contactsWithBirthdays)} />
        <MetricCard label="Card Templates" value={String(templates.length)} />
      </div>

      <div className="grid gap-8 2xl:grid-cols-[minmax(0,1.65fr)_minmax(520px,0.95fr)]">
        <section className="rounded-[32px] border border-brand-100 bg-white p-6 shadow-soft lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">Contacts Workspace</p>
              <h2 className="mt-2 font-heading text-3xl text-brand-900">Import, review, and edit CRM contacts</h2>
              <p className="mt-3 text-sm leading-6 text-brand-700">
                Keep Yan&apos;s contact list clean, searchable, and ready for birthday and holiday campaigns.
              </p>
            </div>
            <span className="rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-800">
              {contacts.length} contacts
            </span>
          </div>

          <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_380px]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-brand-100 bg-brand-50/60 p-5">
                <form className="space-y-4" onSubmit={handleImport}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-brand-900">Upload contacts CSV</p>
                      <p className="mt-1 text-xs leading-5 text-brand-700">
                        Re-import your contact list anytime. Existing records are merged by contact id.
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={isImporting}
                      className="rounded-full bg-brand-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {isImporting ? "Importing..." : "Import Contacts"}
                    </button>
                  </div>

                  <input
                    id="contactsCsv"
                    name="contactsCsv"
                    type="file"
                    accept=".csv,text/csv"
                    className="w-full rounded-2xl border border-dashed border-brand-300 bg-white px-4 py-3 text-sm text-brand-800"
                  />
                </form>

                {contactsMessage ? (
                  <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{contactsMessage}</p>
                ) : null}
                {contactsError ? (
                  <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{contactsError}</p>
                ) : null}
              </div>

              <div>
                <label className="block text-sm font-semibold text-brand-900" htmlFor="crmContactSearch">
                  Search contacts
                </label>
                <input
                  id="crmContactSearch"
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by name, email, phone, city, tag, or notes"
                  className="mt-2 w-full rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm text-brand-900 outline-none ring-brand-500 focus:ring-2"
                />
              </div>

              <div className="overflow-hidden rounded-3xl border border-brand-100">
                <div className="overflow-x-auto">
                  <table className="min-w-[820px] w-full text-left text-sm">
                    <thead className="bg-brand-50 text-brand-800">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Name</th>
                        <th className="px-4 py-3 font-semibold">Email</th>
                        <th className="px-4 py-3 font-semibold">Birthday</th>
                        <th className="px-4 py-3 font-semibold">Phone</th>
                        <th className="px-4 py-3 font-semibold">Notes</th>
                        <th className="px-4 py-3 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContacts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-brand-700">
                            No CRM contacts found.
                          </td>
                        </tr>
                      ) : (
                        filteredContacts.map((contact) => {
                          const isSelected = contact.id === selectedContactId;
                          return (
                            <tr
                              key={contact.id}
                              className={`border-t border-brand-100 align-top transition ${
                                isSelected ? "bg-brand-50/80" : "bg-white hover:bg-brand-50/40"
                              }`}
                            >
                              <td className="px-4 py-3 text-brand-900">
                                <p className="font-semibold">{contact.fullName || "-"}</p>
                                <p className="mt-1 text-xs text-brand-600">{contact.city || "No city yet"}</p>
                              </td>
                              <td className="px-4 py-3 text-brand-700">{contact.email || "-"}</td>
                              <td className="px-4 py-3 text-brand-700">{formatBirthday(contact)}</td>
                              <td className="px-4 py-3 text-brand-700">{contact.phone || "-"}</td>
                              <td className="max-w-sm whitespace-pre-line px-4 py-3 text-brand-700">{contact.notes || "-"}</td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() => selectContact(contact.id)}
                                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                                    isSelected
                                      ? "bg-brand-900 text-white"
                                      : "border border-brand-300 text-brand-900 hover:border-brand-500"
                                  }`}
                                >
                                  {isSelected ? "Editing" : "Edit"}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <aside className="h-fit rounded-3xl border border-brand-100 bg-[#fcfcfa] p-5 xl:sticky xl:top-24">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Contact Editor</p>
                  <h3 className="mt-2 font-heading text-2xl text-brand-900">{getContactDisplayName(contactDraft)}</h3>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-800">
                  {contactDraft.source || "manual"}
                </span>
              </div>

              {contactDraft.id ? (
                <div className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    <Field label="First Name" value={contactDraft.firstName} onChange={(value) => updateContactDraft("firstName", value)} />
                    <Field label="Last Name" value={contactDraft.lastName} onChange={(value) => updateContactDraft("lastName", value)} />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    <Field label="Email" value={contactDraft.email} onChange={(value) => updateContactDraft("email", value)} type="email" />
                    <Field label="Phone" value={contactDraft.phone} onChange={(value) => updateContactDraft("phone", value)} />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    <Field
                      label="Birthday"
                      value={contactDraft.birthdayRaw}
                      onChange={(value) => updateContactDraft("birthdayRaw", value)}
                      placeholder="MM/DD/YYYY or MM/DD"
                    />
                    <Field label="City" value={contactDraft.city} onChange={(value) => updateContactDraft("city", value)} />
                  </div>

                  <Field
                    label="Tags"
                    value={contactDraft.tags.join(", ")}
                    onChange={(value) => updateContactDraft("tags", parseTagsInput(value))}
                    placeholder="buyer, seller, birthday"
                  />

                  <label className="block text-sm font-semibold text-brand-900">
                    Consent Status
                    <select
                      value={contactDraft.emailConsentStatus}
                      onChange={(event) =>
                        updateContactDraft(
                          "emailConsentStatus",
                          event.target.value as CrmContactRecord["emailConsentStatus"]
                        )
                      }
                      className="mt-2 w-full rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm text-brand-900 outline-none ring-brand-500 focus:ring-2"
                    >
                      <option value="unknown">Unknown</option>
                      <option value="subscribed">Subscribed</option>
                      <option value="unsubscribed">Unsubscribed</option>
                    </select>
                  </label>

                  <TextAreaField
                    label="Notes"
                    value={contactDraft.notes}
                    onChange={(value) => updateContactDraft("notes", value)}
                    rows={7}
                  />

                  <label className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm text-brand-900">
                    <input
                      type="checkbox"
                      checked={contactDraft.isActive}
                      onChange={(event) => updateContactDraft("isActive", event.target.checked)}
                      className="h-4 w-4 rounded border-brand-300"
                    />
                    Contact is active and can be used in future campaigns.
                  </label>

                  {contactSaveMessage ? (
                    <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{contactSaveMessage}</p>
                  ) : null}
                  {contactSaveError ? (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{contactSaveError}</p>
                  ) : null}

                  <div className="grid gap-2 rounded-2xl border border-brand-100 bg-white p-4 text-xs text-brand-600">
                    <p>Created: {formatContactUpdatedAt(contactDraft.createdAt)}</p>
                    <p>Updated: {formatContactUpdatedAt(contactDraft.updatedAt)}</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleSaveContact}
                      disabled={isSavingContact}
                      className="rounded-full bg-brand-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {isSavingContact ? "Saving..." : "Save Contact"}
                    </button>
                    <button
                      type="button"
                      onClick={handleResetContact}
                      className="rounded-full border border-brand-300 px-5 py-2.5 text-sm font-semibold text-brand-900"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-brand-200 bg-white px-4 py-10 text-center text-sm text-brand-600">
                  Choose a contact from the table to edit it here.
                </div>
              )}
            </aside>
          </div>
        </section>

        <section className="rounded-[32px] border border-brand-100 bg-white p-6 shadow-soft lg:p-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">Template Studio</p>
            <h2 className="mt-2 font-heading text-3xl text-brand-900">Design birthday and holiday cards</h2>
            <p className="mt-3 text-sm leading-6 text-brand-700">
              Upload an image, update the copy, and keep each email template ready for Yan to send.
            </p>
          </div>

          <div className="mt-7 grid gap-6 2xl:grid-cols-[240px_minmax(0,1fr)]">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-1">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => selectTemplate(template.id)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
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
              <div className="grid gap-4 xl:grid-cols-2">
                <Field label="Template Name" value={draftTemplate.name} onChange={(value) => updateDraft("name", value)} />
                <Field label="Email Subject" value={draftTemplate.subject} onChange={(value) => updateDraft("subject", value)} />
              </div>

              <Field label="Preview Text" value={draftTemplate.previewText} onChange={(value) => updateDraft("previewText", value)} />

              <Field label="Headline" value={draftTemplate.headline} onChange={(value) => updateDraft("headline", value)} />

              <TextAreaField label="Message Body" value={draftTemplate.body} onChange={(value) => updateDraft("body", value)} rows={7} />

              <TextAreaField label="Signature" value={draftTemplate.signature} onChange={(value) => updateDraft("signature", value)} rows={4} />

              <div className="rounded-3xl border border-brand-100 bg-brand-50/60 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-brand-900">Card Image</p>
                    <p className="mt-1 text-xs leading-5 text-brand-700">
                      Upload a holiday or birthday image. Wide landscape images work best in email.
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
                    <img src={draftTemplate.imageUrl} alt={draftTemplate.name} className="h-56 w-full object-cover" />
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-brand-200 bg-white px-4 py-10 text-center text-sm text-brand-600">
                    No image uploaded yet.
                  </div>
                )}
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm text-brand-900">
                <input
                  type="checkbox"
                  checked={draftTemplate.enabled}
                  onChange={(event) => updateDraft("enabled", event.target.checked)}
                  className="h-4 w-4 rounded border-brand-300"
                />
                Template is active and ready to use.
              </label>

              {templatesMessage ? (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{templatesMessage}</p>
              ) : null}
              {templatesError ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{templatesError}</p>
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
                  <img src={draftTemplate.imageUrl} alt={`${draftTemplate.name} preview`} className="mt-4 h-56 w-full rounded-2xl object-cover" />
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email";
}) {
  return (
    <label className="block text-sm font-semibold text-brand-900">
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm text-brand-900 outline-none ring-brand-500 focus:ring-2"
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
        className="mt-2 w-full rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm text-brand-900 outline-none ring-brand-500 focus:ring-2"
      />
    </label>
  );
}
