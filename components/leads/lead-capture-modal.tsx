"use client";

import { useState } from "react";

interface LeadCaptureModalProps {
  listingId: string;
  listingTitle: string;
  listingAddress: string;
  listingCity: string;
  listingUrl: string;
}

type SubmitState = "idle" | "submitting" | "success" | "error";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  preferredDateTime: "",
  message: "",
  website: ""
};

export function LeadCaptureModal({ listingId, listingTitle, listingAddress, listingCity, listingUrl }: LeadCaptureModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const heading = "Book a Private Showing";

  const open = () => {
    setSubmitState("idle");
    setErrorMessage("");
    setSuccessMessage("");
    setIsOpen(true);
  };

  const close = () => setIsOpen(false);

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          intent: "showing_request",
          listingId,
          listingTitle,
          listingAddress,
          listingCity,
          listingUrl
        })
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Could not submit your request.");
      }

      setSubmitState("success");
      setSuccessMessage(
        typeof json.message === "string"
          ? json.message
          : "Your request was captured successfully. Email delivery is currently in setup mode."
      );
      setForm(initialForm);
    } catch (error) {
      setSubmitState("error");
      setErrorMessage(error instanceof Error ? error.message : "Submission failed.");
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={open}
          className="rounded-full bg-brand-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Book a Private Showing
        </button>
      </div>

      <div className="fixed bottom-4 left-0 right-0 z-30 px-4 md:hidden">
        <button
          type="button"
          onClick={open}
          className="w-full rounded-full bg-brand-800 px-6 py-3 text-sm font-semibold text-white shadow-soft"
        >
          Book Showing
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-brand-900/60 p-3">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-heading text-3xl text-brand-900">{heading}</h3>
              <button type="button" onClick={close} className="rounded-full border border-brand-200 px-3 py-1 text-sm text-brand-700">
                Close
              </button>
            </div>
            <p className="mt-1 text-sm text-brand-700">We&apos;ll contact you shortly to confirm your visit.</p>

            <p className="mt-2 text-sm text-brand-700">
              Listing: {listingAddress}, {listingCity}
            </p>

            {submitState === "success" ? (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                {successMessage}
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <FormField label="Full Name" htmlFor="fullName" required>
                  <input
                    id="fullName"
                    name="fullName"
                    value={form.fullName}
                    onChange={onChange}
                    required
                    className="w-full rounded-lg border border-brand-200 px-3 py-2"
                  />
                </FormField>
                <FormField label="Email" htmlFor="email" required>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={onChange}
                    required
                    className="w-full rounded-lg border border-brand-200 px-3 py-2"
                  />
                </FormField>
                <FormField label="Phone" htmlFor="phone" required>
                  <input
                    id="phone"
                    name="phone"
                    value={form.phone}
                    onChange={onChange}
                    required
                    className="w-full rounded-lg border border-brand-200 px-3 py-2"
                  />
                </FormField>
                <FormField label="Preferred Date/Time" htmlFor="preferredDateTime" required>
                  <input
                    id="preferredDateTime"
                    name="preferredDateTime"
                    type="datetime-local"
                    value={form.preferredDateTime}
                    onChange={onChange}
                    required
                    className="w-full rounded-lg border border-brand-200 px-3 py-2"
                  />
                </FormField>
                <FormField label="Message" htmlFor="message" required>
                  <textarea
                    id="message"
                    name="message"
                    value={form.message}
                    onChange={onChange}
                    rows={4}
                    required
                    className="w-full rounded-lg border border-brand-200 px-3 py-2"
                  />
                </FormField>

                <input
                  aria-hidden="true"
                  tabIndex={-1}
                  name="website"
                  value={form.website}
                  onChange={onChange}
                  className="hidden"
                  autoComplete="off"
                />

                {submitState === "error" && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>}

                <button
                  type="submit"
                  disabled={submitState === "submitting"}
                  className="w-full rounded-full bg-brand-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitState === "submitting" ? "Submitting..." : "Book a Private Showing"}
                </button>
              </form>
            )}

            <div className="mt-5 rounded-xl border border-brand-100 bg-brand-50/70 p-4 text-sm text-brand-700">
              <p className="font-semibold text-brand-900">Why connect with us</p>
              <ul className="mt-2 space-y-1">
                <li>Local GTA market coverage</li>
                <li>Quick response time</li>
                <li>No obligation</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FormField({
  label,
  htmlFor,
  children,
  required
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-brand-800">
      {label} {required && <span className="text-red-600">*</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}
