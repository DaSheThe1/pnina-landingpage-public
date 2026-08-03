import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  CheckCircle2,
  Phone,
  Sparkles,
  Target,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { ContactForm } from "@/components/sections/contact-form";
import { LeadButton } from "@/components/lead/lead-button";
import { HeroVideo } from "@/components/sections/hero-video";
import { FreeCallAnchor } from "@/components/motion/free-call-anchor";
import type { LadderRung } from "@/components/motion/free-call-anchor";
import { ProcessSpine } from "@/components/motion/process-spine";
import { InstagramIcon } from "@/components/ui/instagram-icon";
import { PortraitFrame } from "@/components/ui/portrait-frame";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { hasMedia, media, type ImageSlot } from "@/content/media";
import { Reveal } from "@/components/ui/reveal";
import { audienceTopics } from "@/content/audience";
import { moments as momentConfig } from "@/content/moments";
import { services as serviceConfig } from "@/content/services";
import { processSteps } from "@/content/process";
import { founderDisplayName, siteConfig } from "@/config/site";
import { sectionIds } from "@/config/navigation";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type ServiceItem = { title: string; description: string; details: string[] };
type TitledText = { title: string; text: string };

/**
 * The three palette legs, as a card accent. Shared by the audience grid and the
 * moments list so the two new sections read as one system with the process
 * cards above them (which carry their own richer copy of this in STEP_TINTS).
 */
const CARD_TINTS = {
  plum: "border-brand/25 bg-brand-wash text-brand-accent",
  teal: "border-teal/25 bg-teal-soft/60 text-teal-deep",
  gold: "border-gold/35 bg-gold-soft/70 text-gold-deep",
} as const;

/* ──────────────────────────  Shared  ────────────────────────── */

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
      {children}
    </main>
  );
}

/**
 * ── THE EYEBROW IS GONE, AND IT IS NOT COMING BACK (2026-08-04, Pnina) ──
 *
 * Every section on this site used to open with a small pill carrying a dot and
 * a two-or-three-word label — "מי אני", "למי זה מתאים", "מתוך הליווי". Pnina
 * asked for all of them removed, in those words: *"remove all those
 * AI-generated looking small circle things that dictate what section it is
 * going to be, because it is useless and it is AI-generated"*.
 *
 * She is right about what they were. They restated the heading directly beneath
 * them in fewer words, which is the tell — a label that adds nothing is
 * decoration pretending to be structure, and this is the second thing on this
 * site she has identified as reading machine-written (the hero's
 * "ליווי אישי ודיסקרטי" was the first).
 *
 * So the component is DELETED rather than left unused: 14 `eyebrow` keys and 6
 * `heroEyebrow` keys came out of `messages/he.json` in the same commit, and
 * `SectionHeading` / `PageHero` no longer take the prop. The two places whose
 * pill carried real copy rather than a restatement — the contact page's
 * "מה מקבלים" line and /about's story label — keep their words as plain type.
 *
 * ⚠️ Do not reintroduce a section label component. If a section needs a word
 * above its heading, the heading is not doing its job.
 */
