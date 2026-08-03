import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { LeadButton } from "@/components/lead/lead-button";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

/**
 * ── ONE CTA AFTER EVERY SECTION (Pnina, 2026-08-03; Daniel, 2026-08-04) ──
 *
 * *"אחרי כל שלב כפתור CTA"*. Seven of these run down the home page, one after
 * each block, and all seven are the gold `variant="brand"` button — the design
 * that used to live alone in the header and that everybody liked. Daniel
 * confirmed all seven loud, in those words: *"Yes all our gold."*
 *
 * ── WHY THIS IS NOT THE PRESSURE PATTERN AGENTS.md RULE 4 BANS ──
 * Worth writing down, because seven identical buttons on one page is exactly
 * the shape that rule warns about, and the distinction is real rather than a
 * rationalisation:
 *
 *   · Every one of them offers the SAME free call. None claims a deadline, a
 *     discount, a remaining capacity or a price that is about to change. There
 *     is nothing to be late for, so repetition cannot create urgency.
 *   · None of them MOVES. No throb, no timed sheen, no countdown. The page's
 *     only looping thing is the offer panel's glow, argued separately in §9.
 *   · The label CHANGES down the page, which is the other half of Daniel's
 *     instruction (*"the text can be different from now and then, a little bit
 *     of the wording so it doesn't get boring"*). Seven identical strings read
 *     as a nag; seven different invitations read as a door being held open at
 *     each point where a reader might have decided.
 *
 * Repetition of an offer is availability. Repetition of a deadline is pressure.
 * This is the first. ⛔ If anything here ever gains a timer, a counter or a
 * "מקומות אחרונים", it becomes the second and rule 4 applies.
 *
 * ── THE LABELS ──
 * `home.sectionCta.*` in `messages/he.json`, one key per placement. They are
 * OURS, not hers, and drafted by us — Daniel approved the set on 2026-08-04.
 * TODO(client): Pnina should read all seven as a block; they are the only
 * copy on the page that repeats, so a wrong note in one of them is a wrong note
 * seven times.
 *
 * `dateWithMe` is the exception and is HER OWN WORDING, verbatim, quotation
 * marks and all: ל"דייט" חינמי איתי. It sits mid-page rather than in the hero
 * because Daniel wanted it somewhere it would be a surprise
 * (*"somewhere else on the site, like downwards between one of the sections,
 * for it to be more interesting"*). ⚠️ Do not "fix" its punctuation and do not
 * move it to the top.
 */
export function SectionCta({
  label,
  className,
}: {
  /** A key under `home.sectionCta`. */
  label:
    | "founder"
    | "process"
    | "dateWithMe"
    | "testimonials"
    | "moments"
    | "faq";
  className?: string;
}) {
  const t = useTranslations("home.sectionCta");

  return (
    <Reveal className={cn("flex justify-center px-6 pb-12 sm:pb-16", className)}>
      <LeadButton
        source="landing"
        variant="brand"
        className="h-13 rounded-xl px-7 text-[1.1rem] sm:text-[1.2rem]"
      >
        {t(label)}
        <ArrowRight data-icon="inline-end" />
      </LeadButton>
    </Reveal>
  );
}
