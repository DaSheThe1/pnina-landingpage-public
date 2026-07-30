"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

type ConsentState = {
  ad_personalization: "denied" | "granted";
  ad_storage: "denied" | "granted";
  ad_user_data: "denied" | "granted";
  analytics_storage: "denied" | "granted";
};

/**
 * Loads GA4 only after the consent owner explicitly enables it.
 *
 * The initial `config` call sends the landing pageview. App Router navigation
 * is tracked manually afterward so each page is counted once.
 */
export function GoogleAnalytics({
  enabled,
  measurementId,
  consentDefaults,
  consentUpdate,
}: {
  enabled: boolean;
  measurementId?: string;
  consentDefaults: ConsentState;
  consentUpdate: ConsentState;
}) {
  const pathname = usePathname();
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!enabled || !measurementId) return;
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    if (typeof window.gtag !== "function") return;

    window.gtag("event", "page_view", {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [enabled, measurementId, pathname]);

  if (!enabled || !measurementId) return null;

  const measurementIdJson = JSON.stringify(measurementId);
  const consentDefaultsJson = JSON.stringify(consentDefaults);
  const consentUpdateJson = JSON.stringify(consentUpdate);

  return (
    <>
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', ${consentDefaultsJson});
          gtag('consent', 'update', ${consentUpdateJson});
          gtag('js', new Date());
          gtag('config', ${measurementIdJson});
        `}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
    </>
  );
}
