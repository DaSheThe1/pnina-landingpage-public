"use client";

import { useEffect, useRef, useState } from "react";
import * as CookieConsent from "vanilla-cookieconsent";

import { GoogleAnalytics } from "@/components/analytics/google-analytics";

import "vanilla-cookieconsent/dist/cookieconsent.css";
import "./minimal-cookie-consent.css";

const GOOGLE_CATEGORY = "google";
const GOOGLE_CONSENT_GRANTED = {
  ad_personalization: "granted",
  ad_storage: "granted",
  ad_user_data: "granted",
  analytics_storage: "granted",
} as const;
const GOOGLE_CONSENT_DENIED = {
  ad_personalization: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  analytics_storage: "denied",
} as const;

export type MinimalCookieConsentCopy = {
  accessibilityLabel: string;
  message: string;
  accept: string;
  reject: string;
  privacy: string;
};

type MinimalCookieConsentProps = {
  measurementId?: string;
  locale: string;
  privacyUrl: string;
  copy: MinimalCookieConsentCopy;
  cookieName?: string;
  cookiePath?: string;
  googleCookieDomain?: string;
  iconUrl?: string;
  rtlLocales?: string[];
};

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character
  );
}

function googleCookies(domain?: string): CookieConsent.CookieItem[] {
  const names = [/^_ga/, /^_gid$/, /^_gat/, /^_gac_/, /^_gcl_/];
  const hostCookies = names.map((name) => ({ name, path: "/" }));

  if (!domain) return hostCookies;

  return [
    ...hostCookies,
    ...names.map((name) => ({ name, path: "/", domain })),
  ];
}

/**
 * Minimal opt-in gate for Google Analytics and its cookies.
 *
 * When no valid measurement id is supplied this is a complete no-op: no
 * notice, consent cookie, Google script, global, or request is produced.
 */
export function MinimalCookieConsent({
  measurementId,
  locale,
  privacyUrl,
  copy,
  cookieName = "site_cookie_consent",
  cookiePath = "/",
  googleCookieDomain,
  iconUrl,
  rtlLocales = [],
}: MinimalCookieConsentProps) {
  const [googleAllowed, setGoogleAllowed] = useState(false);
  const googleAllowedRef = useRef(false);

  useEffect(() => {
    if (!measurementId) return;

    const applyGoogleChoice = () => {
      const allowed = CookieConsent.acceptedCategory(GOOGLE_CATEGORY);
      const wasAllowed = googleAllowedRef.current;

      if (!allowed && typeof window.gtag === "function") {
        window.gtag("consent", "update", GOOGLE_CONSENT_DENIED);
      }

      googleAllowedRef.current = allowed;
      setGoogleAllowed(allowed);

      // gtag.js cannot be reliably unloaded after it executes. A reload after
      // withdrawal starts a clean page where the Google tag never mounts.
      if (wasAllowed && !allowed) {
        window.location.reload();
      }
    };

    void CookieConsent.run({
      mode: "opt-in",
      autoClearCookies: true,
      disablePageInteraction: false,
      cookie: {
        name: cookieName,
        path: cookiePath,
        sameSite: "Lax",
        secure: window.location.protocol === "https:",
        expiresAfterDays: 182,
      },
      guiOptions: {
        consentModal: {
          layout: "cloud inline",
          position: "bottom center",
          equalWeightButtons: false,
          flipButtons: false,
        },
      },
      categories: {
        necessary: {
          enabled: true,
          readOnly: true,
        },
        [GOOGLE_CATEGORY]: {
          autoClear: {
            cookies: googleCookies(googleCookieDomain),
          },
        },
      },
      language: {
        default: locale,
        rtl: rtlLocales,
        translations: {
          [locale]: {
            consentModal: {
              label: copy.accessibilityLabel,
              description: `${escapeHtml(copy.message)} <a href="${escapeHtml(
                privacyUrl
              )}">${escapeHtml(copy.privacy)}</a>`,
              acceptAllBtn: copy.accept,
              acceptNecessaryBtn: copy.reject,
            },
            // Required by vanilla-cookieconsent's translation contract. The
            // footer reopens this same two-choice notice, so no category maze
            // or separate preferences screen is exposed.
            preferencesModal: {
              title: copy.accessibilityLabel,
              acceptAllBtn: copy.accept,
              acceptNecessaryBtn: copy.reject,
              savePreferencesBtn: copy.accept,
              sections: [],
            },
          },
        },
      },
      onConsent: applyGoogleChoice,
      onChange: applyGoogleChoice,
    }).then(() => {
      const consentRoot = document.getElementById("cc-main");
      if (!consentRoot) return;

      if (iconUrl) {
        consentRoot.style.setProperty(
          "--cc-cookie-image",
          `url(${JSON.stringify(iconUrl)})`
        );
      } else {
        consentRoot.style.removeProperty("--cc-cookie-image");
      }
    });
  }, [
    cookieName,
    cookiePath,
    copy,
    googleCookieDomain,
    iconUrl,
    locale,
    measurementId,
    privacyUrl,
    rtlLocales,
  ]);

  return (
    <GoogleAnalytics
      enabled={googleAllowed}
      measurementId={measurementId}
      consentDefaults={GOOGLE_CONSENT_DENIED}
      consentUpdate={GOOGLE_CONSENT_GRANTED}
    />
  );
}

export function CookieSettingsButton({
  enabled,
  label,
  className,
}: {
  enabled: boolean;
  label: string;
  className?: string;
}) {
  if (!enabled) return null;

  return (
    <button
      type="button"
      className={className}
      onClick={() => CookieConsent.show(true)}
    >
      {label}
    </button>
  );
}
