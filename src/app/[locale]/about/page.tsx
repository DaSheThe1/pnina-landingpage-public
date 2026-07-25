import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowRight,
  Boxes,
  FileText,
  MapPin,
  Network,
  Phone,
  Server,
  ShieldCheck,
  Terminal,
  Workflow,
  Wrench,
} from "lucide-react";

import {
  Eyebrow,
  FinalCta,
  PageShell,
  WhySection,
} from "@/components/sections/marketing-sections";
import { PageHero } from "@/components/sections/page-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { Reveal } from "@/components/ui/reveal";
import { buttonVariants } from "@/components/ui/button";
import { MessageVideo } from "@/components/ui/message-video";
import { PortraitFrame } from "@/components/ui/portrait-frame";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { media, videoSrc, videos } from "@/content/media";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { breadcrumbSchema, pageMetadata, personSchema } from "@/lib/seo";
import { cn } from "@/lib/utils";

const credentialIcons = [
  Server,
  Terminal,
  Workflow,
  FileText,
  Network,
  ShieldCheck,
];
const quickFactIcons = [MapPin, Wrench, Boxes];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as "he" | "en", namespace: "pages.about" });
  return pageMetadata({
    locale,
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/about",
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as "he" | "en");
  const t = await getTranslations({ locale: locale as "he" | "en", namespace: "pages.about" });
  const tNav = await getTranslations({ locale: locale as "he" | "en", namespace: "nav" });
  const tCommon = await getTranslations({ locale: locale as "he" | "en", namespace: "common" });
  const tFooter = await getTranslations({ locale: locale as "he" | "en", namespace: "footer" });
  const tWa = await getTranslations({ locale: locale as "he" | "en", namespace: "floatingWhatsapp" });
  const tVideo = await getTranslations({ locale: locale as "he" | "en", namespace: "pages.about.video" });
  const quickFacts = t.raw("quickFacts") as string[];
  const story = t.raw("story") as string[];
  // Credential lines are still awaiting her actual qualifications. Anything
  // left as a note to us must not reach a visitor's screen, so the unanswered
  // ones are dropped rather than rendered as "TODO(client): …" cards. When she
  // supplies real ones the grid fills itself back in.
  const credentials = (t.raw("credentials") as string[]).filter(
    (line) => !line.startsWith("TODO(") && !line.startsWith("PLACEHOLDER")
  );

  return (
    <PageShell>
      <JsonLd
        data={breadcrumbSchema(
          [{ name: tNav("about"), path: "/about" }],
          tNav("home")
        )}
      />
      <JsonLd data={personSchema()} />
      <PageHero
        eyebrow={t("heroEyebrow")}
        title={
          <>
            {t("heroTitleLead")}
            <span className="text-gradient">{t("heroTitleHighlight")}</span>
          </>
        }
        description={t("heroDescription")}
      >
        <div className="mt-7 flex flex-wrap gap-2.5">
          {quickFacts.map((fact, i) => {
            const Icon = quickFactIcons[i] ?? MapPin;
            return (
              <span
                key={i}
                className="inline-flex items-center gap-2 rounded-full border border-foreground/[0.1] bg-foreground/[0.03] px-3.5 py-1.5 text-sm text-foreground-soft"
              >
                <Icon className="h-4 w-4 text-brand-accent" />
                {fact}
              </span>
            );
          })}
        </div>
      </PageHero>

      <section className="bg-background px-6 py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <div>
              {/* Round avatar rather than the 4:3 frame this used to be. The
                  only photo we have is her 150×150 Instagram picture; stretched
                  across a half-width 4:3 panel the upscale is unmissable and it
                  would crop a square source besides. Restore a full frame here
                  once a real photograph lands in media.aboutPortrait. */}
              <div className="mb-8 flex justify-center lg:justify-start">
                <div className="relative">
                  <span
                    aria-hidden
                    className="absolute -inset-3 rounded-full border border-brand/30"
                  />
                  <span
                    aria-hidden
                    className="absolute -inset-6 rounded-full border border-teal/25"
                  />
                  <PortraitFrame
                    slot={media.aboutPortrait}
                    className="relative h-40 w-40 rounded-full sm:h-48 sm:w-48"
                    sizes="12rem"
                    objectPosition="object-center"
                    priority
                  />
                </div>
              </div>
              <Eyebrow>{t("storyEyebrow")}</Eyebrow>
              <h2 className="mt-5 text-3xl tracking-tight text-balance">
                {t("storyTitle")}
              </h2>
              {story.map((paragraph, i) => (
                <p
                  key={i}
                  className="mt-4 leading-7 text-muted-foreground"
                >
                  {paragraph}
                </p>
              ))}
              <p className="mt-4 font-medium leading-7 text-foreground">
                {t("storyClose")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className={cn(
                    buttonVariants({ variant: "brand" }),
                    "h-11 rounded-lg px-5 text-[15px]"
                  )}
                >
                  {tCommon("bookAuditPrimary")}
                  <ArrowRight data-icon="inline-end" />
                </Link>
                <a
                  href={siteConfig.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={tWa("aria")}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-11 rounded-lg px-5 text-[15px]"
                  )}
                >
                  <WhatsAppIcon className="h-4.5 w-4.5 shrink-0 text-[#25d366]" />
                  {tFooter("whatsapp")}
                </a>
                <a
                  href={`tel:${siteConfig.phoneE164}`}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-11 rounded-lg px-5 text-[15px]"
                  )}
                >
                  <Phone className="h-4 w-4 shrink-0 text-brand-accent" />
                  <span dir="ltr">{siteConfig.phone}</span>
                </a>
              </div>
            </div>
          </Reveal>

          {/* Her own long-form message, and then whatever credentials she
              confirms. The video carries far more than the cards do, so it goes
              first in the column. */}
          <div className="flex flex-col gap-10">
            <Reveal>
              <div className="text-center">
                <Eyebrow>{tVideo("eyebrow")}</Eyebrow>
                <h2 className="mb-8 mt-5 text-2xl tracking-tight text-balance sm:text-3xl">
                  {tVideo("title")}
                </h2>
                <MessageVideo
                  src={videoSrc("about")}
                  poster={videos.about.poster}
                  trackAs="about_video_watch"
                  labels={{
                    playWithSound: tVideo("playWithSound"),
                    playAria: tVideo("playAria"),
                    loading: tVideo("loading"),
                    noVideoNote: tVideo("noVideoNote"),
                    fullscreen: tVideo("fullscreen"),
                    fullscreenAria: tVideo("fullscreenAria"),
                  }}
                />
              </div>
            </Reveal>

            <div className="grid gap-4 sm:grid-cols-2">
              {credentials.map((text, i) => {
                const Icon = credentialIcons[i] ?? Server;
                return (
                  <Reveal key={i} delay={i * 70}>
                    <div className="group h-full rounded-xl border border-foreground/[0.08] bg-foreground/[0.02] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:bg-foreground/[0.04] hover:shadow-card">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-foreground/12 bg-brand/10 text-brand-accent transition-transform duration-300 group-hover:scale-110">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="mt-4 text-sm font-medium leading-6 text-foreground-soft">
                        {text}
                      </p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <WhySection />
      <FinalCta />
    </PageShell>
  );
}
