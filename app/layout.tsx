import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import { SITE_CONFIG } from "@/config/site";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";
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
                gtag('config', '${GA_MEASUREMENT_ID}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        ) : null}

        {META_PIXEL_ID ? (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
        ) : null}
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <SiteChatbot />
      </body>
    </html>
  );
}
