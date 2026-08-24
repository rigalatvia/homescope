"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { ListingTransactionType } from "@/types/listing";

interface LeadCaptureModalProps {
  listingId: string;
  listingMlsNumber: string;
  listingTitle: string;
  listingAddress: string;
  listingCity: string;
  listingUrl: string;
  listingImageUrl?: string;
  listingTransactionType: ListingTransactionType;
}

type SubmitState = "idle" | "submitting" | "success" | "error";

const QUESTION_TOPICS = [
  "Listing availability",
  "Property details",
  "Price or offer guidance",
  "Neighbourhood or schools",
  "Showing options",
  "Documents or next steps",
  "Other"
];

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  agreesToTextMessages: false,
  message: "",
  isReadyToProvideDocs: false,
  hasMortgagePreapproval: false,
  website: ""
};

export function LeadCaptureModal({
  listingId,
  listingMlsNumber,
  listingTitle,
  listingAddress,
  listingCity,
  listingUrl,
  listingImageUrl,
  listingTransactionType
}: LeadCaptureModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [qualificationError, setQualificationError] = useState("");

  const heading = "Book a Private Showing";

  useEffect(() => {
    if (!user) return;

    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || user.displayName || "",
      email: prev.email || user.email || ""
    }));
  }, [user]);

  const open = () => {
    setSubmitState("idle");
    setErrorMessage("");
    setSuccessMessage("");
    setForm((prev) => ({
      ...prev,
      fullName: user?.displayName || prev.fullName,
      email: user?.email || prev.email
    }));
    setIsOpen(true);
  };

  const close = () => setIsOpen(false);

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const onCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.checked }));
    setQualificationError("");
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (listingTransactionType === "lease" && form.isReadyToProvideDocs !== true) {
      setQualificationError("Please confirm you are ready to provide the required lease documents.");
      return;
    }

    if (listingTransactionType === "sale" && form.hasMortgagePreapproval !== true) {
      setQualificationError("Please confirm your mortgage pre-approval acknowledgement before submitting.");
      return;
    }

    setSubmitState("submitting");
    setErrorMessage("");
    setQualificationError("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          preferredDateTime: "",
          intent: "showing_request",
          formType: "showing",
          status: "pending",
          listingId,
          listingMlsNumber,
          listingTitle,
          listingAddress,
          listingCity,
          listingUrl,
          listingImageUrl,
          userId: user?.uid,
          userEmail: user?.email || form.email,
          userName: user?.displayName || form.fullName,
          leadTransactionType: listingTransactionType
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
          : "Thank you! Your request has been sent successfully. Please expect an email from homescopegta@gmail.com and check your junk folder if you do not see it in the next few hours."
      );
      setForm(initialForm);
      const params = new URLSearchParams({
        returnTo: new URL(listingUrl).pathname
      });
      if (listingTitle.trim()) {
        params.set("listingTitle", listingTitle);
      }
      router.push(`/thank-you/showing-request?${params.toString()}`);
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
        <ModalPortal>
        <div className="fixed inset-0 z-[1200] flex items-start justify-center overflow-y-auto bg-brand-900/60 p-3 py-4 sm:py-6">
          <div className="max-h-[calc(100vh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-soft md:p-6">
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-heading text-2xl text-brand-900 md:text-3xl">{heading}</h3>
              <button type="button" onClick={close} className="rounded-full border border-brand-200 px-3 py-1 text-sm text-brand-700">
                Close
              </button>
            </div>
            <p className="mt-1 text-xs text-brand-700 md:text-sm">We&apos;ll contact you shortly to confirm your visit.</p>
            <p className="mt-1 text-xs text-brand-700 md:text-sm">
              Please expect an email from homescopegta@gmail.com and check your junk folder if you do not see it in the next few hours.
            </p>

            <p className="mt-1 text-xs text-brand-700 md:text-sm">
              Listing: {listingAddress}, {listingCity}
            </p>

            {submitState === "success" ? (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                {successMessage}
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-4 space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
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
                <label className="md:col-span-2 flex items-start gap-2 rounded-lg border border-brand-100 bg-brand-50/50 px-3 py-3 text-sm text-brand-800">
                  <input
                    id="agreesToTextMessages"
                    name="agreesToTextMessages"
                    type="checkbox"
                    checked={form.agreesToTextMessages}
                    onChange={onCheckboxChange}
                    className="mt-0.5 h-4 w-4 rounded border-brand-300"
                  />
                  <span>I agree to receive text messages at this phone number about my showing request.</span>
                </label>
                </div>
                <FormField label="Message" htmlFor="message" required>
                  <textarea
                    id="message"
                    name="message"
                    value={form.message}
                    onChange={onChange}
                    rows={3}
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

                {listingTransactionType === "lease" ? (
                  <div className="rounded-xl border border-brand-100 bg-brand-50/70 p-4">
                    <p className="font-semibold text-brand-900">Before scheduling a showing</p>
                    <p className="mt-2 text-sm text-brand-700">
                      Most landlords require the following documents before approving a showing:
                    </p>
                    <p className="mt-2 text-sm font-semibold text-brand-900">
                      Showing requests are reviewed only after these documents are submitted.
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-brand-700">
                      <li>Proof of income</li>
                      <li>Credit report</li>
                      <li>Employment letter</li>
                      <li>References</li>
                    </ul>
                    <p className="mt-2 text-sm text-brand-700">
                      Need a checklist?{" "}
                      <Link href="/guides/lease-documents" className="font-semibold text-brand-900 underline underline-offset-2">
                        View Documents Needed to Rent
                      </Link>
                    </p>
                    <label htmlFor="isReadyToProvideDocs" className="mt-3 flex items-start gap-2 text-sm text-brand-800">
                      <input
                        id="isReadyToProvideDocs"
                        name="isReadyToProvideDocs"
                        type="checkbox"
                        checked={form.isReadyToProvideDocs}
                        onChange={onCheckboxChange}
                        className="mt-0.5 h-4 w-4 rounded border-brand-300"
                        required
                      />
                      <span>I understand that my showing will be scheduled only after I submit these documents</span>
                    </label>
                  </div>
                ) : (
                  <div className="rounded-xl border border-brand-100 bg-brand-50/70 p-4">
                    <p className="text-sm text-brand-700">
                      For a smooth buying process, mortgage pre-approval may be required.
                    </p>
                    <label htmlFor="hasMortgagePreapproval" className="mt-3 flex items-start gap-2 text-sm text-brand-800">
                      <input
                        id="hasMortgagePreapproval"
                        name="hasMortgagePreapproval"
                        type="checkbox"
                        checked={form.hasMortgagePreapproval}
                        onChange={onCheckboxChange}
                        className="mt-0.5 h-4 w-4 rounded border-brand-300"
                        required
                      />
                      <span>I understand and I have mortgage pre-approval (if needed)</span>
                    </label>
                  </div>
                )}

                {qualificationError && (
                  <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{qualificationError}</p>
                )}

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

            <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/70 p-3 text-xs text-brand-700 md:text-sm">
              <p className="font-semibold text-brand-900">Why connect with us</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>Local GTA market coverage</span>
                <span className="hidden text-brand-300 md:inline">|</span>
                <span>Quick response time</span>
                <span className="hidden text-brand-300 md:inline">|</span>
                <span>No obligation</span>
              </div>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </>
  );
}

