"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { CONSENT_UPDATED_EVENT, type ConsentChoice, getStoredConsentChoice } from "@/lib/consent";

interface MetaPixelScriptProps {
  pixelId?: string;
}

export function MetaPixelScript({ pixelId }: MetaPixelScriptProps) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!pixelId) return;

    const syncConsent = () => {
      setEnabled(getStoredConsentChoice() === "accepted");
    };

    syncConsent();

    const handleConsentUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<ConsentChoice>;
      setEnabled(customEvent.detail === "accepted");
    };

    window.addEventListener(CONSENT_UPDATED_EVENT, handleConsentUpdated as EventListener);
    window.addEventListener("storage", syncConsent);

    return () => {
      window.removeEventListener(CONSENT_UPDATED_EVENT, handleConsentUpdated as EventListener);
      window.removeEventListener("storage", syncConsent);
    };
  }, [pixelId]);

  if (!pixelId || !enabled) return null;

  return (
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
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');
      `}
    </Script>
  );
}
