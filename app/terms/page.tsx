import type { Metadata } from "next";
import Link from "next/link";
import { Mail, ShieldCheck } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Terms of Service | HomeScope GTA",
  description:
    "Read the HomeScope GTA terms of service for using listings, school search, saved homes, saved searches, guides, calculators, and contact features.",
  path: "/terms"
});

const LAST_UPDATED = "September 1, 2026";

export default function TermsPage() {
  return (
    <section className="site-container py-12 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">HomeScope GTA</p>
        <h1 className="mt-3 font-heading text-4xl text-brand-900 sm:text-5xl">Terms of Service</h1>
        <p className="mt-4 text-sm font-semibold text-brand-600">Last updated: {LAST_UPDATED}</p>
        <p className="mt-5 text-base leading-8 text-brand-700">
          These terms apply when you use HomeScope GTA, including listings, school search, guides, calculators, saved
          homes, saved searches, alerts, contact forms, showing requests, and related tools.
        </p>

        <div className="mt-8 rounded-xl border border-brand-100 bg-brand-50/70 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-brand-800" />
            <p className="text-sm leading-7 text-brand-800">
              HomeScope GTA is an information and search platform. It is not a school board, government authority,
              financial advisor, legal advisor, or guarantee of listing availability.
            </p>
          </div>
        </div>

        <div className="mt-10 space-y-8">
          <TermsSection title="Using The Site">
            <p>
              You may use HomeScope GTA to browse public real estate information, compare listings, research school-area
              context, read guides, use calculators, save homes and searches, request alerts, and contact the HomeScope
              GTA team.
            </p>
            <p>
              You agree to use the site lawfully and not to interfere with the site, attempt unauthorized access, misuse
              data, scrape in a disruptive way, submit false information, or use the site to harm others.
            </p>
          </TermsSection>

          <TermsSection title="Accounts And Google Sign-In">
            <p>
              Some features require Google sign-in. You are responsible for keeping your Google account secure and for
              activity under your signed-in account. You may stop using account features at any time.
            </p>
          </TermsSection>

          <TermsSection title="Listings, Schools, And Market Information">
            <p>
              Real estate listings, prices, photos, property details, availability, taxes, fees, school information,
              boundaries, rankings, programs, and market data may be incomplete, delayed, inaccurate, or changed without
              notice.
            </p>
            <p>
              You should verify important information with the listing source, real estate professional, seller,
              landlord, school board, municipality, lender, lawyer, inspector, or other appropriate professional before
              making decisions.
            </p>
          </TermsSection>

          <TermsSection title="No Professional Advice">
            <p>
              Guides, calculators, school information, listing summaries, chatbot responses, and other content are for
              general information only. They are not legal, financial, mortgage, tax, insurance, inspection, appraisal,
              school eligibility, or real estate advice.
            </p>
          </TermsSection>

          <TermsSection title="Saved Homes, Searches, Alerts, And Messages">
            <p>
              Saved homes, saved searches, alerts, notes, dashboard features, forms, and chatbot features are provided as
              convenience tools. We may change, pause, remove, or limit these features as needed to operate the site.
            </p>
            <p>
              Alerts and messages are not guaranteed to be instant, complete, or error-free. You should not rely on an
              alert as your only way to monitor a property or market.
            </p>
          </TermsSection>

          <TermsSection title="Third-Party Services">
            <p>
              HomeScope GTA may rely on third-party services for authentication, hosting, maps, analytics, advertising
              measurement, email, listing data, and other operations. Third-party websites and services have their own
              terms and privacy practices.
            </p>
          </TermsSection>

          <TermsSection title="Limitation Of Liability">
            <p>
              HomeScope GTA is provided on an as-is and as-available basis. To the extent permitted by law, HomeScope GTA
              is not responsible for losses or damages arising from your use of the site, reliance on site content,
              unavailable features, data errors, delays, or third-party services.
            </p>
          </TermsSection>

          <TermsSection title="Changes To These Terms">
            <p>
              We may update these terms from time to time. The updated version will be posted on this page with a new
              last updated date.
            </p>
          </TermsSection>

          <TermsSection title="Contact Us">
            <p>
              If you have questions about these terms, contact us at{" "}
              <a className="font-semibold text-brand-900 underline underline-offset-2" href={`mailto:${SITE_CONFIG.contactEmail}`}>
                {SITE_CONFIG.contactEmail}
              </a>
              .
            </p>
          </TermsSection>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/privacy"
            className="inline-flex items-center gap-2 rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            Privacy Policy
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

function TermsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-heading text-2xl text-brand-900">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-brand-700 sm:text-base">{children}</div>
    </section>
  );
}
