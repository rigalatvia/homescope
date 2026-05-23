"use client";

import { useMemo, useState } from "react";
import { CrmField, CrmMessage, CrmMetricCard, CrmTextAreaField } from "@/components/admin/crm/shared";
import type { CrmContactRecord, CrmContactUpdateInput } from "@/types/crm";

interface CrmContactsManagerProps {
  initialContacts: CrmContactRecord[];
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

interface ContactDeleteResponse {
  success?: boolean;
  error?: string;
}

function getFriendlyAdminError(response: Response, fallbackMessage: string, apiMessage?: string): string {
  if (response.status === 401) {
    return "Your admin session needs to be refreshed. Sign out, sign back in, then try again.";
  }

  return apiMessage || fallbackMessage;
}

function sortContacts(records: CrmContactRecord[]): CrmContactRecord[] {
  return [...records].sort((left, right) => left.fullName.localeCompare(right.fullName, "en", { sensitivity: "base" }));
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

function formatBirthday(contact: CrmContactRecord): string {
  return contact.birthdayRaw || "-";
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

export function CrmContactsManager({ initialContacts }: CrmContactsManagerProps) {
  const sortedInitialContacts = useMemo(() => sortContacts(initialContacts), [initialContacts]);
  const [contacts, setContacts] = useState(sortedInitialContacts);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [isCreatingContact, setIsCreatingContact] = useState(false);
  const [contactDraft, setContactDraft] = useState<CrmContactRecord>(createEmptyContact());
  const [searchQuery, setSearchQuery] = useState("");
  const [contactsMessage, setContactsMessage] = useState("");
  const [contactsError, setContactsError] = useState("");
  const [contactSaveMessage, setContactSaveMessage] = useState("");
  const [contactSaveError, setContactSaveError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [isDeletingContact, setIsDeletingContact] = useState(false);

  const birthdaysRecordedCount = contacts.filter((contact) => contact.birthdayMonth && contact.birthdayDay).length;
  const activeContactsCount = contacts.filter((contact) => contact.isActive).length;
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
    if (!preferredId || !nextContacts.some((contact) => contact.id === preferredId)) {
      setSelectedContactId("");
      setIsCreatingContact(false);
      setContactDraft(createEmptyContact());
      return;
    }

    const nextSelected = nextContacts.find((contact) => contact.id === preferredId) ?? createEmptyContact();
    setSelectedContactId(nextSelected.id);
    setIsCreatingContact(false);
    setContactDraft(nextSelected);
  }

  function selectContact(contactId: string) {
    const contact = contacts.find((item) => item.id === contactId);
    if (!contact) return;
    setSelectedContactId(contact.id);
    setIsCreatingContact(false);
    setContactDraft(contact);
    setContactSaveMessage("");
    setContactSaveError("");
  }

  function startNewContact() {
    setSelectedContactId("");
    setIsCreatingContact(true);
    setContactDraft(createEmptyContact());
    setContactSaveMessage("");
    setContactSaveError("");
  }

  function updateContactDraft<K extends keyof CrmContactRecord>(key: K, value: CrmContactRecord[K]) {
    setContactDraft((current) => ({
      ...current,
      [key]: value
    }));
  }

  function upsertContact(nextContact: CrmContactRecord) {
    const exists = contacts.some((contact) => contact.id === nextContact.id);
    const nextContacts = sortContacts(
      exists ? contacts.map((contact) => (contact.id === nextContact.id ? nextContact : contact)) : [...contacts, nextContact]
    );
    setContacts(nextContacts);
    applySelectedContact(nextContacts, nextContact.id);
  }

  function removeContact(contactId: string) {
    const nextContacts = contacts.filter((contact) => contact.id !== contactId);
    setContacts(nextContacts);
    applySelectedContact(nextContacts);
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
        method: isCreatingContact ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(
          isCreatingContact
            ? {
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
              }
            : requestBody
        )
      });
      const payload = (await response.json()) as ContactResponse;

      if (!response.ok || !payload.success || !payload.contact) {
        throw new Error(getFriendlyAdminError(response, isCreatingContact ? "Could not create contact." : "Could not save contact.", payload.error));
      }

      upsertContact(payload.contact);
      setContactSaveMessage(isCreatingContact ? "Contact created." : "Contact saved.");
    } catch (error) {
      setContactSaveError(error instanceof Error ? error.message : isCreatingContact ? "Could not create contact." : "Could not save contact.");
    } finally {
      setIsSavingContact(false);
    }
  }