export function SectionHeading({
  title,
  description,
  align = "left",
  gradient = false,
}: {
  title: string;
  description?: string;
  align?: "left" | "center";
  gradient?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <h2
        className={cn(
          "text-[2.4rem] text-balance sm:text-[2.85rem]",
          gradient ? "text-gradient" : "text-foreground"
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

/* ──────────────────────────  Hero  ────────────────────────── */

/**
 * ── THE HERO, REBUILT AS A DIRECT-RESPONSE BLOCK (0.17.0) ──
 *
 * Pnina's brief, through Daniel, 2026-08-02: a main header, then a secondary
 * header, then the video, then the form — and *"this needs to be in a way where
 * the user can see all those things without even scrolling on the phone"*.
 *
 * So this section is now four things in one column and nothing else:
 *
 *     h1        the problem, named plainly and set large
 *     objections  three "בלי…" lines that remove the reasons not to call
 *     video     16:9, letterboxed (see hero-video.tsx)
 *     form      the real lead form, embedded — not a button that opens one
 *
 * ── WHAT CAME OUT, AND WHY ──
 *  • The eyebrow ("ליווי אישי ודיסקרטי"). She reads it as AI-written, and she is
 *    not wrong: it is a category label, not a sentence anyone would say.
 *  • The three reassurance pills ("דיסקרטיות מלאה" / "בקצב שלך" / "בלי
 *    התחייבות"). The objection lines now say all three, in her voice, as
 *    sentences. Keeping both would have been the same promise twice in 200px of
 *    the most valuable space on the site.
 *  • The `LeadButton` that opened the popup. The popup still exists and every
 *    other CTA on the site still uses it — this is the one place where the form
 *    itself is cheaper than a button that promises one.
 *  • `hero.subtitle`, her "שנים חייתי בהישרדות…" paragraph. Deleted outright
 *    rather than moved: it was a compressed retelling of `founder.body`, which
 *    sits one section below and tells the same story in her own fuller words,
 *    and its second half (40-60 דקות, בטלפון או בזום, ללא עלות) is stated in
 *    seven other places in `messages/he.json` — the offer panel, the process
 *    step, two FAQ answers. Nothing it said is now unsaid.
 *
 * ── THE HEADLINE IS ABOUT THE AFTERMATH, AND IT CARRIES NO NUMBER ──
 * Daniel's brief described the classic direct-response shape ("lose 10 kg in 90
 * days" over "without giving up eating out"). The second half of that ports and
 * is what the objection lines are. The FIRST half does not: a timeframe on
 * recovery from sexual assault would be an invented number about a real person's
 * healing, which AGENTS.md rule 3 forbids, and it would be a promise nobody can
 * keep. So the h1 names the problem instead of pricing the solution, and there
 * is no counter, no deadline and no "within X weeks" anywhere in this section.
 *
 * ── THE FOLD IS A REQUIREMENT, NOT A NICETY ──
 * At 390×844 there are ~780px under the 64px header, and every block above is
 * budgeted against it. Measured on 2026-08-03, as the bottom edge of each block
 * from the top of the document:
 *
 *     headline    137      video       499
 *     secondary   222      form/submit 812      ← 32px of the fold to spare
 *     note        253
 *
 * That is why the video lost its `max-w-[19rem]` cap, why the form runs in
 * `compact` mode (name and phone on one row, and no privacy note — see the long
 * notes on that prop in contact-form.tsx), and why `pt-3` rather than the old
 * `pt-6`. It fits at 390×844 and 393×852. It does NOT fit on a 375×667 iPhone
 * SE, where the submit button lands just below the fold; that is a knowingly
 * accepted limit on a screen size this audience largely does not carry, and it
 * is measured by `e2e/hero-fold.spec.ts` rather than assumed.
 * If you add anything to this section, something else has to come out. The
 * bottom padding is NOT spare room: it is the band her ring mark stands in, and
 * all of it is below the fold.
 */
export function HeroSection() {
  const t = useTranslations("hero");

  return (
    // ── `overflow-clip`, and NEVER `overflow-hidden` ──
    // The clip is load-bearing: the aurora below is 60rem wide, the two side
    // washes hang 12% off each edge, and the video's own halo (hero-video.tsx,
    // `-inset-x-16`) bleeds 4rem past its frame. Unclipped, this section gives
    // a 390px phone horizontal scroll.
    // The KEYWORD is load-bearing too. `overflow: hidden` makes an element a
    // SCROLL CONTAINER, and `animation-timeline: view()` — the scroll reveal,
    // globals.css §1 — resolves against the nearest scroll container rather
    // than against the viewport. While this said `hidden`, every [data-reveal]
    // in the hero measured itself against a box that never scrolls and froze at
    // whatever progress that fixed geometry happened to give it: on a phone the
    // subtitle, the CTA row and the badge row parked at 0.90, 0.55 and 0.23
    // opacity and no amount of scrolling moved them. `clip` clips to exactly
    // the same box, is NOT a scroll container, and is inside this project's
    // browser baseline (Safari 16 < Tailwind 4's own floor of 16.4).
    // The other way out is a wrapper that clips only the decoration — that is
    // what testimonials.tsx does, and its comment there is the long version.
    // It does not work here, because the bleed that has to be clipped is not
    // only decoration: the video halo lives inside the content.
    <section className="relative overflow-clip">
      {/* Backdrop layers */}
      {/* Low sun overhead, peach on one side, silver-blue on the other — the
          three washes off her reference photograph. The cool blob is the
          counterweight: without it the whole top of the page settles into one
          flat temperature and reads as a beige smear rather than as light. */}
      <div
        aria-hidden
        className="aurora-hero pointer-events-none absolute -top-40 left-1/2 h-[42rem] w-[60rem] -translate-x-1/2 animate-aurora rounded-full blur-[90px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-12%] top-24 h-[28rem] w-[28rem] wash-warm animate-float rounded-full blur-[100px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-12%] top-56 h-[26rem] w-[26rem] wash-cool animate-float rounded-full blur-[100px]"
      />

      {/* ── THE LIGHT RAYS (Pnina, 2026-08-03) ──
          Two diagonal shafts of light from the top corners, the one piece of
          furniture taken from the dark VSL page she sent as her model. It is a
          pure decoration layer: `aria-hidden`, no pointer events, no content,
          and the `.hero-rays` class it hangs on lives in globals.css §12 with
          the rest of the dark-mode light system.

          It is a STATIC gradient, not a sweep. Rule 4 in AGENTS.md: nothing on
          this page may loop while she reads. If this ever starts moving, it has
          become pressure furniture and it comes out. */}
      <div
        aria-hidden
        className="hero-rays pointer-events-none absolute inset-x-0 top-0 h-[34rem]"
      />

      {/* ── HER RING MARK, BEHIND THE HEADLINE (Daniel, 2026-08-03) ──
          *"There is a logo between the first section and the about section,
          which is on the left for some reason. The logo itself should be behind
          the header in the main area. Why is it there even where it is right
          now?"*

          Fair question, and the answer is that it was answering a different
          instruction. Pnina's note described the hero as a composition — the
          dark turquoise behind and *"לוגו בפינה שמאלית תחתונה"* — so it was
          pinned to the bottom-left corner of the section. On her brand board
          that corner is the bottom of a LOGO CARD; on a page it is the bottom of
          a very tall hero, which put the mark in the dead band between the form
          and the About section, off to one side, reading as a stray badge rather
          than as branding. Daniel is right that it looked wrong there.

          It is now a WATERMARK behind the headline: centred on the copy column,
          sitting behind the h1 at low opacity, which is where her own brand book
          puts the mark relative to her name. It reads as the page being hers
          rather than as an object someone left on it.

          ⚠️ It is HER logo — the four hairline ripples and the pearl off her
          brand book, redrawn as vector at `public/brand/pearl-rings.svg`. Read
          the comment inside that file before touching it; its colours are baked
          in on purpose, so DO NOT put a `text-*` or `bg-*` utility on this
          element, and do not swap in `pearl-mark.svg` (our scallop, which is the
          favicon and is drawn for 16-32px, not for display sizes).

          ⚠️ OPACITY IS A LEGIBILITY NUMBER, NOT A TASTE ONE. The h1 sits on top
          of this, so the mark is competing with the one thing on the page that
          must be readable. At 0.14 its gold hairlines are visible as texture and
          measured against `--canvas` they move the surface by under two levels
          of sRGB, which is inside the slack the headline's own contrast already
          carries. Do not raise it to make the mark "read" — make it BIGGER, the
          way a watermark is supposed to work.

          `-z-10` puts it under the content and above the washes, and it is
          `absolute`, so it costs the fold budget exactly nothing —
          e2e/hero-fold.spec.ts is tight and nothing decorative may spend it.

          A plain <img>, not next/image: it is a vector, so there is no ladder to
          pick a rung from, and the custom loader would only put a pointless
          `srcSet` on it. `alt=""` plus `aria-hidden` because the header already
          carries her name and her face as the page's real identity — this is the
          same mark a second time, and announcing it twice is noise. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/pearl-rings.svg"
        alt=""
        aria-hidden
        width={420}
        height={420}
        className="pointer-events-none absolute left-1/2 top-2 -z-10 h-52 w-52 -translate-x-1/2 opacity-[0.14] sm:top-4 sm:h-72 sm:w-72 lg:h-[26rem] lg:w-[26rem]"
      />

      {/* ── THE SCRIM, AND WHY THE HERO NEEDS ITS OWN ──
          Every other band on the site paints `--background`, the 40% paper veil
          that makes type readable over the photograph (globals.css, the note
          beside that token). This section deliberately does not: the hero is
          where her picture is supposed to be at full strength.
          But 0.17.0 also put the h1, three lines of copy AND a form into that
          bare stretch, over a photograph with a sea and a shadow in it. So the
          copy column gets a soft radial cream of its own — strongest behind the
          type, gone before the edges of the section, so the sunset still reads
          as a sunset around it. It is `-z-10` under the content and above the
          washes. Dark mode inverts it through `--canvas`. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-8 bottom-0 -z-10 bg-[radial-gradient(60%_55%_at_50%_38%,var(--canvas)_0%,color-mix(in_srgb,var(--canvas)_72%,transparent)_45%,transparent_78%)]"
      />

      {/* ── ONE CENTRED COLUMN, AT EVERY WIDTH (Daniel, 2026-08-02) ──
          *"There is the main header in the middle, followed by the secondary
          header in the middle, followed by the video, followed by the form. It
          shouldn't be like the thing on the right and then the video on the
          left."*

          This was a two-column grid from `lg` up: copy and form on the start
          side, video on the end side. That kept everything on one screen, but it
          cost the two things the brief actually cares about — the headline was
          no longer centred and the video was a third of the width, which on a
          desktop reads as a thumbnail rather than as the hero of the page.

          So the desktop now says the same thing the phone always did, in the
          same order: headline, objections, video, form. It is taller than one
          screen on a desktop and that is fine — the "no scrolling" requirement
          is about PHONES, where the stack still fits (e2e/hero-fold.spec.ts).
          Do not reintroduce a side-by-side layout here. */}
      {/* The bottom padding came back DOWN to pb-10/16/20 in 0.19.0. It had
          been pb-28/36/40, and that was not free space — it was the band her
          ring mark stood in while the mark was pinned to the bottom-left corner.
          The mark is a watermark behind the headline now, so the band it needed
          is gone with it, and leaving it would have been an empty 112-160px gap
          between the form and the About section. The two move together. */}
      {/* ⚠️ `px-4` ON A PHONE, NOT `px-6`, AND IT IS THE HEADLINE THAT NEEDS IT.
          Daniel, 2026-08-03: the h1 *"needs to be bolder, bigger text… as big as
          possible"*, looking at mobile, which he called the view that matters.
          The h1 has to stay TWO LINES (Pnina), so its ceiling is whatever size
          still lets the longer sentence sit on one line — i.e. it is set by the
          COLUMN WIDTH, not by the fold. Measured at 390px with Rubik 700:
              px-6 → column 332px → one line up to 1.65rem
              px-4 → column 348px → one line up to 1.86rem
              px-3 → column 356px → one line up to 1.86rem (no further gain)
          So 8px of padding is worth ~13% of headline size and px-3 is worth
          nothing on top of that. From `sm` up there is no pressure and the
          roomier gutter looks better, so this is a phone-only change.
          ⚠️ THE VIDEO'S NEGATIVE MARGIN MOVES WITH THIS. It steps out of this
          padding to sit ~4px from each screen edge; at `-mx-5` against `px-4`
          it would overhang the viewport by 4px and the "no horizontal scroll"
          test would fail. The two numbers are a pair — see hero-video.tsx. */}
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 pb-10 pt-3 sm:px-6 sm:pb-16 lg:pb-20 lg:pt-12">
        <div className="order-1 w-full max-w-4xl text-center">
          <Reveal>
            {/* Two BLOCKS, not two inline runs.
                The headline is two sentences, and while they were inline the
                browser chose the break itself. In RTL it kept choosing badly:
                the line filled up just before the full stop, so the sentence
                broke early and line two opened with a lonely "." — the
                punctuation of one sentence sitting at the head of the next.
                Making each sentence its own block means the break is ours, it
                is the same on a phone and on a desktop, and no neutral
                character can drift across it. Nothing else goes on this line. */}
            {/* ── NOT BLACK (Pnina, 2026-08-02) ──
                Line one used to be `--foreground`, a near-black warm brown. She
                asked for the headline not to be black and said she would send
                what she prefers, so BOTH lines are `--headline-accent` for now —
                her sea, and the same token the filled CTA resolves through, so
                the headline and the button cannot drift apart. When she sends a
                colour this is one token, not two call sites. */}
            {/* ── SIZE: TWO LINES IS NOW THE CONSTRAINT, AND THE FOLD IS STILL
                THE OTHER ONE (Pnina, 2026-08-03) ──
                She asked for the headline area to be louder and easier to see,
                and for these to be EXACTLY TWO LINES with no full stop on
                either. "Two lines" is a fact about the rendered box, not about
                the markup: each sentence is its own block below, so the headline
                sets on two lines only while each sentence FITS on one.

                It did not. The previous rung (2.2rem/3.17rem/3.8rem) was chosen
                against the fold alone and broke the first sentence in half on
                every width — three lines on a phone, and the note here used to
                argue that was fine. It is not what she asked for, so the rung
                came down until "את לא צריכה להסביר לי כלום", the longer of the
                two, sets on one line. It is the longer sentence that sets the
                ceiling at every breakpoint; the second has ~30% of slack.

                MEASURED, Rubik 700, rendered width of the longer sentence
                against the column it has to fit in:

                    phone 390px, column 332px
                        1.65rem → 304px   ← shipped, 28px spare
                        1.72rem → 324px      fits, 8px — inside font-load jitter
                        1.75rem → wraps, 3 lines
                    sm 640px, column 582px      (the tightest width in the range)
                        2.90rem → 550px   ← shipped, 32px spare
                        3.05rem → 574px      fits, 8px
                        3.10rem → wraps
                    lg ≥1024px, column 896px    (max-w-4xl, so width-independent)
                        4.50rem → 844px   ← shipped, 52px spare
                        4.70rem → 888px      fits, 8px
                        4.80rem → wraps

                Each rung is a step below its own ceiling on purpose. 8px of
                slack is about one glyph, and this line has to survive a fallback
                face during font swap, `.headline-neon`'s own metrics and any
                future word change without silently becoming three lines again.
                Note the DESKTOP rung went UP (3.8rem → 4.5rem): there is no fold
                on a desktop, so "louder" is free there and only the phone had to
                pay for the second line.

                ⚠️ THE FOLD IS STILL THE HARD CONSTRAINT (e2e/hero-fold.spec.ts).
                The phone rung is now well below what the fold would allow, so the
                headline is no longer what is spending the budget — the video is.
                That is the right order: do NOT spend the slack this bought by
                pushing the rung back up, and never by raising the numbers in the
                spec. If a future edit needs room, take it from the video.

                The loss of raw size is paid back by `.headline-neon` (globals.css)
                rather than by points: on the dark canvas the glow is what makes
                this read as the loudest thing on the screen. */}
            <h1 className="headline-neon text-headline-accent text-[1.82rem] leading-[1.08] text-balance sm:text-[2.9rem] lg:text-[4.5rem]">
              <span className="block">{t("titleLead")}</span>
              {/* The accent, and it is the same colour as the filled CTA below
                  by construction: `--headline-accent` resolves through
                  `--rose-deep` (globals.css `:root`). Since 0.17.0 that is
                  Pnina's terracotta rather than the orchid-magenta, and this
                  line moved with the button without being touched, which is
                  the entire point of the token. Do not put `text-brand-accent`
                  back here. */}
              <em className="mt-1 block font-display not-italic text-headline-accent">
                {t("titleHighlight")}
              </em>
            </h1>
          </Reveal>

          {/* ── THE LEAD HALF OF HER SENTENCE, IN OYSTER BEIGE ──
              This stays in the copy column, outside the video's frame (Daniel,
              2026-08-03) — it names the feeling, which is a statement about the
              page, where the half that moved into the frame is a caption for a
              specific clip.

              ⚠️ THE COLOUR IS ONE OF HER FIVE, and it is doing a job. Daniel:
              *"maybe better color to distinguish between main header?"* The h1
              above is her Pearl White #F8F7F4 (L 96%) and this used to be
              `--foreground-soft`, a derived near-white — two almost identical
              off-whites stacked, so the eye read them as one block of text and
              the headline stopped being the headline. It is now her Oyster Beige
              #DDD4C7 (L 82%), which is a visible step down in lightness AND a
              step across in temperature: warm against the pearl's neutral, so it
              separates twice over. Measured 12.31:1 on her canvas, far above the
              4.5 floor, so nothing is bought at the cost of legibility.
              Her Mist Grey #A8ADB2 was the other candidate and is the fallback
              if this reads too warm — it separates harder (L 68%) but reads as
              grey rather than as a colour, and this page has enough grey in it.
              ⚠️ Do NOT put a derived off-white back here. The point is that both
              lines are hers and that they are visibly different from each other.

              ── HER COMMA IS GONE (Daniel, 2026-08-03) ──
              The sentence ended "…להרגיש תקועה," because the two halves used to
              be one paragraph. They are in two different places now, so a
              trailing comma was punctuation pointing at nothing. Removed in
              `messages/he.json`, not here. */}
          {/* ── TWO LINES, AND BIGGER (Pnina, 2026-08-03) ──
              *"נמאס לך - לעבור לשורה ולהגדיל את הטקסט"*. It was one long
              sentence that wrapped wherever the column happened to end; the
              break is now hers and it falls before "ונמאס לך", which is the
              half that names the feeling she wants the reader to recognise.
              An array rather than a string with a `<br>`, matching how the
              process steps carry their lines: the break is CONTENT here, and
              content belongs in `messages/he.json` where she can move it.
              Sized up a rung and a half in the same pass — 1.2 → 1.35rem on a
              phone — because she asked for the text bigger too. */}
          <Reveal delay={80}>
            <p
              data-hero="secondary-lead"
              className="mx-auto mt-3 max-w-2xl text-[1.35rem] leading-snug text-heading-oyster sm:mt-6 sm:text-[1.6rem]"
            >
              {(t.raw("secondaryLead") as string[]).map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
          </Reveal>

          {/* ── THE SECONDARY HEADER IS HERS NOW (2026-08-02) ──
              This was three "בלי…" lines I wrote, each removing one reason not
              to call. Pnina replaced them with one sentence of her own, which
              does a different job: it names the feeling and then points at the
              video. Her three objections are therefore currently UNSAID in the
              hero — they still appear further down (the offer panel, the FAQ),
              but if the hero should answer them again they need a home that is
              not this line.

              ⚠️ ONE CHARACTER OF HERS WAS CHANGED. She wrote an en dash before
              "צפי". AGENTS.md bans en and em dashes in Hebrew copy — they read
              as machine-set English typography in a Hebrew sentence — so it is a
              comma. Nothing else in the sentence is touched.

              ── SPLIT IN THREE, NOT REWRITTEN (2026-08-03) ──
              In the dark VSL page she sent as her model, the equivalent line is
              underlined and the "watch it to the end" instruction is set larger
              and in the headline's colour. Her sentence is unchanged; it is now
              three keys so the markup can do that:

                  secondaryLead   the quiet half, the feeling being named
                  secondaryWatch  the instruction, loud: bigger, accent, underlined
                  secondaryPoint  her 👇🏻, pointing at the video

              The instruction is the only thing in this block that is allowed to
              compete with the h1, and it stays a step under it — the headline
              has to remain the loudest thing on the screen.

              TWO SMALL THINGS ARE DELIBERATE. The loud half stays in the BODY
              face (Heebo bold), not `font-display`: Rubik is headings-only on
              this site, and a paragraph fragment is not a heading. And the 👇🏻
              is `aria-hidden` — it is a pointer at the video, and a screen
              reader announcing "backhand index pointing down, light skin tone"
              in the middle of her sentence is noise. */}
        </div>

        <Reveal
          delay={160}
          className="order-2 mt-3 w-full sm:mt-7 lg:mt-9"
        >
          {/* ── ONLY THE INSTRUCTION GOES INSIDE THE FRAME (Daniel, 2026-08-03)
              *"the text needs to be inside the rectangle above the video"*, and
              then, on seeing it: *"the text 'אם את מרגישה…' should be outside
              the rectangle."*

              So the sentence is split across the boundary, and the split is the
              right one rather than a compromise. The lead half NAMES A FEELING
              and belongs to the page — it is the reason to keep reading at all,
              and it sits in the copy column under the headline. The second half
              is a CAPTION FOR A SPECIFIC VIDEO: "watch it to the end" plus a
              pointing emoji only means anything when the thing being pointed at
              is directly beneath it, which is exactly what the reference page
              Pnina sent does.

              The `data-hero` hooks travel with the parts, so
              `e2e/hero-fold.spec.ts` still measures the same two elements and
              still requires both above the fold. */}
          <HeroVideo
            caption={
              <>
                <Reveal delay={80}>
                  <p
                    data-hero="secondary"
                    className="mx-auto max-w-2xl leading-snug"
                  >
                    {/* `whitespace-nowrap` on the pair, not on the <strong> alone.
                        The instruction is the loud thing in this block and it has to
                        arrive whole — left to itself it broke as "…צפי בסרטון /
                        עד הסוף", which turns one instruction into two half-lines. The
                        emoji is a separate box with no space before it, but an emoji
                        is its own line-break opportunity, so it needs to be inside the
                        same nowrap or it drifts onto the next line by itself. */}
                    <span className="whitespace-nowrap text-[1.42rem] sm:text-[1.72rem]">
                      <strong className="text-neon-gold font-bold underline decoration-from-font underline-offset-[0.22em]">
                        {t("secondaryWatch")}
                      </strong>
                      <span aria-hidden>{t("secondaryPoint")}</span>
                    </span>
                  </p>
                </Reveal>

                {/* Her own footnote to that line, and it is deliberately quieter: it
                    is for the woman who has already decided, so it must not compete
                    with the sentence that is still persuading everyone else. */}
                <Reveal delay={120}>
                  <p
                    data-hero="secondary-note"
                    className="mx-auto mt-1.5 max-w-2xl text-sm leading-snug text-heading-pearl sm:text-base"
                  >
                    {t("secondaryNote")}
                  </p>
                </Reveal>
              </>
            }
          />
        </Reveal>

        <div className="order-3 w-full max-w-3xl">
          {/* ── ⚠️ THE FORM IS A BUTTON AGAIN (Pnina, 2026-08-03 call) ──
              This has now been both things, twice, and both times at her
              request — so read the history before changing it a third time.

              0.17.0 replaced a button with the embedded form, on her own
              instruction ("put the form itself here like we have at the end of
              the page") and with a good argument behind it: a popup costs a tap,
              a modal and a decision before anyone has typed anything.

              She reversed it on the 2026-08-03 call: *"להחליף את השדות לכפתור"*.
              The counter-argument is about this page rather than about forms in
              general — three input fields at the top of a landing page is a
              form, and a form is a task. What is above the fold now is a
              headline, her sentence, the video and one thing to press, which is
              the shape of the reference page she keeps pointing at.

              `source="hero"` still reaches n8n unchanged: `LeadButton` opens the
              app-wide dialog and that dialog renders the SAME `ContactForm`, so
              there is still one lead flow, one validation, one `/api/contact`,
              one `/thank-you`. Nothing about the pipeline moved.

              ⚠️ `e2e/hero-fold.spec.ts` used to assert the name and phone fields
              were above the fold. It now asserts THIS BUTTON is, and its header
              records why — the fields it named no longer exist here. */}
          <Reveal delay={200}>
            <div className="mx-auto mt-4 flex w-full max-w-md justify-center sm:mt-8">
              <LeadButton
                source="hero"
                variant="brand"
                data-hero="cta"
                className="cta-hot h-14 w-full rounded-2xl px-6 text-[1.25rem] tracking-[0.01em] sm:text-[1.4rem] [&_svg]:size-5"
              >
                {t("ctaPrimary")}
                <ArrowRight data-icon="inline-end" />
              </LeadButton>
            </div>
          </Reveal>

          {/* Below the fold on purpose, and the only thing that is. A woman who
              wants to know how the accompaniment works before leaving a number
              has to scroll a little; a woman who is ready to leave a number
              does not. */}
          <Reveal delay={240}>
            <div className="mt-5 flex justify-center">
              <Link
                href={`/#${sectionIds.process}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-accent underline-offset-4 hover:underline"
              >
                {t("ctaSecondary")}
                <ArrowRight data-icon="inline-end" className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────  Process  ────────────────────────── */

/** Copy shape for one process step. Line breaks are hers — see the note in
 *  ProcessSection before collapsing `lines` into a single string. */
type ProcessCopy = { title: string; lines: string[] };

/**
 * Per-step tints. Each step wears one colour from the palette across its offset
 * frame line, number plate, rule and fallback panel, so the four rows walk the
 * palette instead of repeating one hue four times.
 *
 * The KEY NAMES are historical (`plum`, `teal`) and no longer describe the
 * colour: since v0.8.0 `plum` resolves to the natural brown, and since 0.12.0
 * `teal` resolves to the dusty ROSE, because these are token references and only
 * the tokens changed. They are left alone deliberately — the same three strings
 * are a union type in `src/content/process.ts`, and renaming them for a hue
 * change is churn with a merge conflict attached. Read the value, not the key.
 *
 * ── WHY THE COOL STEP WENT WARM (Daniel, 2026-07-30) ──
 * "Review the colours used, mostly for the text and the backgrounds of the stuff
 * around the text; I don't think they are complementary."
 *
 * Step 02 was the site's silver-blue: a pale blue-grey panel with a blue-grey
 * 80px numeral, sitting third in a row of four warm cream cards, on a page whose
 * light is now a dusty rose. Measured in OkLCh the ink and its surface were 132°
 * apart in hue — the single widest gap on the site — and it looked it: one card
 * in that row read grey and dead while the other three glowed.
 *
 * The header of globals.css licenses the silver-blue as "the ONE cool note, used
 * at low alpha, and it stays out of the way". A 1.5rem reassurance chip with a
 * tick in it does stay out of the way, and those are untouched. A full card panel
 * plus an 80px numeral does not. So this step now walks the rose instead, which
 * also puts the site's new accent into its largest section rather than leaving it
 * to the buttons.
 *
 * The gold step's numeral moved too, for the same reason in the other direction:
 * `--gold` at 45% on cream composites to a pale LEMON (OkLCh hue 89°, i.e. into
 * the yellow-greens) — the exact "I think it's gold but what I see is green"
 * Daniel called out in 0.11.3, reappearing at watermark scale. `--gold-deep` at
 * 30% is a warm antique sand and stays in the family the rest of the page is in.
 */
const STEP_TINTS = {
  plum: {
    panel: "from-brand-wash via-surface-2 to-brand-soft/70",
    numeral: "text-brand/30",
    icon: "border-brand/30 bg-surface-1/85 text-brand-accent",
    rule: "bg-brand/45",
  },
  teal: {
    panel: "from-rose-soft/80 via-surface-1 to-rose-soft",
    numeral: "text-rose/40",
    icon: "border-rose/35 bg-surface-1/85 text-rose-ink",
    rule: "bg-rose-line/50",
  },
  gold: {
    panel: "from-gold-soft/80 via-surface-1 to-gold-soft",
    numeral: "text-gold-deep/30",
    icon: "border-gold/40 bg-surface-1/85 text-gold-deep",
    rule: "bg-gold/55",
  },
} as const;

/**
 * The four steps, as four cards that sit side by side on a wide screen and
 * stack on a narrow one.
 *
 * Layout history, so nobody re-derives it. First shape: a two-sided timeline
 * where every step after the first was pulled 5rem UP into the one before
 * (`md:-mt-20`). That only holds while both columns stay exactly the same
 * height, so the moment one step's text wrapped differently the steps
 * overlapped and the section rendered as a pile. Second shape: alternating
 * full-width rows, which could not collide but made the section four screens
 * tall on a desktop — the whole process became a scroll marathon, and the point
 * of "four steps, no surprises" is that you can see all four at once.
 *
 * So: a real grid. On lg the four cards are a single horizontal row about one
 * screen tall; below that they fall to two columns and then one. Cards stretch
 * to equal height, so uneven copy lengths cannot break the row. The images move
 * to a 4:3 band at the top of each card, because a square image in a ~17rem
 * column eats the height the copy needs.
 */
export function ProcessSection() {
  const t = useTranslations("process");
  const steps = t.raw("steps") as ProcessCopy[];
  // Icons, tints and images are structural, so they live with the step config.

  return (
    // `process-spine-scope` declares the NAMED view-progress timeline the spine
    // draws itself on, and it belongs on THIS element because the progress the
    // hairline should track is the SECTION's — a bare `view()` on the line
    // would measure the 2px-wide overlay it lives in. Keep the class on an
    // ancestor of <ProcessSpine> or the name goes out of scope and the line
    // stops drawing. See globals.css §2.
    //
    // `overflow-clip`, NOT `overflow-hidden`: the 24rem × 48rem wash below is
    // wider than a phone and still has to be clipped, but `hidden` would make
    // this a SCROLL CONTAINER and freeze every [data-reveal] inside it against
    // a box that never scrolls (globals.css §1). It did: the fourth step card
    // and the trust row under the grid sat at 0.54 and 0.11 opacity forever.
    // `clip` clips the same box without being a scroll container. The SPINE is
    // indifferent to both — a named `view-timeline-name` measures its own
    // element against the page scroller, never against a clip on itself.
    <section className="process-spine-scope relative overflow-clip bg-background px-6 pt-8 pb-14 sm:pt-10 sm:pb-20">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[24rem] w-[48rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-[120px]"
      />
      <div className="relative mx-auto max-w-6xl">
        <Reveal>
          <SectionHeading
            align="center"
            title={t("title")}
            description={t("description")}
          />
        </Reveal>

        {/* The wrapper exists only to give the decorative spine something to be
            positioned against; the steps markup below is untouched. */}
        <div className="relative">
          <ProcessSpine steps={steps.length} />
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4 lg:gap-5">
            {steps.map((step, index) => {
              const config = processSteps[index];
              const Icon = config?.icon ?? Target;
              const tint = STEP_TINTS[config?.tint ?? "plum"];
              const image = config?.image;
              const number = `0${index + 1}`;

              return (
                <Reveal
                  key={step.title}
                  delay={index * 90}
                  as="li"
                  className="h-full"
                >
                  {/* `border-border`, not the `border-foreground/[0.08]` this
                      card used to carry. That literal is an alpha of the INK,
                      and after dark the ink is near-white on a near-black
                      canvas: 8% of it measured 1.22:1 against the card, an
                      outline you have to hunt for on a phone at night. The
                      token is scheme-aware (12% of the brown on paper, 22% of
                      the cream after dark, both measured at the head of the
                      dark block in globals.css) and is the value this site is
                      supposed to draw a card edge with. */}
                  <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-surface-1/80 shadow-card backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_28px_60px_-32px_var(--shadow-strong)]">
                    {/* Image band. 4:3 rather than the square the rows used — in a
                        ~17rem column a square photo is half the card. */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2">
                      {image && hasMedia(image) ? (
                        <Image
                          src={image.src}
                          alt={image.alt}
                          fill
                          sizes="(min-width: 1024px) 17rem, (min-width: 640px) 45vw, 90vw"
                          className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
                        />
                      ) : (
                        // Designed fallback, not a grey "image missing" box: it
                        // is fine to ship as-is if a photo is ever removed.
                        <div
                          aria-hidden
                          className={cn(
                            "absolute inset-0 flex items-center justify-center bg-gradient-to-br",
                            tint.panel
                          )}
                        >
                          {/* Forced LTR so "01" never reorders to "10" inside
                              the surrounding RTL document.

                              `tabular-nums` is the ONE on this site, and it
                              arrived with Rubik in 0.18.0. Rubik's figures are
                              lining but PROPORTIONAL — the ten advances spread
                              186/1000em — so at this size "01".."04" measured
                              133.7 / 151.1 / 152.3 / 154.8px and the first card's
                              numeral sat 14% narrower than the last one in a row
                              of four. Rubik ships a real `tnum`, so this costs
                              nothing. Do not generalise it: Heebo's ten advances
                              are identical (562/1000em), which is why no body
                              figure anywhere else asks for it. */}
                          <span
                            dir="ltr"
                            className={cn(
                              "font-display select-none text-[5rem] leading-none tabular-nums",
                              tint.numeral
                            )}
                          >
                            {number}
                          </span>
                        </div>
                      )}

                      {/* Step number plate, over the lower corner of the photo. */}
                      <span
                        className={cn(
                          "absolute bottom-3 end-3 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-semibold shadow-card backdrop-blur-md",
                          tint.icon
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span dir="ltr">
                          {number}
                        </span>
                      </span>
                    </div>

                    {/* Copy */}
                    <div className="flex flex-1 flex-col p-5 sm:p-6 lg:p-5">
                      {/* ⚠️ THE "שלב N" LABEL WAS HERE AND IS DELETED (Pnina,
                          2026-08-03) — same instruction as the scrub cards, and
                          it has to be obeyed in BOTH renderings or the reduced-
                          motion visitor gets a numbering the motion one does
                          not. The rule that used to precede it went with it;
                          a hairline leading to nothing is not a decoration. */}
                      {/* No `lg:` step any more: with the 0.14 scale `text-xl`
                          is already 27px from 640px up, so the arbitrary rem
                          this used to carry had become a SHRINK at the widest
                          breakpoint rather than a step up. */}
                      <h3 className="mt-3 text-lg font-semibold leading-snug tracking-tight text-balance text-foreground sm:text-xl">
                        {step.title}
                      </h3>
                      {/* Her line breaks are load-bearing here: the short closing
                          lines ("אני לא רוצה להישאר עם זה לבד יותר.") are written
                          to land on their own, so each stays its own paragraph
                          rather than being reflowed into one block. */}
                      <div className="mt-3 space-y-2">
                        {step.lines.map((line) => (
                          <p
                            key={line}
                            className="text-sm leading-[1.75] text-muted-foreground"
                          >
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </ol>
        </div>

        {/* The closing line of the process, and the last thing read before the
            offer below it.

            It used to be a teal pill with a green tick in it, which is the
            visual language of a confirmation button — "step complete, proceed
            to purchase" — sitting on the path between the four steps and the
            prices. Wrong register entirely. It is now what it actually is: one
            sentence, centred, between two gold hairlines. No chip, no icon,
            nothing to click. */}
        <Reveal className="mt-14 flex items-center justify-center gap-4 sm:gap-5">
          <span aria-hidden className="h-px w-10 bg-gold/30 sm:w-16" />
          <p className="text-center text-base font-medium tracking-[0.01em] text-foreground-soft">
            {t("endpoint")}
          </p>
          <span aria-hidden className="h-px w-10 bg-gold/30 sm:w-16" />
        </Reveal>
      </div>
    </section>
  );
}

/* ──────────────────────────  Services teaser  ────────────────────────── */

/**
 * ⚠️ CURRENTLY UNMOUNTED — nothing renders this.
 *
 * "הליווי נבנה סביבך, לא סביב תבנית" sat between the audience grid and the
 * process section until 2026-07-29, when Daniel took it off the home page: it
 * made the same argument the audience section immediately above it had just
 * made ("אין רשימת תנאים… אלה הדברים שנשים מגיעות איתם אליי"), in weaker words
 * and inside a busier frame. Two blocks saying one thing is one block too many
 * on a page whose job is a single phone number.
 *
 * Kept rather than deleted — the same call as `QuoteReveal` — because the copy
 * is real and /about has no "what the accompaniment actually is" block yet. If
 * it is still unmounted at the end of this redesign round, delete it together
 * with the `servicesTeaser` message block and its `client-messages.ts` entry.
 * Its two internal links point at `/#process`, because the `#approach` anchor
 * retired with the section.
 */
export function ServicesTeaser() {
  const t = useTranslations("servicesTeaser");
  const tServices = useTranslations("services");
  const services = tServices.raw("items") as ServiceItem[];

  return (
    <section className="bg-background px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="ring-shine relative grid gap-10 overflow-hidden rounded-3xl border border-foreground/[0.08] bg-surface-1 p-7 sm:p-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand/15 blur-[100px]"
            />
            <div className="relative">
              <SectionHeading
                title={t("title")}
                description={t("description")}
              />
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/#process"
                  className={cn(
                    buttonVariants({ variant: "brand" }),
                    "h-11 rounded-lg px-5"
                  )}
                >
                  {t("cta")}
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </div>
            </div>
            <div className="relative grid gap-2.5 sm:grid-cols-2">
              {services.map((service, index) => {
                const Icon = serviceConfig[index]?.icon ?? Sparkles;
                // Cycle the three palette legs across the tiles so this block
                // is not four identical pink squares.
                const tile = [
                  "border-brand/25 bg-brand-wash text-brand-accent",
                  "border-teal/25 bg-teal-soft/60 text-teal-deep",
                  "border-gold/35 bg-gold-soft/70 text-gold-deep",
                  "border-brand/25 bg-brand-wash text-brand-accent",
                ][index % 4];
                return (
                  <Link
                    key={service.title}
                    href="/#process"
                    className="group flex items-center gap-3 rounded-xl border border-foreground/[0.08] bg-foreground/[0.02] p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:bg-foreground/[0.04]"
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-transform duration-300 group-hover:scale-110",
                        tile
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-sm font-medium leading-tight text-foreground-soft transition-colors group-hover:text-foreground">
                      {service.title}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ──────────────────────────  Offers  ────────────────────────── */

type IntroCall = {
  label: string;
  title: string;
  free: string;
  valueLabel: string;
  valuePrice: string;
  body: string;
  includes: string[];
  cta: string;
};

/* ── The three node shapes ──
   Purely decorative and `aria-hidden`: the section's meaning is carried by the
   headings, the labels and the prices. The geometry lives in `.offer-node` in
   globals.css.

   They used to be beads threaded onto a vertical spine. The spine is gone (see
   the header of `OffersSection`), so they are now small icons that sit beside
   each block's label — the same three shapes, telling the same story
   (shell → circle → pearl), just no longer strung on a line. */

/** The free call — an open shell: a hairline gold ring with a gap at the top.
 *  Open, hollow and symmetric about the vertical, so it points nowhere. A
 *  chevron or an arrow here would be a direction, and this section is not
 *  pushing. */
function ShellNode({ size, strokeWidth = 1.6 }: NodeSizeProps = {}) {
  return (
    <span
      aria-hidden
      className="offer-node offer-node--shell"
      style={size ? ({ "--node-size": size } as CSSProperties) : undefined}
    >
      <svg viewBox="0 0 24 24" className="absolute inset-0 h-full w-full">
        <path
          d="M8,5.07 A8,8 0 1 0 16,5.07"
          fill="none"
          stroke="var(--gold)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/** Both node shapes scale off one custom property, so the same three drawings
 *  serve as a 16px label icon and as a 72px figure in an empty image slot. */
type NodeSizeProps = { size?: string; strokeWidth?: number };

/** מסלול צדפה — an empty circle, same hairline. */
export function HollowNode({ size }: NodeSizeProps = {}) {
  return (
    <span
      aria-hidden
      className="offer-node border border-gold/70"
      style={size ? ({ "--node-size": size } as CSSProperties) : undefined}
    />
  );
}

/** מסלול פנינה — the pearl, and the only filled shape in the section. Static by
 *  design: see the note on `.pearl-sphere` in globals.css. `.pearl-sphere` draws
 *  the object (the cursor pearl in §3 wears the same class); `.offer-node--pearl`
 *  only sets this instance's size. */
export function PearlNode({ size }: NodeSizeProps = {}) {
  return (
    <span
      aria-hidden
      className="offer-node offer-node--pearl pearl-sphere"
      style={size ? ({ "--node-size": size } as CSSProperties) : undefined}
    />
  );
}

/**
 * The picture in a track card: a closed shell for צדפה, a pearl for פנינה — the
 * section's title, "מהצדפה אל הפנינה", as two pictures.
 *
 * ── IT IS A SIDE PANEL NOW, NOT A THUMBNAIL (Daniel, 2026-07-30) ──
 * "right-side image, left-side text, with price and everything — currently it's
 * ugly." It was an 11rem square parked above the copy, which on a wide card left
 * a stranded little tile with a lot of empty beside it. From `sm` up it is a
 * FULL-HEIGHT column down one side of the card at ~38% of its width, so the card
 * reads as one object: picture, then a rule of light, then the words.
 *
 * `h-full` + `object-cover` rather than a fixed aspect ratio: the height is
 * whatever the copy column turns out to be, which is what makes the two cards in
 * the row match each other however their text wraps. On a phone it goes back on
 * top as a wide 16:9 band — a side panel in a 342px column would leave neither
 * half enough room.
 *
 * Both slots are `src: null` until Daniel's generated images land (see the note
 * on `trackShell` / `trackPearl` in src/content/media.ts). While they are empty
 * this draws the same track's node motif on a soft wash: a finished, calm panel
 * that is fine to ship, not a grey "image missing" box and not a stock
 * photograph. When a file arrives nothing here changes — the slot's `src` stops
 * being null and the photograph takes the frame.
 */
export function TrackFigure({
  slot,
  node,
}: {
  slot: ImageSlot;
  node: "hollow" | "pearl";
}) {
  return (
    // It BLEEDS to the card's edge — no border and no radius of its own, the
    // card's `overflow-hidden` does the rounding. A picture inset inside a
    // padded card with its own second border is the "ugly" Daniel was pointing
    // at; a picture that is one wall of the card is the premium version.
    // `self-stretch` is what gives `fill` a height on the wide layout: the row's
    // height comes from the copy column, and the image takes all of it.
    <div className="relative h-44 w-full shrink-0 overflow-hidden bg-surface-2/50 sm:h-auto sm:w-[38%] sm:self-stretch">
      {hasMedia(slot) ? (
        <Image
          src={slot.src}
          alt={slot.alt}
          fill
          sizes="(min-width: 640px) 38vw, 100vw"
          className="object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gold-soft/60 via-surface-1 to-brand-wash"
        >
          {node === "pearl" ? (
            <PearlNode size="5.5rem" />
          ) : (
            <HollowNode size="5.5rem" />
          )}
        </div>
      )}
    </div>
  );
}

/** A block's small letterspaced label — "הצעד הראשון", or a track's duration —
 *  set on the same line as that block's node.
 *
 *  The ink is `--accent-ink`, an accent ROLE (globals.css `:root`) and NOT gold.
 *  Read that note before changing it: these labels sit on the accent's own wash,
 *  and amber letters on rose light are the muddy pair Daniel flagged on
 *  2026-07-30. The bright gold on this line is the NODE, which is exactly what
 *  the palette rule in the header of globals.css asks for. */
export function NodeLabel({
  node,
  children,
}: {
  node: ReactNode;
  children: string;
}) {
  return (
    <p className="flex items-center gap-2.5 text-sm font-semibold tracking-[0.05em] text-accent-ink">
      {node}
      {children}
    </p>
  );
}

/** What a block includes. Hairline dots rather than tick icons — a column of
 *  green checkmarks turns a plain fact into a sales point. */
export function OfferIncludes({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "space-y-2 text-sm leading-[1.75] text-muted-foreground",
        className
      )}
    >
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span
            aria-hidden
            className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-gold/70"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * "מהצדפה אל הפנינה" — the free call, and the two tracks it might lead to.
 *
 * WHAT THIS USED TO BE, so nobody rebuilds it: a three-tier funnel that struck
 * through ₪1,000 and then ₪500 on the way down to "free", with an animated
 * crossing-out, `?` popovers, a breathing price and a glowing card at the
 * bottom. Phase 1 deleted the invented numbers — neither came from Pnina, and
 * presenting a made-up price as the thing she is generously discounting is a
 * lie told to a woman who has been lied to enough. Phase 3 deleted the FORM
 * they were told in, which was doing the same work more quietly: struck
 * anchors, per-tier shadow cards and a halo around the free option are how a
 * page says "look how much you are getting" at someone.
 *
 * ── THE SHAPE, AND WHY IT CHANGED AGAIN (2026-07-29, Daniel) ──
 * Phase 3 built this as ONE vertical ladder: a gold hairline spine with the
 * free call and both tracks as three rungs of the same thing. On a desktop that
 * read as three full-width stacked bands you had to scroll through, and it made
 * the free call look like the first item in a price list.
 *
 * It is not. The free call is the thing we are giving away and the ONLY thing
 * this section asks for; the two tracks are what gets discussed ON that call.
 * So the section is now two blocks, not three siblings:
 *
 *   1. the free call — a panel of its own, the section's only button, its own
 *      column for "ללא עלות" + the value line + the CTA;
 *   2. under it, behind its own small label ("המסלולים שנדבר עליהם בשיחה"), the
 *      two tracks as two EQUAL columns standing side by side on lg and up, so a
 *      reader sees both at once and compares them in place. They stack on a
 *      phone, in her order (צדפה then פנינה).
 *
 * The typographic order IS still the argument, and it is deliberately
 * upside-down versus a pricing page: the section title is the largest thing,
 * then the block names, then "ללא עלות", and the prices are small muted facts.
 * A price set large is a price being sold; a price set small is a price being
 * disclosed. Do not "balance" the layout by growing the numbers.
 *
 * Still: no badge, no `featured` flag, no winner, no glow, no strikethrough,
 * exactly one button. Her framing is that the two tracks are the same thing at
 * two lengths, so the only thing that differs between the two columns is which
 * node sits beside its label. See D10 in docs/12-redesign-plan.md.
 *
 * TODO(client): the two "מתאים לך אם…" lines (`offers.items[].fit`), the free
 * call's `intro.body` and the tracks label `tracksEyebrow` are the sentences
 * here that are not hers. They state length and next step and nothing more, on
 * purpose — but they still need her yes.
 */
export function OffersSection() {
  const t = useTranslations("offers");
  const intro = t.raw("intro") as IntroCall;
  const ladder = t.raw("ladder") as {
    rungs: LadderRung[];
    freeLabel: string;
  };

  return (
    <section className="bg-background px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <SectionHeading align="center" title={t("title")} />
        </Reveal>

        {/* ── The free introductory call ──
            The one panel in the section, the one button, and the ONE place on
            this site allowed to raise its voice (Daniel, 2026-07-29): a warm
            gold wash, a gold edge, a warm halo, and the section's largest words
            after its own h2. That licence is local and it is about JOY, not
            pressure — it is still not a "best value" card. Nothing here throbs,
            counts down, claims scarcity or strikes a price through; everything
            loud about it happens ONCE, as it arrives. See the header of
            `FreeCallAnchor` for where exactly the line is drawn. */}
        <Reveal delay={80}>
          <div className="offer-free-panel relative mt-10 overflow-hidden rounded-3xl border border-gold/45 bg-surface-1/90 p-7 backdrop-blur-sm sm:mt-12 sm:p-9 lg:grid lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-center lg:gap-12">
            <div
              aria-hidden
              className="pointer-events-none absolute -start-16 -top-20 h-56 w-56 rounded-full bg-gold/15 blur-[90px]"
            />

            <div className="relative">
              <NodeLabel node={<ShellNode />}>{intro.label}</NodeLabel>
              <h3 className="font-display mt-2 text-[2.0rem] leading-tight text-foreground sm:text-[2.45rem]">
                {intro.title}
              </h3>
              <p className="mt-3 max-w-lg text-base leading-relaxed text-foreground-soft">
                {intro.body}
              </p>
              <OfferIncludes items={intro.includes} className="mt-4" />
            </div>

            {/* The price / action column. On lg it sits at the inline END with
                a hairline between it and the copy; below that it is simply the
                next block down, separated by the same hairline drawn on top. */}
            <div className="relative mt-7 border-t border-gold/25 pt-6 lg:mt-0 lg:border-s lg:border-t-0 lg:ps-12 lg:pt-0">
              {/* The value anchor: what the call is worth, then a hairline
                  leading to what it costs. Said ONCE, in that order, and never
                  as a struck-through number — read the header of
                  `FreeCallAnchor` before changing anything about it. */}
              <FreeCallAnchor
                rungs={ladder.rungs}
                freeLabel={ladder.freeLabel}
                free={intro.free}
              >
                {/* The button is the sequence's last beat, which is why it is
                    passed IN rather than rendered after. `.cta-hot` layers a
                    warm gradient and a gold edge over the `brand` variant; the
                    focus ring, the disabled state and the hover sheen still
                    come from the variant. */}
                <LeadButton
                  source="landing"
                  variant="brand"
                  className="cta-hot h-14 w-full rounded-2xl px-6 text-[1.4rem] tracking-[0.01em] [&_svg]:size-5"
                >
                  {intro.cta}
                  <ArrowRight data-icon="inline-end" />
                </LeadButton>
              </FreeCallAnchor>
            </div>
          </div>
        </Reveal>

      </div>
    </section>
  );
}

/* ──────────────────────────  Audience  ────────────────────────── */

/**
 * "למי הליווי מתאים" — the eight subjects women come to her with, in her own
 * list and her own order (structure in src/content/audience.ts).
 *
 * The section is written as recognition, not as segmentation: a woman should
 * find herself in one of these tiles, and the closing line widens rather than
 * narrows ("המסרים מתאימים לכל אישה, כולל נשים מהקהל הדתי והחרדי"). No tile
 * promises an outcome — each says what we work on, which is the only thing
 * anyone can honestly say up front.
 */
export function AudienceSection() {
  const t = useTranslations("audience");
  const items = t.raw("items") as TitledText[];

  return (
    <section className="process-boundary-surface bg-background px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeading align="center" title={t("title")} />
        </Reveal>

        {/* ── HER TWO PANELS, ALTERNATING ──
            Pnina, 2026-08-04: each square a different colour and a different
            style, so the block reads as something rather than as eight grey
            boxes. The two treatments are her Oyster Beige and her Mist Grey,
            both carrying `--panel-ink` — see the long note beside those tokens
            in globals.css for why gold is deliberately NOT one of them, and for
            the measured ratios.

            `index % 2` and not `% 4`: on a phone the grid is one column and on
            `sm` it is two, so alternating by index gives a true checkerboard at
            every width. At `lg` (four across) the rows offset, which is what
            keeps it from banding into stripes. */}
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4">
          {items.map((item, index) => {
            const config = audienceTopics[index];
            const Icon = config?.icon ?? Sparkles;
            const oyster = index % 2 === 0;
            return (
              <Reveal
                key={item.title}
                as="li"
                delay={(index % 4) * 80}
                className="h-full"
              >
                <div
                  className={cn(
                    "process-boundary-card h-full rounded-2xl p-5 text-panel-ink shadow-card",
                    oyster ? "bg-panel-oyster" : "bg-panel-mist"
                  )}
                >
                  {/* Icon and title on ONE line — her instruction, and the
                      reason the icon lost its tinted 40px plate: a boxed icon
                      beside a heading reads as a second element competing with
                      it, where a bare glyph reads as punctuation for the words. */}
                  <h3 className="flex items-center gap-2.5 text-base font-semibold leading-snug">
                    <Icon className="h-5 w-5 shrink-0" aria-hidden />
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-normal opacity-85">
                    {item.text}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ──────────────────────────  Moments  ────────────────────────── */

/**
 * "מה הופך לאפשרי בתהליך הליווי" — five things Pnina has watched happen,
 * written so that none of them belongs to an identifiable person. The reasoning
 * is in the header of src/content/moments.ts and it is not optional.
 *
 * This sits where the stats strip used to. Every stat there was a placeholder
 * zero and the strip hid itself, so the slot rendered nothing at all; these
 * five lines do the job a numbers row was there to do, without making a single
 * claim about how many women or how long. The strip itself was deleted in
 * v0.9.0 — see AGENTS.md rule 3.
 */
export function MomentsSection() {
  const t = useTranslations("moments");
  const items = t.raw("items") as string[];

  return (
    <section className="border-y border-foreground/[0.06] bg-background px-6 py-14 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <SectionHeading
            align="center"
            title={t("title")}
            description={t("description")}
          />
        </Reveal>

        <ul className="mt-10 grid gap-3.5 sm:mt-12">
          {items.map((item, index) => {
            const config = momentConfig[index];
            const Icon = config?.icon ?? Sparkles;
            return (
              <Reveal
                key={item}
                as="li"
                delay={Math.min(index, 4) * 70}
                className="h-full"
              >
                <div className="flex h-full items-start gap-4 rounded-2xl border border-foreground/[0.08] bg-surface-1/70 p-5 shadow-card backdrop-blur-sm sm:p-6">
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                      CARD_TINTS[config?.tint ?? "plum"]
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="text-base leading-relaxed text-foreground-soft">
                    {item}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </ul>

        <Reveal className="mt-8 flex justify-center">
          <p className="text-center text-sm text-subtle-foreground">
            {t("closing")}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ──────────────────────────  Why  ────────────────────────── */

export function WhySection() {
  const t = useTranslations("why");
  const reasons = t.raw("items") as TitledText[];

  return (
    <section className="bg-background px-6 py-14 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <Reveal>
          <SectionHeading
            title={t("title")}
            description={t("description")}
          />
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2">
          {reasons.map((reason, i) => (
            <Reveal key={reason.title} delay={i * 80} className="h-full">
              {/* SOLID `surface-1`, not the old `bg-foreground/[0.02]` tint
                  (2026-07-30). That 2% wash was designed to sit on flat cream,
                  where it read as a faint card; on the full-strength sand
                  photograph it reads as nothing at all — the sand shows straight
                  through and the four promises turn muddy. Daniel: *"the square
                  should be white to give a good contrast."*
                  `surface-1` is the right token in BOTH schemes: it is literally
                  white on paper and the documented card surface (#27201a) on
                  dark, so this stays a lifted card rather than becoming a glaring
                  white slab in a dark room.
                  The hover no longer tints the fill — an opaque card has nowhere
                  to go — so the lift, the brand border and the shadow carry it. */}
              <div className="group h-full cursor-pointer select-none rounded-xl border border-foreground/[0.08] bg-surface-1 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-card">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-foreground/12 bg-brand/10 text-brand-accent transition-all duration-300 group-hover:scale-110 group-hover:border-brand/40 group-hover:bg-brand/20">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <p className="mt-4 text-base font-medium text-foreground">
                  {reason.title}
                </p>
                <p className="mt-1.5 text-sm leading-normal text-muted-foreground">
                  {reason.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────  Founder  ────────────────────────── */

/** Who she is: her photograph, her story, and the two ways to reach her. */
export function FounderTeaser() {
  const t = useTranslations("founder");
  const tFooter = useTranslations("footer");
  const founderName = founderDisplayName();
  const chips = t.raw("chips") as string[];
  const portrait = media.founderTeaser;

  return (
    <section className="process-boundary-surface bg-background px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          {/* ── ⚠️ ONE COLUMN NOW: WORDS FIRST, HER FACE UNDER THEM ──
              Pnina, 2026-08-03: *"התמונה במי אני להוריד למתחת לטקסט"*. This was
              a two-column grid with the portrait beside the story from `md` up.
              The story leads at every width now and the photograph closes the
              block, which also means a reader on a phone meets her sentence
              before her picture instead of scrolling past a portrait to reach
              it. `flex flex-col-reverse` rather than reordering the JSX: the
              portrait stays FIRST in the DOM so the `hasMedia` branch and the
              `PortraitFrame` fallback below are untouched. */}
          <div className="ring-shine relative flex flex-col-reverse gap-10 overflow-hidden rounded-3xl border border-foreground/[0.08] bg-surface-1 p-7 md:gap-12 md:p-10">
            {/* One temperature, two corners. This used to be a plum wash in
                one corner and a mint one in the other, which split the card
                down the middle into a warm half and a cold half. Both washes
                are warm now — gold above, brown below — and the card reads as
                one lit surface. */}
            <div
              aria-hidden
              className="process-founder-glow process-founder-glow--gold pointer-events-none absolute -start-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-gold/20 blur-[90px]"
            />
            <div
              aria-hidden
              className="process-founder-glow process-founder-glow--brand pointer-events-none absolute -end-20 bottom-0 h-56 w-56 rounded-full bg-brand/15 blur-[80px]"
            />

            {/* Portrait card */}
            <div className="relative mx-auto flex w-full max-w-[19rem] flex-col items-center text-center">
              <div className="relative w-full">
                {/* Two offset frame lines — brown inside, gold outside — so
                    the photograph sits inside the palette instead of floating
                    on top of it. */}
                <span
                  aria-hidden
                  className="absolute -inset-3 rounded-[1.75rem] border border-brand/30"
                />
                <span
                  aria-hidden
                  className="absolute -inset-6 rounded-[2.25rem] border border-gold/35"
                />
                {hasMedia(portrait) ? (
                  /* ── 4:5, NOT 2:3 (Pnina, 2026-08-03) ──
                     *"במי אני תמונה מעל הראש עד הכתפיים או חזה"*, and Daniel on
                     the photo she sent: crop it so it takes *"way less green
                     space"* — it is an outdoor selfie with a garden behind her,
                     and a tall 2:3 frame was mostly geraniums. 4:5 with
                     `object-top` lands on head, shoulders and a little chest,
                     which is exactly the crop she described. */
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-surface-2 shadow-[0_26px_60px_-26px_rgba(29,53,63,0.55)]">
                    <Image
                      src={portrait.src}
                      alt={portrait.alt}
                      fill
                      sizes="(min-width: 768px) 19rem, 80vw"
                      className="object-cover object-top"
                    />
                  </div>
                ) : (
                  <PortraitFrame
                    slot={portrait}
                    className="relative aspect-[4/5] w-full rounded-2xl"
                    sizes="19rem"
                  />
                )}
              </div>

              <p className="mt-10 text-xl font-semibold tracking-tight text-foreground">
                {founderName}
              </p>
              <p className="mt-1 text-sm leading-normal text-muted-foreground">
                {t("role")}
              </p>
              {/* ── ⚠️ TWO BUTTONS, NOT THREE CHIPS (Pnina, 2026-08-03) ──
                  These were three inert pills — ליווי אישי · ליווי בוואטסאפ ·
                  הרצאות — that looked tappable and did nothing. She asked for
                  two of them to become real destinations styled *"exactly like
                  the button in the header"*, and for the WhatsApp one to go:

                    ליווי אישי  →  scrolls to the process animation (#process)
                    הרצאות      →  /lectures

                  ⚠️ WhatsApp support is NOT being denied as a service — it is
                  still named in process step 4 and in both track cards on
                  /offers. What went is a chip that made a support channel look
                  like a third product.

                  `buttonVariants({ variant: "brand" })` is the header's own
                  skin, so these two and every `SectionCta` are literally the
                  same design; if that variant changes, all of them change. */}
              <div className="mt-5 flex w-full flex-wrap justify-center gap-2.5">
                <Link
                  href={`/#${sectionIds.process}`}
                  data-a11y-no-underline
                  className={cn(
                    buttonVariants({ variant: "brand" }),
                    "h-11 flex-1 rounded-lg px-4"
                  )}
                >
                  {chips[0]}
                  <ArrowRight data-icon="inline-end" />
                </Link>
                <Link
                  href="/lectures"
                  data-a11y-no-underline
                  className={cn(
                    buttonVariants({ variant: "brand" }),
                    "h-11 flex-1 rounded-lg px-4"
                  )}
                >
                  {chips[1]}
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </div>
              {siteConfig.profiles.instagram ? (
                <a
                  href={siteConfig.profiles.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground-soft transition-colors hover:text-brand-accent"
                >
                  <InstagramIcon className="h-4 w-4 shrink-0" />
                  <span dir="ltr">@{siteConfig.instagramHandle}</span>
                </a>
              ) : null}
            </div>

            {/* Story */}
            <div className="relative">
              <h2 className="text-[2.4rem] text-balance sm:text-[2.85rem]">
                {t("title")}
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-foreground-soft">
                {t("body", {
                  brand: siteConfig.name,
                  founder: founderName,
                })}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/about"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-10 rounded-lg px-4"
                  )}
                >
                  {t("more", { founder: founderName })}
                  {/* ARROW-RIGHT, not arrow-up-right. `data-icon="inline-end"`
                      mirrors the glyph under RTL (globals.css, the RTL block),
                      which turns a → into the ← this page reads toward — right.
                      It turns a ↗ into a ↖, i.e. the universal "opens somewhere
                      else" mark, pointing BACKWARDS. Every other button-shaped
                      CTA on the site uses this arrow; this one was the odd one
                      out, and it is an internal link to /about anyway. */}
                  <ArrowRight data-icon="inline-end" />
                </Link>
                <WhatsAppLink
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-10 rounded-lg px-4"
                  )}
                >
                  <WhatsAppIcon className="h-4.5 w-4.5 shrink-0 text-[#25d366]" />
                  {tFooter("whatsapp")}
                </WhatsAppLink>
                <a
                  href={`tel:${siteConfig.phoneE164}`}
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-10 rounded-lg px-4"
                  )}
                >
                  <Phone className="h-4 w-4 shrink-0 text-brand-accent" />
                  <span dir="ltr">{siteConfig.phone}</span>
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ──────────────────────────  Final CTA  ────────────────────────── */

/**
 * The last block on the page, and the actual ask.
 *
 * The form is rendered INLINE here rather than behind a button. Every other CTA
 * on the site opens the LeadDialog, which is right for a CTA someone meets
 * mid-scroll — but at the bottom of the page the reader has already decided,
 * and asking her to press one more thing before she can see two input boxes is
 * a step that only ever loses people. The dialog stays for everything else.
 */
export function FinalCta() {
  const t = useTranslations("finalCta");

  return (
    <section className="bg-background px-6 pb-24 pt-4">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          {/* NO PANEL HERE, DELIBERATELY (2026-07-30, launch night).
              This used to be a `bg-surface-1` card — pure white, full-width,
              rounded, bordered — with the form card sitting on it in cream. Two
              stacked surfaces for one ask. Daniel, reviewing on the sand: *"I
              don't see the reason why we need a bit larger white square."* He is
              right; the outer one was doing nothing the inner one wasn't.
              So the heading and the WhatsApp line now sit straight on the sand
              like every other section's heading does, and the form card below is
              the section's ONE surface. Do not re-wrap this in a panel. */}
          {/* The gold aurora wash that used to sit here went with the panel. It
              was a light source FOR the white card — and with the card gone it
              had nothing to warm, no `overflow-hidden` left to clip it, and at
              `w-[44rem]` it would have pushed a horizontal scrollbar onto every
              390px phone. The sand is the warmth now. */}
          <div className="relative px-6 py-14 sm:px-10 sm:py-16">
            <div className="relative">
              <div className="text-center">
                <h2 className="mx-auto max-w-2xl text-[2.4rem] text-balance sm:text-[2.85rem]">
                  {t("titleLead")}
                  <span className="text-gradient">{t("titleHighlight")}</span>
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                  {t("body")}
                </p>
              </div>

              {/* SOLID, not `surface-2/80`. The 80% was tuned against the white
                  panel that used to be behind it — the sand it now sits on is
                  darker and far busier, and 20% of a photograph coming through
                  the surface a woman types her phone number on is both a
                  contrast problem and a visual one. Same colour, no transparency,
                  no backdrop blur (nothing left to blur). */}
              <div className="mx-auto mt-9 w-full max-w-md rounded-2xl border border-foreground/[0.08] bg-surface-2 p-6 shadow-card sm:p-7">
                <ContactForm source="landing" />
              </div>

              {/* Kept from the old two-button block: writing is easier than
                  talking for some people, and this is the one place on the page
                  where that alternative belongs. It opens WhatsApp with the
                  shared opening line pre-filled. */}
              <div className="mt-8 flex flex-col items-center gap-2.5">
                <p className="text-sm text-subtle-foreground">
                  {t("orWhatsapp")}
                </p>
                <WhatsAppLink
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-11 rounded-lg px-5"
                  )}
                >
                  <WhatsAppIcon className="h-4.5 w-4.5 shrink-0 text-[#25d366]" />
                  {t("ctaSecondary")}
                </WhatsAppLink>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
