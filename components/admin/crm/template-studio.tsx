"use client";

import { useState } from "react";
import { CrmField, CrmMessage, CrmMetricCard, CrmTextAreaField } from "@/components/admin/crm/shared";
import type { CrmTemplateRecord } from "@/types/crm";

interface CrmTemplateStudioProps {
  initialTemplates: CrmTemplateRecord[];
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

function formatTemplateUpdatedAt(value: string): string {
  if (!value) return "Not saved yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function formatTemplateKind(kind: CrmTemplateRecord["kind"]): string {
  return kind === "birthday" ? "Birthday" : "Holiday";
}

export function CrmTemplateStudio({ initialTemplates }: CrmTemplateStudioProps) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [templatesMessage, setTemplatesMessage] = useState("");
  const [templatesError, setTemplatesError] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [draftTemplate, setDraftTemplate] = useState<CrmTemplateRecord>(initialTemplates[0] ?? createEmptyTemplate());

  const enabledTemplatesCount = templates.filter((template) => template.enabled).length;
  const templatesWithImagesCount = templates.filter((template) => Boolean(template.imageUrl)).length;

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
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <CrmMetricCard label="Templates" value={String(templates.length)} detail="Birthday and holiday cards available to Yan." />
        <CrmMetricCard label="Active Templates" value={String(enabledTemplatesCount)} detail="Templates currently ready for real use." />
        <CrmMetricCard label="Templates With Images" value={String(templatesWithImagesCount)} detail="Saved cards that already include artwork." />
      </div>

      <CrmMessage tone="info">
        Template images now use Firebase Storage for full-size uploads. If Storage setup is still incomplete, small images under 600 KB can still be saved directly as a temporary fallback.
      </CrmMessage>

      <div className="grid gap-6 2xl:grid-cols-[260px_minmax(0,1.1fr)_minmax(320px,0.85fr)]">
        <section className="space-y-3 rounded-[32px] border border-brand-100 bg-white p-6 shadow-soft 2xl:sticky 2xl:top-24 2xl:h-fit">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">Template Library</p>
            <h2 className="mt-2 font-heading text-3xl text-brand-900">Choose a card</h2>
            <p className="mt-3 text-sm leading-6 text-brand-700">Contacts and templates are now separated, so this page only focuses on design.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
            {templates.map((template) => {
              const isSelected = draftTemplate.id === template.id;

              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => selectTemplate(template.id)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                    isSelected
                      ? "border-brand-900 bg-brand-900 text-white"
                      : "border-brand-200 bg-white text-brand-900 hover:border-brand-400"
                  }`}
                >
                  <p className="font-semibold">{template.name}</p>
                  <p className={`mt-1 text-xs ${isSelected ? "text-white/80" : "text-brand-600"}`}>{formatTemplateKind(template.kind)}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-5 rounded-[32px] border border-brand-100 bg-white p-6 shadow-soft lg:p-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">Template Editor</p>
            <h3 className="mt-2 font-heading text-3xl text-brand-900">{draftTemplate.name}</h3>
            <p className="mt-3 text-sm leading-6 text-brand-700">Update the subject line, card copy, signature, and image for this template.</p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <CrmField label="Template Name" value={draftTemplate.name} onChange={(value) => updateDraft("name", value)} />
            <CrmField label="Email Subject" value={draftTemplate.subject} onChange={(value) => updateDraft("subject", value)} />
          </div>

          <CrmField label="Preview Text" value={draftTemplate.previewText} onChange={(value) => updateDraft("previewText", value)} />

          <CrmField label="Headline" value={draftTemplate.headline} onChange={(value) => updateDraft("headline", value)} />

          <CrmTextAreaField label="Message Body" value={draftTemplate.body} onChange={(value) => updateDraft("body", value)} rows={8} />

          <CrmTextAreaField label="Signature" value={draftTemplate.signature} onChange={(value) => updateDraft("signature", value)} rows={4} />

          <div className="rounded-3xl border border-brand-100 bg-brand-50/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-brand-900">Card Image</p>
                <p className="mt-1 text-xs leading-5 text-brand-700">
                  Upload a holiday or birthday image. Wide landscape images work best in email, and keeping files around 1 to 2 MB usually gives a good balance of quality and load speed.
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-800">
                {draftTemplate.imageStorageMode === "storage"
                  ? "Stored in Firebase Storage"
                  : draftTemplate.imageStorageMode === "embedded"
                    ? "Stored in CRM collection"
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
                <img src={draftTemplate.imageUrl} alt={draftTemplate.name} className="h-64 w-full object-cover" />
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-brand-200 bg-white px-4 py-10 text-center text-sm text-brand-600">
                No image uploaded yet.
              </div>
            )}
          </div>
        </section>

        <aside className="h-fit space-y-5 rounded-[32px] border border-brand-100 bg-[#fcfcfa] p-6 shadow-soft 2xl:sticky 2xl:top-24">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Template Status</p>
              <p className="mt-2 text-sm text-brand-700">Last updated: {formatTemplateUpdatedAt(draftTemplate.updatedAt)}</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-800">
              {draftTemplate.enabled ? "Active" : "Paused"}
            </span>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm text-brand-900">
            <input
              type="checkbox"
              checked={draftTemplate.enabled}
              onChange={(event) => updateDraft("enabled", event.target.checked)}
              className="h-4 w-4 rounded border-brand-300"
            />
            Template is active and ready to use.
          </label>

          <div className="space-y-3">
            {templatesMessage ? <CrmMessage tone="success">{templatesMessage}</CrmMessage> : null}
            {templatesError ? <CrmMessage tone="error">{templatesError}</CrmMessage> : null}
          </div>

          <button
            type="button"
            onClick={handleSaveTemplate}
            disabled={isSavingTemplate}
            className="w-full rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSavingTemplate ? "Saving..." : "Save Template"}
          </button>

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
        </aside>
      </div>
    </div>
  );
}
