"use client";

import { useState } from "react";

type SubmitState = "idle" | "submitting" | "success" | "error";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
  website: ""
};

export function ContactForm() {
  const [form, setForm] = useState(initialForm);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState("submitting");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Could not submit your message.");
      }

      setSubmitState("success");
      setSuccessMessage(
        typeof json.message === "string"
          ? json.message
          : "Your message was captured successfully. Email delivery is currently in setup mode."
      );
      setForm(initialForm);
    } catch (error) {
      setSubmitState("error");
      setErrorMessage(error instanceof Error ? error.message : "Submission failed.");
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-brand-100 bg-white p-8 shadow-soft">
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

      <FormField label="Phone (optional)" htmlFor="phone">
        <input
          id="phone"
          name="phone"
          value={form.phone}
          onChange={onChange}
          className="w-full rounded-lg border border-brand-200 px-3 py-2"
        />
      </FormField>

      <FormField label="Subject" htmlFor="subject" required>
        <input
          id="subject"
          name="subject"
          value={form.subject}
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
          rows={5}
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

      {submitState === "success" && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{successMessage}</p>
      )}

      {submitState === "error" && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={submitState === "submitting"}
        className="w-full rounded-full bg-brand-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitState === "submitting" ? "Submitting..." : "Submit"}
      </button>
    </form>
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
