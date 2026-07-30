import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { whatsappHref } from "@/lib/whatsapp";

/**
 * Every WhatsApp button on the site.
 *
 * Use this rather than an `<a href={siteConfig.whatsappUrl}>`: a bare wa.me link
 * opens an empty chat, and the pre-filled opening line is the whole point of the
 * button here — it means a woman does not have to find words for why she is
 * writing before she has spoken to anyone.
 *
 * Styling stays at the call site (`className`, `children`), because these render
 * as an icon tile in the header, a full-width row in the mobile menu, a ghost
 * button beside her photo and a circle pinned to the corner. Only the href and
 * the default label are shared.
 *
 * Works in server and client components alike — `useTranslations` supports both.
 */
export function WhatsAppLink({
  children,
  className,
  /** Overrides the default `whatsapp.aria` label. */
  label,
  /** Overrides the default `whatsapp.message` opening line for one button. */
  message,
  onClick,
  noUnderline = false,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
  message?: string;
  onClick?: () => void;
  /** Marks button-like/icon presentations as opt-outs from link emphasis. */
  noUnderline?: boolean;
}) {
  const t = useTranslations("whatsapp");

  return (
    <a
      href={whatsappHref(message ?? t("message"))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label ?? t("aria")}
      data-a11y-no-underline={noUnderline ? "" : undefined}
      onClick={onClick}
      className={className}
    >
      {children}
    </a>
  );
}
