import { SITE_CONFIG } from "@/config/site";

export function SiteStructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_CONFIG.baseUrl}/#organization`,
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.baseUrl,
    logo: `${SITE_CONFIG.baseUrl}${SITE_CONFIG.logoPath}`,
    email: SITE_CONFIG.contactEmail,
    areaServed: SITE_CONFIG.primaryMarkets.map((city) => ({
      "@type": "City",
      name: city
    }))
  };

  const realEstateAgentSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${SITE_CONFIG.baseUrl}/#real-estate-agent`,
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.baseUrl,
    logo: `${SITE_CONFIG.baseUrl}${SITE_CONFIG.logoPath}`,
    email: SITE_CONFIG.contactEmail,
    parentOrganization: {
      "@id": `${SITE_CONFIG.baseUrl}/#organization`
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
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.baseUrl,
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
