import type { Metadata } from "next";
import "./globals.css";
import { SITE_CONFIG } from "@/config/site";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.baseUrl),
  title: {
    default: "HomeScope GTA | GTA Listings",
    template: "%s | HomeScope GTA"
  },
  description:
    "Browse curated homes in Vaughan, Richmond Hill, Aurora, Newmarket, and Toronto. Book a private showing directly with HomeScope GTA.",
  openGraph: {
    title: "HomeScope GTA",
    description:
      "Discover publicly advertisable GTA listings and book your private showing with HomeScope GTA.",
    url: SITE_CONFIG.baseUrl,
    siteName: "HomeScope GTA",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-CA">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
