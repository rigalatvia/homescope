import { SITE_CONFIG } from "@/config/site";

export function SiteStructuredData() {
  const siteUrl = new URL("/", SITE_CONFIG.baseUrl).toString();
  const logoUrl = new URL(SITE_CONFIG.logoPath, siteUrl).toString();

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}#organization`,
    name: SITE_CONFIG.name,
    alternateName: ["HomeScopeGTA", "Home Scope GTA"],
    url: siteUrl,
    logo: logoUrl,
    email: SITE_CONFIG.contactEmail,
    areaServed: SITE_CONFIG.primaryMarkets.map((city) => ({
      "@type": "City",
      name: city
    }))
  };

  const realEstateAgentSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${siteUrl}#real-estate-agent`,
    name: SITE_CONFIG.name,
    alternateName: ["HomeScopeGTA", "Home Scope GTA"],
    url: siteUrl,
    logo: logoUrl,
    email: SITE_CONFIG.contactEmail,
    parentOrganization: {
      "@id": `${siteUrl}#organization`
    },
    areaServed: SITE_CONFIG.primaryMarkets.map((city) => ({
      "@type": "City",
      name: city
    })),
    address: {
      "@type": "PostalAddress",
      addressRegion: "ON",
      addressCountry: "CA"
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}#website`,
    name: SITE_CONFIG.name,
    alternateName: ["HomeScopeGTA", "Home Scope GTA", "homescopegta.ca"],
    url: siteUrl,
    publisher: {
      "@id": `${siteUrl}#organization`
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_CONFIG.baseUrl}/listings?addressContains={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(realEstateAgentSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
    </>
  );
}
