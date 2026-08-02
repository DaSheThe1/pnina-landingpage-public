import type { Metadata, Viewport } from "next";
import {
  Amatic_SC,
  Assistant,
  Bellefair,
  Bona_Nova,
  David_Libre,
  Frank_Ruhl_Libre,
  Heebo,
  Noto_Sans_Hebrew,
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

/* Body/UI face — HEEBO, and this is a deliberate reversal of v0.8.0.

   Pnina asked for "Helvetica World" for the body copy (her Canva document, July
   2026). That is a real family — Linotype's Helvetica World, which does ship
   Hebrew — but it is a paid Linotype licence and we do not have the files, so
   the question is what the free equivalent of "Helvetica, in Hebrew" is. It is
   Heebo: Oded Ezer's Hebrew drawn onto Christian Robertson's Roboto skeleton, a
   neo-grotesque with the flat terminals, closed apertures and even colour that
   make a Helvetica a Helvetica. Nothing else on Google Fonts is as close to the
   brief.

   ⚠️ THIS IS THE FACE 0.8.0 THREW OUT, AND THAT IS THE POINT. The note that
   stood here said Assistant "replaced Heebo in v0.8.0: Heebo is a fine face but
   reads as the Israeli system default, which is precisely what this site should
   not look like." That judgement was ours, and the client has now asked for the
   opposite thing: a plain, unremarkable, transparent body face. Reading as the
   Israeli default IS what "Helvetica World" asks for. So the reasoning is not
   overturned, it is outranked — do not "restore" Assistant on the strength of
   the old note.

   Assistant is not gone: it is declared below with `preload: false` and is one
   keystroke away at `?font=assistant`, which re-points the BODY face back to it
   (globals.css §8). If Daniel prefers the old colour on the page, that is the
   comparison to look at.

   DIGITS: Heebo's figures are LINING and genuinely UNIFORM-WIDTH by default,
   both measured. Lining — the ten digits share a baseline to within 2px at
   200px, where Bona Nova, the face that made `lining-nums` mandatory, spreads
   50px at the same size. Uniform — all ten advances are identical to the unit,
   562/1000em. So prices and phone numbers line up in a column with nothing
   asked for, and the site still carries no `tabular-nums` anywhere.
   ⚠️ That last conclusion is unchanged but its REASON has changed, and the old
   reason was wrong: the note that stood here (and the matching line in
   CLAUDE.md) said Assistant's digits were "uniform-width by design". They are
   not — Assistant's ten advances spread 41/1000em, so the columns it was
   credited with never actually lined up. Heebo's do. Do not re-copy the old
   claim about Assistant anywhere.

   SUBSETS: `hebrew` AND `latin`. The letters and ₪ ride in hebrew; the DIGITS
   and the curly quotes live in latin. Dropping latin would hand every price and
   phone number to a fallback. */
const heebo = Heebo({
  variable: "--font-sans-hebrew",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/* Display face for headlines only (h1/h2 + `.font-display`) — AMATIC SC.

   ── PNINA CHOSE THIS ONE HERSELF (2026-08-02) ──
   She was sent the Hebrew-supporting families on Google Fonts and picked Amatic
   SC. That settles a question three previous releases guessed at, so the guess
   work below is kept only as history: 0.11.4 shipped Frank Ruhl Libre (Daniel:
   "ugly"), 0.12.0 Bellefair, 0.12.x-0.16.x Bona Nova, and 0.17.0 briefly Noto
   Sans Hebrew — the last of those identified by matching the fallback face
   Canva was substituting into her own document, because the face she originally
   named ("Comika") is Latin-only and has no Hebrew glyphs at all. All of those
   were us inferring what she would like. This is her actually saying it.

   Amatic SC is a Hebrew-first design (Ben Nathan): condensed, hand-drawn,
   informal, and very light on the em. Three consequences are load-bearing.

   ⚠️ 1. IT IS A HEADLINE FACE AND NOTHING ELSE. It is condensed to about half
   the width of a normal sans and its strokes are hairlines; at body size it is
   genuinely hard to read, and this site is read by people in distress, some on
   a phone, some with low vision. It drives `h1`, `h2` and `.font-display` only.
   The body stays HEEBO. Do not extend this face to paragraphs, labels, buttons,
   form fields or the nav, however much more "designed" it would look.

   ⚠️ 2. IT NEEDS MORE SIZE THAN THE FACE IT REPLACED. Amatic's cap height and
   its set width are both far smaller than Noto Sans Hebrew's, so at an identical
   `rem` the headline reads a good deal smaller and lighter. Every display call
   site was re-judged at 1440 and 390 and sized UP rather than left alone; the
   ladder is tabulated in the h1/h2 note in globals.css. If you add a heading,
   size it against the ones already there, not against the body scale.

   ⚠️ 3. IT IS SET AT 700, AND 700 HERE IS STILL NOT "BOLD". Amatic ships 400
   and 700 and the 700 is a real master, so nothing is synthesised — but its 700
   is roughly the weight of a normal face's regular. That is a genuine tension
   with Daniel's standing "the headlines are supposed to be BOLD" rule, which he
   asked for three separate times. The rule is not repealed: 700 is still the
   floor here and nothing may set this family lower. It is simply the case that
   the client picked a light face, and a light face at its own maximum is what
   she picked. If the headlines read as too faint on the real site, the answer is
   SIZE, or going back to a different face with her — not a synthesised weight
   and not a `-webkit-text-stroke`, both of which this project has already tried
   and rejected once each.

   SUBSETS: `hebrew` AND `latin`. The Hebrew subset carries the letters and ₪;
   the DIGITS and the curly quotes live in latin, so dropping it would leave
   "₪990" and the process-spine numerals to a fallback.

   NUMERALS: Amatic SC is lining by default, like Heebo and Noto Sans Hebrew, so
   `font-variant-numeric: lining-nums` stays OFF the base rule. It lives on the
   `?font=bonanova` rule in globals.css §8, which is the one face in the building
   that sets oldstyle figures. */
const amaticSC = Amatic_SC({
  variable: "--font-display",
  subsets: ["hebrew", "latin"],
  weight: ["700"],
  display: "swap",
});

/* ⚠️ HISTORY, kept because it stops the same three faces being re-proposed.
   Noto Sans Hebrew was the 0.17.0 display face for about a day, identified from
   Pnina's Canva document by a binary letterform test rather than by resemblance:
   in her document the פ and ף are drawn with the inner tongue RISING ABOVE the
   top bar, and sweeping that one feature across all 137 Google-Fonts files with
   a Hebrew subset eliminates Heebo, Assistant, Rubik, Arimo, IBM Plex Sans
   Hebrew, Miriam Libre, Secular One, M PLUS, Segoe UI, Arial and Tahoma
   outright. It is kept below at `preload: false` for `?font=notosans`. */
const notoSansHebrew = Noto_Sans_Hebrew({
  variable: "--font-eval-notosans",
  subsets: ["hebrew", "latin"],
  weight: ["700"],
  display: "swap",
  preload: false,
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
   fetches; typing `?font=frank` still renders the 0.11.4 site exactly.

   The list holds ONE non-headline entry, Assistant — see the note on it below.
   `?font=` otherwise swaps the display face and nothing else. */
const frankRuhl = Frank_Ruhl_Libre({
  variable: "--font-eval-frank",
  subsets: ["hebrew", "latin"],
  weight: ["500", "700"],
  display: "swap",
  preload: false,
});

/* Bona Nova moved here when the client's own face arrived — it was the shipped
   headline from 0.12.x to 0.16.x and it lost nothing on quality; it lost because
   the brief changed from "pick a good display serif" to "use the face Pnina
   picked" (see the note above). `?font=bonanova` renders the 0.12.x-0.16.x site
   exactly, which is why it keeps BOTH its weights.
   ⚠️ It is the only OLDSTYLE-figure face in the building, so the `lining-nums`
   that used to sit on the base h1/h2 rule now sits on its own rule in
   globals.css §8. Move one and you must move the other, or `?font=bonanova`
   starts showing "₪990" bobbing off the baseline again. */
const bonaNova = Bona_Nova({
  variable: "--font-eval-bonanova",
  subsets: ["hebrew", "latin"],
  weight: ["400", "700"],
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

/* ASSISTANT — the site's body face from 0.8.0 until Heebo replaced it, and the
   one entry here that is not purely a headline candidate. It now does two jobs,
   from ONE declaration (globals.css §8):

     ?font=sans       headlines in Assistant 800 — unchanged behaviour, the
                      "no display face at all" comparison that has always been on
                      this switcher. It used to point at a variable called
                      `--font-eval-sans`; that name became a lie the moment the
                      shipped display face was itself a sans, so it is now
                      `--font-eval-assistant` and §8 names the face instead of
                      the category.
     ?font=assistant  the BODY back on Assistant, i.e. the 0.8.0-0.16.x reading
                      experience, for judging Heebo against the face it replaced.

   Hence the full weight range rather than the bare 800 this instance used to
   carry: 400-700 are what the body copy needs, 800 is what a headline needs.
   `preload: false` means none of it is fetched unless a parameter selects it, so
   the extra weights cost a real visitor nothing. */
const assistant = Assistant({
  variable: "--font-eval-assistant",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700", "800"],
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
      className={`${heebo.variable} ${amaticSC.variable} ${notoSansHebrew.variable} ${bonaNova.variable} ${bellefair.variable} ${frankRuhl.variable} ${notoSerifHebrew.variable} ${davidLibre.variable} ${assistant.variable} h-full antialiased`}
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
