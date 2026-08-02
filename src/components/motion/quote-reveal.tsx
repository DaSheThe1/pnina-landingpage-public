import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/**
 * A pull-quote whose words arrive in reading order as it scrolls past.
 *
 * ── THE TEXT IS NEVER "REVEALED", ONLY LIT ──
 * Every word is in the DOM as ordinary text from the first byte of HTML, in one
 * paragraph, in order. A screen reader reads it as a sentence; a browser with no
 * CSS scroll-timeline support, a reader who has switched motion off in the
 * accessibility panel, and a
 * page with JavaScript off all show it fully. The words never start at opacity
 * 0 either — they start dim (0.12) and brighten, so even a timeline that froze
 * halfway would leave a legible sentence. Nothing here carries meaning; it is
 * the pace of reading, drawn.
 *
 * ── ONE PER PAGE ──
 * This effect is a moment. Two of them on the same page is a gimmick, and on
 * this site a gimmick reads as a stranger performing at someone in distress.
 *
 * Not mounted anywhere yet, deliberately: Phase 1 owns where the quote goes (the
 * trust band is the intended home — see the comment in trust-band.tsx). Give it
 * a short line, ideally under a dozen words: the stagger is a percentage of the
 * scroll range, so a long paragraph makes the last words arrive late.
 */
export function QuoteReveal({
  text,
  cite,
  className,
}: {
  /** The quote itself. Comes from messages/he.json — never hardcode Hebrew. */
  text: string;
  /** Optional attribution line, rendered under the quote. */
  cite?: string;
  className?: string;
}) {
  const words = text.split(/\s+/).filter(Boolean);
  // The last word lands well before the quote leaves the screen; the stagger is
  // squeezed into the first stretch of the range so the sentence completes while
  // it is still comfortably in view.
  const perWord = words.length > 1 ? 26 / (words.length - 1) : 0;

  return (
    <figure className={cn("quote-reveal", className)}>
      <blockquote className="font-display text-[2.0rem] leading-snug text-balance text-foreground sm:text-[2.4rem]">
        {words.map((word, i) => {
          const start = 14 + i * perWord;
          return (
            <span
              key={`${word}-${i}`}
              className="quote-reveal__word"
              style={
                {
                  "--word-range": `entry ${start.toFixed(1)}% entry ${(
                    start + 22
                  ).toFixed(1)}%`,
                } as CSSProperties
              }
            >
              {word}
              {i < words.length - 1 ? " " : null}
            </span>
          );
        })}
      </blockquote>
      {cite ? (
        <figcaption className="mt-4 text-sm text-muted-foreground">
          {cite}
        </figcaption>
      ) : null}
    </figure>
  );
}
