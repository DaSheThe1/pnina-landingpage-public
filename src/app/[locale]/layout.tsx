import type { Metadata, Viewport } from "next";
import {
  Assistant,
  Bellefair,
  Bona_Nova,
  David_Libre,
  Frank_Ruhl_Libre,
  Noto_Serif_Hebrew,
} from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import { A11Y_BOOT_SCRIPT } from "@/components/accessibility/a11y-boot-script";
import { AccessibilityLauncher } from "@/components/accessibility/accessibility-launcher";
import { AccessibilityProvider } from "@/components/accessibility/accessibility-provider";
import { SkipLink } from "@/components/accessibility/skip-link";
import { Analytics } from "@/components/analytics/analytics";
import { MinimalCookieConsent } from "@/components/consent/minimal-cookie-consent";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { BackToTop, ScrollProgress } from "@/components/layout/scroll-utils";
import { SiteBackground } from "@/components/layout/site-background";
import { HoverLayer } from "@/components/motion/hover-layer";
import { REVEAL_BOOT_SCRIPT } from "@/components/motion/reveal-boot-script";
import { PAGE_BOOT_SCRIPT } from "@/components/layout/page-boot-script";
import { SandFloor } from "@/components/motion/sand-floor";
import { EvalMotionScript } from "@/components/eval/eval-motion-script";
import { EvalOverrides } from "@/components/eval/eval-overrides";
import { FloatingWhatsApp } from "@/components/layout/floating-whatsapp";
import { PageTransition } from "@/components/layout/page-transition";
import { LeadDialogProvider } from "@/components/lead/lead-dialog";
import { siteConfig } from "@/config/site";
import { publicEnv } from "@/lib/env";
import { ogImage } from "@/lib/seo";
import { localeDirection, routing, type Locale } from "@/i18n/routing";
import { pickClientMessages } from "@/i18n/client-messages";

import "../globals.css";