  async function handleDeleteContact() {
    if (!contactDraft.id || isCreatingContact) return;
    if (!window.confirm(`Delete ${getContactDisplayName(contactDraft)} from the CRM?`)) {
      return;
    }

    setIsDeletingContact(true);
    setContactSaveMessage("");
    setContactSaveError("");

    try {
      const response = await fetch("/api/admin/crm/contacts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id: contactDraft.id })
      });
      const payload = (await response.json()) as ContactDeleteResponse;

      if (!response.ok || !payload.success) {
        throw new Error(getFriendlyAdminError(response, "Could not delete contact.", payload.error));
      }

      removeContact(contactDraft.id);
      setContactsMessage("Contact deleted.");
    } catch (error) {
      setContactSaveError(error instanceof Error ? error.message : "Could not delete contact.");
    } finally {
      setIsDeletingContact(false);
    }
  }

  function handleResetContact() {
    if (isCreatingContact) {
      setContactDraft(createEmptyContact());
      setContactSaveMessage("");
      setContactSaveError("");
      return;
    }

    const savedContact = contacts.find((contact) => contact.id === selectedContactId);
    setContactDraft(savedContact ?? createEmptyContact());
    setContactSaveMessage("");
    setContactSaveError("");
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <CrmMetricCard label="Total Contacts" value={String(contacts.length)} detail="Imported and manually refined contact records." />
        <CrmMetricCard label="Birthdays Recorded" value={String(birthdaysRecordedCount)} detail="Ready for birthday reminders and seasonal outreach." />
        <CrmMetricCard label="Active Contacts" value={String(activeContactsCount)} detail="Contacts currently eligible for future campaigns." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(380px,0.95fr)]">
        <section className="space-y-6 rounded-[32px] border border-brand-100 bg-white p-6 shadow-soft lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">Contacts Workspace</p>
              <h2 className="mt-2 font-heading text-3xl text-brand-900">Import, search, and edit Yan&apos;s contacts</h2>
              <p className="mt-3 text-sm leading-6 text-brand-700">
                This page is now dedicated just to contact management, so the table and editor have room to breathe.
              </p>
            </div>
            <button
              type="button"
              onClick={startNewContact}
              className="rounded-full border border-brand-300 px-5 py-2.5 text-sm font-semibold text-brand-900"
            >
              New Contact
            </button>
          </div>

          <div className="rounded-3xl border border-brand-100 bg-brand-50/60 p-5">
            <form className="space-y-4" onSubmit={handleImport}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-brand-900">Upload contacts CSV</p>
                  <p className="mt-1 text-xs leading-5 text-brand-700">
                    Re-import anytime. Existing records are merged by contact id.
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

            <div className="mt-4 space-y-3">
              {contactsMessage ? <CrmMessage tone="success">{contactsMessage}</CrmMessage> : null}
              {contactsError ? <CrmMessage tone="error">{contactsError}</CrmMessage> : null}
            </div>
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
            <p className="mt-2 text-xs text-brand-600">Click any contact row to open it in the editor.</p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-brand-100">
            <div className="overflow-x-auto">
              <table className="min-w-[680px] w-full text-left text-sm">
                <thead className="bg-brand-50 text-brand-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Birthday</th>
                    <th className="px-4 py-3 font-semibold">City</th>
                    <th className="px-4 py-3 font-semibold text-right">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-brand-700">
                        No CRM contacts found.
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.map((contact) => {
                      const isSelected = contact.id === selectedContactId;

                      return (
                        <tr
                          key={contact.id}
                          onClick={() => selectContact(contact.id)}
                          className={`border-t border-brand-100 align-top transition ${
                            isSelected ? "bg-brand-50/80" : "bg-white hover:bg-brand-50/40"
                          }`}
                        >
                          <td className="cursor-pointer px-4 py-3 text-brand-900">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold">{contact.fullName || "-"}</p>
                                <p className="mt-1 text-xs text-brand-600">{isSelected ? "Open in editor" : "Click to edit"}</p>
                              </div>
                              {isSelected ? (
                                <span className="rounded-full bg-brand-900 px-2.5 py-1 text-[11px] font-semibold text-white">Editing</span>
                              ) : null}
                            </div>
                          </td>
                          <td className="cursor-pointer px-4 py-3 text-brand-700">{contact.email || "-"}</td>
                          <td className="cursor-pointer px-4 py-3 text-brand-700">{formatBirthday(contact)}</td>
                          <td className="cursor-pointer px-4 py-3 text-brand-700">{contact.city || "-"}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                selectContact(contact.id);
                              }}
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
        </section>

        <aside className="h-fit rounded-[32px] border border-brand-100 bg-[#fcfcfa] p-6 shadow-soft xl:sticky xl:top-24">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Contact Editor</p>
              <h3 className="mt-2 font-heading text-2xl text-brand-900">
                {isCreatingContact ? "New Contact" : getContactDisplayName(contactDraft)}
              </h3>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-800">
              {isCreatingContact ? "manual" : contactDraft.source || "manual"}
            </span>
          </div>

          {isCreatingContact || contactDraft.id ? (
            <div className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <CrmField label="First Name" value={contactDraft.firstName} onChange={(value) => updateContactDraft("firstName", value)} />
                <CrmField label="Last Name" value={contactDraft.lastName} onChange={(value) => updateContactDraft("lastName", value)} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <CrmField label="Email" type="email" value={contactDraft.email} onChange={(value) => updateContactDraft("email", value)} />
                <CrmField label="Phone" value={contactDraft.phone} onChange={(value) => updateContactDraft("phone", value)} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <CrmField
                  label="Birthday"
                  value={contactDraft.birthdayRaw}
                  onChange={(value) => updateContactDraft("birthdayRaw", value)}
                  placeholder="MM/DD/YYYY or MM/DD"
                />
                <CrmField label="City" value={contactDraft.city} onChange={(value) => updateContactDraft("city", value)} />
              </div>

              <CrmField
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

              <CrmTextAreaField label="Notes" value={contactDraft.notes} onChange={(value) => updateContactDraft("notes", value)} rows={7} />

              <label className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm text-brand-900">
                <input
                  type="checkbox"
                  checked={contactDraft.isActive}
                  onChange={(event) => updateContactDraft("isActive", event.target.checked)}
                  className="h-4 w-4 rounded border-brand-300"
                />
                Contact is active and can be used in future campaigns.
              </label>

              <div className="space-y-3">
                {contactSaveMessage ? <CrmMessage tone="success">{contactSaveMessage}</CrmMessage> : null}
                {contactSaveError ? <CrmMessage tone="error">{contactSaveError}</CrmMessage> : null}
              </div>

              <div className="grid gap-2 rounded-2xl border border-brand-100 bg-white p-4 text-xs text-brand-600">
                <p>Created: {isCreatingContact ? "Not saved yet" : formatContactUpdatedAt(contactDraft.createdAt)}</p>
                <p>Updated: {isCreatingContact ? "Not saved yet" : formatContactUpdatedAt(contactDraft.updatedAt)}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSaveContact}
                  disabled={isSavingContact}
                  className="rounded-full bg-brand-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSavingContact ? "Saving..." : isCreatingContact ? "Create Contact" : "Save Contact"}
                </button>
                <button
                  type="button"
                  onClick={handleResetContact}
                  className="rounded-full border border-brand-300 px-5 py-2.5 text-sm font-semibold text-brand-900"
                >
                  Reset
                </button>
                {!isCreatingContact && contactDraft.id ? (
                  <button
                    type="button"
                    onClick={handleDeleteContact}
                    disabled={isDeletingContact}
                    className="rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-60"
                  >
                    {isDeletingContact ? "Deleting..." : "Delete Contact"}
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-brand-200 bg-white px-4 py-10 text-center text-sm text-brand-600">
              Choose a contact from the table to edit it here.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
