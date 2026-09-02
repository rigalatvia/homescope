import type { Metadata } from "next";
import Link from "next/link";
import { Mail, ShieldCheck } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy Policy | HomeScope GTA",
  description:
    "Read the HomeScope GTA privacy policy for Google sign-in, saved homes, saved searches, contact forms, cookies, analytics, and real estate browsing data.",
  path: "/privacy"
});

const LAST_UPDATED = "September 1, 2026";

export default function PrivacyPage() {
  return (
    <section className="site-container py-12 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">HomeScope GTA</p>
        <h1 className="mt-3 font-heading text-4xl text-brand-900 sm:text-5xl">Privacy Policy</h1>
        <p className="mt-4 text-sm font-semibold text-brand-600">Last updated: {LAST_UPDATED}</p>
        <p className="mt-5 text-base leading-8 text-brand-700">
          HomeScope GTA helps visitors browse GTA real estate listings, school-area information, saved homes, saved
          searches, alerts, calculators, guides, and showing or contact requests. This policy explains what information
          we collect, how we use it, and the choices available to you.
        </p>

        <div className="mt-8 rounded-xl border border-brand-100 bg-brand-50/70 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-brand-800" />
            <p className="text-sm leading-7 text-brand-800">
              We use your information to operate HomeScope GTA, respond to requests, support saved account features, and
              improve the site. We do not sell your personal information.
            </p>
          </div>
        </div>

        <div className="mt-10 space-y-8">
          <PolicySection title="Information We Collect">
            <p>
              If you sign in with Google, we receive basic account information such as your name, email address, and
              profile picture, depending on what Google provides and what you authorize.
            </p>
            <p>
              If you save homes, save searches, request alerts, contact us, ask a listing question, request a showing,
              or use a rental help form, we may collect information you submit, such as your name, email address, phone
              number, message, listing details, saved listing IDs, saved search filters, alert preferences, notes, and
              consent choices.
            </p>
            <p>
              We may also collect technical and usage information such as pages viewed, referral source, device or
              browser type, cookie consent choices, and general interaction events.
            </p>
          </PolicySection>

          <PolicySection title="How We Use Information">
            <p>We use information to provide account features, saved homes, saved searches, alerts, and dashboards.</p>
            <p>
              We use contact and showing-request details to respond to your message, connect about a property, support a
              requested real estate workflow, and maintain records of communications.
            </p>
            <p>
              We use analytics and advertising measurement, where permitted by your cookie choices, to understand site
              performance, improve listings and guides, and measure marketing effectiveness.
            </p>
          </PolicySection>

          <PolicySection title="Google Sign-In">
            <p>
              Google sign-in is used to let you access account-based features such as saved homes, saved searches,
              alerts, and dashboard tools. Google may show you a consent screen before you sign in. HomeScope GTA only
              requests the basic account information needed for sign-in unless the consent screen clearly states
              otherwise.
            </p>
          </PolicySection>

          <PolicySection title="Cookies And Analytics">
            <p>
              HomeScope GTA uses necessary cookies or local storage for site functionality, authentication, and cookie
              preferences. Optional analytics and advertising cookies are controlled by the cookie banner or cookie
              settings button on the site.
            </p>
            <p>
              The site may use services such as Google Analytics and Meta Pixel when allowed by your consent choices.
            </p>
          </PolicySection>

          <PolicySection title="Sharing Information">
            <p>
              We may share information with service providers that help operate the site, including hosting, database,
              authentication, analytics, email, and communication providers. These providers are used to support
              HomeScope GTA operations.
            </p>
            <p>
              We may disclose information if required by law, to protect rights and safety, or to respond to lawful
              requests.
            </p>
          </PolicySection>

          <PolicySection title="Your Choices">
            <p>
              You can choose not to sign in, decline optional cookies, change cookie settings, or contact us to ask about
              your information. You can remove saved homes and saved searches from your dashboard when signed in.
            </p>
          </PolicySection>

          <PolicySection title="Real Estate And School Information">
            <p>
              Listing data, pricing, availability, school information, boundaries, programs, and market information can
              change. HomeScope GTA provides information for browsing and research, and details should be verified with
              the relevant listing source, real estate professional, school board, or public authority before you make a
              decision.
            </p>
          </PolicySection>

          <PolicySection title="Contact Us">
            <p>
              If you have questions about this policy, contact us at{" "}
              <a className="font-semibold text-brand-900 underline underline-offset-2" href={`mailto:${SITE_CONFIG.contactEmail}`}>
                {SITE_CONFIG.contactEmail}
              </a>
              .
            </p>
          </PolicySection>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/terms"
            className="inline-flex items-center gap-2 rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            Terms of Service
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-brand-200 px-5 py-3 text-sm font-semibold text-brand-900 transition hover:bg-brand-50"
          >
            <Mail className="h-4 w-4" />
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-heading text-2xl text-brand-900">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-brand-700 sm:text-base">{children}</div>
    </section>
  );
}
