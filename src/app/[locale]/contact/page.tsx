import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowUpRight,
  CalendarCheck,
  CheckCircle2,
  Feather,
  Gift,
  Map,
  Mail,
  Route,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { ContactForm } from "@/components/sections/contact-form";
import { Eyebrow, PageShell } from "@/components/sections/marketing-sections";
import { PageHero } from "@/components/sections/page-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { Reveal } from "@/components/ui/reveal";
import { buttonVariants } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { siteConfig } from "@/config/site";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

const howItWorksIcons = [UserRound, Map, CalendarCheck, Route];
// Matched by position to `pages.contact.assurances` in messages/he.json:
// דיסקרטי · ללא עלות · ללא התחייבות. There were only TWO icons here for three
// lines, so the array fell through to its `?? Clock` default: "discreet" wore a
// clock, "no cost" wore a shield, and "no obligation" wore the clock again.
const assuranceIcons = [ShieldCheck, Gift, Feather];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as "he" | "en", namespace: "pages.contact" });
  return pageMetadata({
    locale,
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/contact",
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as "he" | "en");
  const t = await getTranslations({ locale: locale as "he" | "en", namespace: "pages.contact" });
  const tNav = await getTranslations({ locale: locale as "he" | "en", namespace: "nav" });
  const tFooter = await getTranslations({ locale: locale as "he" | "en", namespace: "footer" });
  const whatYouGet = t.raw("whatYouGet") as string[];
  const howItWorks = t.raw("howItWorks") as { title: string; text: string }[];
  const assurances = t.raw("assurances") as string[];

  return (
    <PageShell>
      <JsonLd
        data={breadcrumbSchema(
          [{ name: tNav("contact"), path: "/contact" }],
          tNav("home")
        )}
      />
      <PageHero
        eyebrow={t("heroEyebrow")}
        title={
          <>
            {t("heroTitleLead")}
            <span className="text-gradient">{t("heroTitleHighlight")}</span>
          </>
        }
        description={t("heroDescription")}
      />

      <section className="bg-background px-6 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Form — sticks alongside the taller sidebar as the page scrolls,
              releasing once the sidebar ends. Not wrapped in Reveal: its
              transform would fight position:sticky. */}
          <div className="self-start lg:sticky lg:top-24">
            <Reveal>
              <div className="ring-shine relative overflow-hidden rounded-2xl border border-foreground/[0.08] bg-surface-1 p-6 shadow-card md:p-8">
                <div className="hairline-top absolute inset-x-0 top-0" />
                <ContactForm source="contact" />
              </div>
            </Reveal>
          </div>

          {/* Sidebar — the taller column; it scrolls while the form stays put. */}
          <Reveal delay={120}>
            <aside className="flex flex-col gap-5">
              <div className="rounded-2xl border border-brand/25 bg-brand/[0.05] p-6">
                <Eyebrow>{t("whatYouGetTitle")}</Eyebrow>
                <ul className="mt-5 space-y-3">
                  {whatYouGet.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 text-sm leading-normal text-foreground-soft"
                    >
                      <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-brand-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-foreground/[0.08] bg-surface-1 p-6">
                <p className="font-medium text-xs uppercase tracking-wider text-subtle-foreground">
                  {t("howItWorksLabel")}
                </p>
                <ol className="mt-5 space-y-5">
                  {howItWorks.map(({ title, text }, i) => {
                    const Icon = howItWorksIcons[i] ?? UserRound;
                    return (
                      <li key={title} className="relative flex gap-4">
                        {i < howItWorks.length - 1 ? (
                          <span
                            aria-hidden
                            className="absolute start-[18px] top-10 h-[calc(100%-12px)] w-px bg-foreground/[0.08]"
                          />
                        ) : null}
                        <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-foreground/12 bg-surface-2 text-brand-accent">
                          <Icon className="h-4.5 w-4.5" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {title}
                          </p>
                          <p className="mt-0.5 text-sm leading-normal text-muted-foreground">
                            {text}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="rounded-2xl border border-foreground/[0.08] bg-surface-1 p-6">
                <ul className="space-y-3">
                  {assurances.map((text, i) => {
                    const Icon = assuranceIcons[i] ?? ShieldCheck;
                    return (
                      <li
                        key={text}
                        className="flex gap-3 text-sm leading-normal text-muted-foreground"
                      >
                        <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0 text-brand-accent" />
                        {text}
                      </li>
                    );
                  })}
                </ul>
                {/* The page's own hero says "ואפשר לפנות ישירות בוואטסאפ", and
                    until now there was nothing here to press — the only direct
                    channel on the page was the mailto below. A woman who came
                    for the option the copy promised had to find the floating
                    corner button or scroll back to the footer. */}
                <div className="mt-5 flex flex-col gap-3 border-t border-foreground/[0.06] pt-4">
                  <WhatsAppLink
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "h-11 w-full rounded-lg px-5"
                    )}
                  >
                    <WhatsAppIcon className="h-4.5 w-4.5 shrink-0 text-[#25d366]" />
                    {tFooter("whatsapp")}
                  </WhatsAppLink>
                  <a
                    href={`mailto:${siteConfig.email}`}
                    className="inline-flex items-center gap-1.5 text-sm text-brand-accent transition-colors hover:text-brand-hover"
                  >
                    <Mail className="h-4 w-4" />
                    {t("emailPrefix")} {siteConfig.email}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </aside>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
