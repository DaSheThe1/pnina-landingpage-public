"use client";

import { useTranslations } from "next-intl";

export function SkipLink() {
  const t = useTranslations("accessibility");

  return (
    <a
      href="#main-content"
      className="fixed start-4 top-3 z-[200] -translate-y-24 rounded-lg bg-brand-deep px-4 py-3 font-medium text-brand-ink shadow-card outline-none transition-transform focus:translate-y-0 focus:ring-3 focus:ring-brand-accent/45"
    >
      {t("skipToContent")}
    </a>
  );
}
