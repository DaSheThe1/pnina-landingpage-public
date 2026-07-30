import { Fragment, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { siteConfig } from "@/config/site";

export function LegalLayout({
  lastUpdated,
  children,
}: {
  lastUpdated: string;
  children: ReactNode;
}) {
  const t = useTranslations("legal");

  return (
    <section className="bg-background px-6 py-20">
      <article className="mx-auto max-w-3xl">
        <p className="font-medium text-xs uppercase tracking-wider text-subtle-foreground">
          {t("lastUpdatedLabel")} · {lastUpdated}
        </p>
        <div className="mt-10 space-y-10">{children}</div>
        <p className="mt-14 border-t border-foreground/[0.06] pt-6 text-xs leading-6 text-subtle-foreground">
          {t("disclaimer")}
        </p>
      </article>
    </section>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-[1.45rem] text-foreground">
        {title}
      </h2>
      <div className="mt-3 space-y-4 text-base leading-7 text-muted-foreground [&_a]:font-medium [&_a]:text-brand-accent hover:[&_a]:text-brand-hover [&_li]:marker:text-subtle-foreground [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:ps-5">
        {children}
      </div>
    </section>
  );
}

export type LegalContentSection = {
  title: string;
  paragraphs?: string[];
  list?: string[];
  paragraphsAfter?: string[];
};

/**
 * Resolves the placeholders the legal copy in `messages/he.json` is written
 * with, and turns the two contact routes into real links.
 *
 * ⚠️ EVERY TOKEN THE COPY CAN CONTAIN MUST BE LISTED HERE. `{phone}` was not,
 * and the accessibility statement — the one page whose whole job is telling a
 * disabled visitor how to reach a human — printed the literal string
 * "טלפון: {phone}." to production. next-intl cannot catch this: these strings
 * are read with `t.raw()` as a structured array of sections and interpolated
 * here, by hand, so a token nobody substituted simply survives to the screen.
 * Add a token to the copy and you add it to this function in the same commit.
 *
 * The phone renders exactly as it does in the footer and on /about: a `tel:`
 * link on the E.164 number, with the human-readable form forced `dir="ltr"` so
 * the digits do not reorder inside the RTL sentence around them.
 */
function renderText(text: string): ReactNode {
  const resolved = text.replaceAll("{domain}", siteConfig.domain);

  // Split on the tokens rather than on the substituted values, so a number or
  // an address that also appears literally in the copy is left as prose.
  const parts = resolved.split(/(\{email\}|\{phone\})/g);
  if (parts.length === 1) return resolved;

  return parts.map((part, i) => {
    if (part === "{email}") {
      return (
        <a key={i} href={`mailto:${siteConfig.email}`}>
          {siteConfig.email}
        </a>
      );
    }
    if (part === "{phone}") {
      return (
        <a key={i} href={`tel:${siteConfig.phoneE164}`} dir="ltr">
          {siteConfig.phone}
        </a>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function LegalSections({
  sections,
}: {
  sections: LegalContentSection[];
}) {
  return (
    <>
      {sections.map((section) => (
        <LegalSection key={section.title} title={section.title}>
          {section.paragraphs?.map((p, i) => (
            <p key={`p-${i}`}>{renderText(p)}</p>
          ))}
          {section.list ? (
            <ul>
              {section.list.map((item, i) => (
                <li key={`l-${i}`}>{renderText(item)}</li>
              ))}
            </ul>
          ) : null}
          {section.paragraphsAfter?.map((p, i) => (
            <p key={`a-${i}`}>{renderText(p)}</p>
          ))}
        </LegalSection>
      ))}
    </>
  );
}
