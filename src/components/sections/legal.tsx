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
      <h2 className="text-xl tracking-tight text-foreground">
        {title}
      </h2>
      <div className="mt-3 space-y-4 leading-7 text-muted-foreground [&_a]:font-medium [&_a]:text-brand-accent hover:[&_a]:text-brand-hover [&_li]:marker:text-subtle-foreground [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:ps-5">
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

// Resolves the {domain}/{email} placeholders and turns the contact email into a
// real mailto link wherever it appears in the copy.
function renderText(text: string): ReactNode {
  const resolved = text
    .replaceAll("{domain}", siteConfig.domain)
    .replaceAll("{email}", siteConfig.email);

  if (!resolved.includes(siteConfig.email)) return resolved;

  const parts = resolved.split(siteConfig.email);
  return parts.map((part, i) => (
    <Fragment key={i}>
      {i > 0 ? (
        <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
      ) : null}
      {part}
    </Fragment>
  ));
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
