import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import { SITE_CONFIG } from "@/config/site";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";
import { ConsentBanner } from "@/components/analytics/consent-banner";
import { MetaPixelScript } from "@/components/analytics/meta-pixel-script";
import { SiteChatbot } from "@/components/chat/site-chatbot";

const DEFAULT_GA_MEASUREMENT_ID = "G-1G84P57QZY";
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || DEFAULT_GA_MEASUREMENT_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.baseUrl),
  title: {
    default: "HomeScope GTA - Real Estate Listings & Document Hub Ontario",
    template: "%s | HomeScope GTA - Real Estate Listings & Document Hub Ontario"
  },
  description:
    "Browse real estate listings and manage all your home buying and leasing documents in one place across Toronto, Vaughan, Richmond Hill, Aurora, Newmarket, King, and surrounding Ontario areas.",
  applicationName: "HomeScope GTA",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png"
  },
  verification: GOOGLE_SITE_VERIFICATION
    ? {
        google: GOOGLE_SITE_VERIFICATION
      }
    : undefined,
  openGraph: {
    title: "HomeScope GTA - Real Estate Listings & Document Hub Ontario",
    description:
      "Browse real estate listings and manage all your home buying and leasing documents in one place across Toronto, Vaughan, Richmond Hill, Aurora, Newmarket, King, and surrounding Ontario areas.",
    url: SITE_CONFIG.baseUrl,
    siteName: "HomeScope GTA",
    type: "website",
    images: ["/og-image.png"]
  },
  twitter: {
    card: "summary_large_image",
    title: "HomeScope GTA - Real Estate Listings & Document Hub Ontario",
    description:
      "Browse real estate listings and manage all your home buying and leasing documents in one place across Toronto, Vaughan, Richmond Hill, Aurora, Newmarket, King, and surrounding Ontario areas.",
    images: ["/og-image.png"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-CA">
      <body>
        {GA_MEASUREMENT_ID ? (
          <>
            <Script id="google-consent-default" strategy="beforeInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('consent', 'default', {
                  ad_storage: 'denied',
                  ad_user_data: 'denied',
                  ad_personalization: 'denied',
                  analytics_storage: 'denied',
                  functionality_storage: 'granted',
                  personalization_storage: 'denied',
                  security_storage: 'granted'
                });
              `}
            </Script>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
              `}
            </Script>
          </>
        ) : null}

        <MetaPixelScript pixelId={META_PIXEL_ID} />
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <ConsentBanner />
        <SiteChatbot />
      </body>
    </html>
  );
}
