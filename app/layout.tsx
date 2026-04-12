import type { Metadata } from "next";
import "./globals.css";
import { SITE_CONFIG } from "@/config/site";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.baseUrl),
  title: {
    default: "HomeScope GTA",
    template: "%s | HomeScope GTA"
  },
  description: "Real estate search platform for GTA",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png"
  },
  openGraph: {
    title: "HomeScope GTA",
    description: "Find homes across Toronto and GTA",
    url: SITE_CONFIG.baseUrl,
    siteName: "HomeScope GTA",
    type: "website",
    images: ["/og-image.png"]
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
