import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact HomeScope GTA and send a message through our streamlined contact form."
};

export default function ContactPage() {
  return (
    <section className="site-container py-14 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-4xl text-brand-900">Contact HomeScope GTA</h1>
          <p className="mt-3 text-brand-700">
            Have a question or want help with your home search? Send a message and we'll get back to you shortly.
          </p>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}