// Body/UI face. Assistant is a Hebrew-FIRST humanist sans (the Hebrew was drawn
// first and the Latin fitted to it, which is the opposite of most "supports
// Hebrew" fonts) with an open, unhurried lowercase and a calm Hebrew colour on
// the page. Its digits are all the same advance width by design, so prices and
// phone numbers line up in a column without asking for a `tnum` feature the
// font does not actually ship — see the note in globals.css.
//
// It replaced Heebo in v0.8.0: Heebo is a fine face but reads as the Israeli
// system default, which is precisely what this site should not look like.
const assistant = Assistant({
  variable: "--font-sans-hebrew",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/* Display face for headlines only (h1/h2 + `.font-display`) — BONA NOVA,
   SET AT A REAL 700.

   ── WHY THE FACE CHANGED AGAIN IN 0.12.x ──
   Daniel, 2026-07-30: "make the text bold. Either choose a bold font or just
   choose a font which has boldness, because it does not look like I wanted it
   to… and when I mean the headers, I mean everywhere the header is used."

   That is the third time he has asked for weight in the headlines, and the
   previous two answers both dodged it, because 0.12.0 had picked a face with no
   bold master (Bellefair, one weight, 400) and then tried to fake the weight
   with a 0.4px `-webkit-text-stroke`. A hairline stroke is a real technique and
   the argument for it was honest, but it grows a 400 by a hair — it cannot make
   a headline read BOLD, and Daniel could see that. The right fix is a display
   face that actually ships a bold.

   The five candidates already loaded for the `?font=` switcher were rendered at
   700, in the real hero, at the real hero size (53.6px at 1440px wide), and
   compared side by side:

     Bona Nova 700     ← THE WINNER. A 2019 Polish revival (Bona Sforza) whose
                          Hebrew is drawn with real stroke modulation and a
                          calligraphic finish. At 700 it is unambiguously bold
                          and still elegant: the thick/thin contrast survives
                          the weight instead of flattening into a slab, and the
                          Hebrew counters stay open at display size.
     Frank Ruhl 700       the ORIGINAL complaint ("ugly"), and the comparison
                          agreed — a book text serif thickened into a blunt,
                          slightly cramped headline.
     Noto Serif Hebrew    much wider on the em: the hero headline wrapped to
                          three lines at 1440px. Also the most default-looking
                          of the set.
     David Libre 700      reads as the Israeli office/tax-form default, which
                          is exactly what this site must not look like.
     Assistant 800        the body face, heavier. Legible, but then the site has
                          one voice at two weights and no display face at all.

   The full write-up, with the measured numbers, is docs/12-redesign-plan.md §K2.

   WEIGHTS: 700 for the headlines, and 400 as well because `.free-anchor__free`
   and the process-spine numerals sit in this family at text-ish sizes and a
   browser that only has the 700 would synthesise a fake 400 for them.

   ⚠️ NUMERALS: Bona Nova sets OLDSTYLE figures by default, so "₪990" and the
   process-spine "01" bob up and down off the baseline unless told otherwise.
   `font-variant-numeric: lining-nums` on the h1/h2/.font-display rule in
   globals.css is MANDATORY for this face, not a refinement. Do not remove it.

   SUBSETS: `hebrew` AND `latin`, and the latin one is not optional. The Hebrew
   subset carries the letters and ₪; the DIGITS and the curly quotes live in
   latin, so dropping it would leave "₪990" and the process-spine numerals to a
   fallback serif. */
const bonaNova = Bona_Nova({
  variable: "--font-display",
  subsets: ["hebrew", "latin"],
  weight: ["400", "700"],
  display: "swap",
});

/* ⚠️ TEMPORARY — the headline candidates behind `?font=` (globals.css §8 and
   src/lib/eval-flags.ts). These exist so Daniel can look at the alternatives on
   the real page instead of in a specimen. Delete the losers — and the two eval
   files — once he picks.

   `preload: false` on all of them is the whole reason this is cheap: Next then
   emits the @font-face rules but adds no `<link rel="preload">`, so the browser
   only fetches a file if something on the page actually renders in that family
   — which only happens when `?font=` has re-pointed `--font-display`. A visitor
   who never types the parameter downloads exactly the bytes she did before.

   Frank Ruhl Libre is IN THIS LIST now rather than in the default load. Moving
   its two weights off the critical path is ~100KB the shipped site no longer
   fetches; typing `?font=frank` still renders the 0.11.4 site exactly. */
const frankRuhl = Frank_Ruhl_Libre({
  variable: "--font-eval-frank",
  subsets: ["hebrew", "latin"],
  weight: ["500", "700"],
  display: "swap",
  preload: false,
});

/* Bellefair moved here in 0.12.x — it was the shipped face for exactly one
   release and lost the bold comparison by not having a bold at all (see the
   note on Bona Nova above). `?font=bellefair` is now how you look at the 0.12.0
   rendering, and it goes off the critical path with the rest of the losers. */
const bellefair = Bellefair({
  variable: "--font-eval-bellefair",
  subsets: ["hebrew", "latin"],
  weight: ["400"],
  display: "swap",
  preload: false,
});

const notoSerifHebrew = Noto_Serif_Hebrew({
  variable: "--font-eval-noto",
  subsets: ["hebrew", "latin"],
  weight: ["500", "700"],
  display: "swap",
  preload: false,
});

const davidLibre = David_Libre({
  variable: "--font-eval-david",
  subsets: ["hebrew", "latin"],
  weight: ["500", "700"],
  display: "swap",
  preload: false,
});

/* The `?font=sans` candidate: no serif at all, Assistant set at 800. It is a
   SECOND Assistant instance rather than an extra weight on the body one,
   because adding "800" to the body font would preload a weight every real
   visitor pays for and no shipped headline uses. */
const assistantDisplay = Assistant({
  variable: "--font-eval-sans",
  subsets: ["hebrew", "latin"],
  weight: ["800"],
  display: "swap",
  preload: false,
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// The "cream · gold · brown" design ships in both schemes and follows the
// reader's OS/browser preference — there is no in-page toggle. Declaring both
// tells the UA it may render form controls and scrollbars either way, and the
// two `themeColor` entries keep the mobile browser chrome matching `--canvas`
// in each scheme (see the DARK block at the bottom of globals.css). Change one
// of these and you must change the matching `--canvas` in the same commit.
//
// Note we do NOT set `darkreader-lock` here (the template did). Locking out a
// user's own reading-comfort extension is the wrong trade on this site — brand
// fidelity is worth less than someone being able to read the page the way they
// need to. See AGENTS.md.
export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf7f1" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1611" },
  ],
};

// Per-locale root metadata. Hebrew (default) lives under /he and English under
// /en — alternates expose both to crawlers via hreflang.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as "he", namespace: "pages.home" });
  const canonical = siteConfig.url;

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      // The one page whose <title> the brand query "פנינה פאף" must match is
      // the home page, and the template below does not apply to `default` —
      // so her name is carried here explicitly via siteConfig.defaultTitle.
      default: siteConfig.defaultTitle,
      template: `%s | ${siteConfig.name}`,
    },
    description: t("metaDescription"),
    alternates: {
      canonical,
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: canonical,
      siteName: siteConfig.name,
      locale: "he_IL",
      type: "website",
      // The static card. Declared explicitly here AND in `pageMetadata` so
      // every route carries one — Next does not inherit `openGraph.images`
      // into a child that declares its own `openGraph` block, which is how the
      // whole site shipped with no share image at all.
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("metaDescription"),
      images: [ogImage.url],
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  // Enables static rendering for this locale.
  setRequestLocale(locale as Locale);

  const dir = localeDirection[locale as Locale];
  const consent = await getTranslations({
    locale: locale as Locale,
    namespace: "cookieConsent",
  });

  // Only the namespaces the client bundle actually reads. Without this the
  // provider serialises the entire catalogue — terms of service and all — into
  // every page's RSC payload. See src/i18n/client-messages.ts for the rule that
  // decides what belongs in the list.
  const clientMessages = pickClientMessages(await getMessages());

  return (
    <html
      lang={locale}
      dir={dir}
      data-scroll-behavior="smooth"
      className={`${assistant.variable} ${bonaNova.variable} ${bellefair.variable} ${frankRuhl.variable} ${notoSerifHebrew.variable} ${davidLibre.variable} ${assistantDisplay.variable} h-full antialiased`}
      // Inline boot scripts below stamp attributes on this element before React
      // hydrates: Save-Data, accessibility choices (`data-a11y-*`) and the eval
      // motion knob (`data-motion` / `data-accent`). Server HTML therefore
      // legitimately differs from the first client frame here.
      suppressHydrationWarning
    >
      {/* NO `bg-background` here, and that is load-bearing as of 0.12.1.
          `--background` is no longer transparent — it is the translucent paper
          veil each `bg-background` SECTION paints so that type has something to
          sit on over the sand photograph (globals.css §10 and the note beside the
          token). Painting it on the body as well would spread that veil across
          the whole viewport, hero included, and put the sand back under a wash.
          The body's own background is set to `transparent` in globals.css. */}
      <body className="flex min-h-full flex-col text-foreground">
        {/* First by necessity: reload restoration and Save-Data have to settle
            before page content or media URLs are parsed. */}
        <script dangerouslySetInnerHTML={{ __html: PAGE_BOOT_SCRIPT }} />
        {/* TEMPORARY (2026-07 review round), and next on purpose: the sticky
            `?motion=force` knob has to resolve before the first paint, so this
            runs synchronously ahead of everything below it. For anyone who has
            never typed the parameter it reads two empty values and stops.
            src/components/eval/eval-motion-script.tsx. */}
        <EvalMotionScript />
        {/* Parser-blocking and next in the body: apply stored accessibility
            preferences before the first paint, so a
            visitor who asked for larger text or less motion never sees one
            frame of the other rendering.
            src/components/accessibility/a11y-boot-script.ts. */}
        <script dangerouslySetInnerHTML={{ __html: A11Y_BOOT_SCRIPT }} />
        {/* Also parser-blocking: it selects the supported reveal engine before
            the first paint. Reveals are transform-only, so content stays
            readable even if either engine later fails.
            src/components/motion/reveal-boot-script.ts. */}
        <script dangerouslySetInnerHTML={{ __html: REVEAL_BOOT_SCRIPT }} />
        <NextIntlClientProvider messages={clientMessages}>
          {/* Wraps everything: the motion layer, the reveals and the sand floor
              all read this provider's `reduceMotion` through
              `usePrefersReducedMotion`, so it has to sit above them. */}
          <AccessibilityProvider>
            <SkipLink />
            <SiteBackground />
            {/* The sand floor: a graded photograph fixed behind the whole site
                for EVERY visitor, plus a WebGL layer that stirs it under the
                pointer (and under a finger) for those who have not asked for
                less motion. Mounted here rather than inside the `?hover=`
                switcher because it is the page's background, not a cursor
                effect. */}
            <SandFloor />
            {/* TEMPORARY (D7): the four cursor-background candidates behind
                `?hover=sand|glow|grid|pearl|off`, `sand` being the default.
                Mounts nothing on touch devices or under reduced motion. Delete
                the three losers — and this line's switcher — once Daniel
                picks one. */}
            <HoverLayer />
            {/* TEMPORARY (2026-07 review round): stamps `data-motion` /
                `data-eval-font` on <html> when `?motion=force` / `?font=` are in
                the URL, and nothing at all otherwise. globals.css §7-§8. */}
            <EvalOverrides />
            <ScrollProgress />
            <LeadDialogProvider>
              <SiteHeader />
              <PageTransition>{children}</PageTransition>
              <SiteFooter />
              <BackToTop />
              {/* One balanced row at the bottom of every page: the WhatsApp
                  button on one side, the accessibility launcher on the other.
                  See globals.css §12. */}
              <FloatingWhatsApp />
              <AccessibilityLauncher />
            </LeadDialogProvider>
          </AccessibilityProvider>
        </NextIntlClientProvider>
        <Analytics />
        {/* `iconUrl` is a WebP, not the PNG it replaced. The notice draws this
            mark at 3.55rem (`#cc-main .cm::before` in minimal-cookie-consent.css)
            — about 57 CSS px — yet the PNG behind it was a 373x373 RGBA file
            weighing 286 KB, the second heaviest request on the whole site after
            the hero clip, and fetched at HIGH priority roughly a second into the
            load because the notice is on screen immediately. Its alpha channel
            was entirely opaque, so it was also paying for a fourth channel it
            never used. Same 373x373, re-encoded to WebP q95: 45.9 KB, a 240 KB
            saving off the first seconds. Measured mean channel delta at display
            size is below the lossless encode's own resampling noise. */}
        <MinimalCookieConsent
          measurementId={publicEnv.ga4MeasurementId}
          locale={locale}
          privacyUrl="/privacy"
          iconUrl="/cookie-consent-cookie.webp"
          cookieName="penina_cookie_consent"
          cookiePath="/"
          googleCookieDomain={`.${siteConfig.domain}`}
          rtlLocales={["he"]}
          copy={{
            accessibilityLabel: consent("accessibilityLabel"),
            message: consent("message"),
            accept: consent("accept"),
            reject: consent("reject"),
            privacy: consent("privacy"),
          }}
        />
      </body>
    </html>
  );
}