export function ListingQuestionModal({
  listingId,
  listingMlsNumber,
  listingTitle,
  listingAddress,
  listingCity,
  listingUrl,
  listingImageUrl,
  listingTransactionType
}: LeadCaptureModalProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    topic: QUESTION_TOPICS[0],
    message: "",
    website: ""
  });
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!user) return;

    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || user.displayName || "",
      email: prev.email || user.email || ""
    }));
  }, [user]);

  const open = () => {
    setSubmitState("idle");
    setErrorMessage("");
    setForm((prev) => ({
      ...prev,
      fullName: user?.displayName || prev.fullName,
      email: user?.email || prev.email
    }));
    setIsOpen(true);
  };

  const close = () => setIsOpen(false);

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState("submitting");
    setErrorMessage("");

    const messageParts = [
      `Question topic: ${form.topic}`,
      `Question: ${form.message.trim()}`,
      `MLS Number: ${listingMlsNumber}`,
      `Listing: ${listingAddress}, ${listingCity}`,
      `Listing URL: ${listingUrl}`
    ];

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim() || "Website visitor",
          email: form.email,
          phone: form.phone,
          agreesToTextMessages: false,
          preferredDateTime: "",
          message: messageParts.join("\n"),
          intent: "question",
          formType: "contact",
          status: "pending",
          listingId,
          listingMlsNumber,
          listingTitle,
          listingAddress,
          listingCity,
          listingUrl,
          listingImageUrl,
          userId: user?.uid,
          userEmail: user?.email || form.email,
          userName: user?.displayName || form.fullName || "Website visitor",
          leadTransactionType: listingTransactionType,
          website: form.website
        })
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Could not submit your question.");
      }

      setSubmitState("success");
      setForm({
        fullName: user?.displayName || "",
        email: user?.email || "",
        phone: "",
        topic: QUESTION_TOPICS[0],
        message: "",
        website: ""
      });
    } catch (error) {
      setSubmitState("error");
      setErrorMessage(error instanceof Error ? error.message : "Submission failed.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="rounded-full border border-brand-300 bg-white px-6 py-3 text-sm font-semibold text-brand-900 transition hover:border-brand-500 hover:bg-brand-50"
      >
        Ask for Details
      </button>

      {isOpen && (
        <ModalPortal>
        <div className="fixed inset-0 z-[1200] flex items-start justify-center overflow-y-auto bg-brand-900/60 p-3 py-4 sm:py-6">
          <div className="max-h-[calc(100vh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-soft md:p-6">
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-heading text-2xl text-brand-900 md:text-3xl">Ask for Details</h3>
              <button type="button" onClick={close} className="rounded-full border border-brand-200 px-3 py-1 text-sm text-brand-700">
                Close
              </button>
            </div>
            {submitState !== "success" ? (
              <>
                <p className="mt-1 text-sm text-brand-700">
                  Ask about MLS {listingMlsNumber}, the property, pricing, neighbourhood, schools, documents, or next steps.
                </p>
                <p className="mt-1 text-sm text-brand-700">Leave your email and your question, and we will reply with the listing details.</p>
              </>
            ) : null}

            {submitState === "success" ? (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                Thank you. Your question was received. We will reply by email shortly.
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-4 space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <FormField label="Name" htmlFor="questionFullName">
                    <input
                      id="questionFullName"
                      name="fullName"
                      value={form.fullName}
                      onChange={onChange}
                      className="w-full rounded-lg border border-brand-200 px-3 py-2"
                    />
                  </FormField>
                  <FormField label="Email" htmlFor="questionEmail" required>
                    <input
                      id="questionEmail"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={onChange}
                      required
                      className="w-full rounded-lg border border-brand-200 px-3 py-2"
                    />
                  </FormField>
                </div>
                <FormField label="Phone" htmlFor="questionPhone">
                  <input
                    id="questionPhone"
                    name="phone"
                    value={form.phone}
                    onChange={onChange}
                    className="w-full rounded-lg border border-brand-200 px-3 py-2"
                  />
                </FormField>
                <FormField label="What do you want to know?" htmlFor="questionTopic" required>
                  <select
                    id="questionTopic"
                    name="topic"
                    value={form.topic}
                    onChange={onChange}
                    required
                    className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2"
                  >
                    {QUESTION_TOPICS.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Question" htmlFor="questionMessage" required>
                  <textarea
                    id="questionMessage"
                    name="message"
                    value={form.message}
                    onChange={onChange}
                    rows={4}
                    required
                    placeholder="Example: Is this listing still available? Are there any offer dates, maintenance fees, rental restrictions, or school boundaries I should know about?"
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
                  {submitState === "submitting" ? "Sending..." : "Send Question"}
                </button>
              </form>
            )}
          </div>
        </div>
        </ModalPortal>
      )}
    </>
  );
}

function ModalPortal({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
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
