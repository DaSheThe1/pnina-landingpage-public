"use client";

import { useTranslations } from "next-intl";

import { ScrollSequence } from "@/components/motion/scroll-sequence";
import { useSequenceSource } from "@/components/motion/sequence-source";

/**
 * The home page's pearl sequence: a closed shell opens, light spills out, a
 * pearl is revealed and rises (docs/13 §3). It sits after the process section,
 * where the argument pauses — "this is what the work is for" — and it is the one
 * place on this site where an image, not a sentence, carries the idea.
 *
 * IT RENDERS NOTHING UNTIL THE FRAMES EXIST. Daniel generates them; until they
 * are in the bucket this component mounts, issues one probe request that 404s,
 * and takes itself off the page. See sequence-source.ts for the upload path.
 *
 * The caption is a beat over the stage rather than a heading, so it never
 * competes with the section headings around it — and it is legible with no
 * animation at all.
 *
 * It reads "מהצדפה אל הפנינה", which is the offers section's own title: four
 * words that describe exactly what the frames show. It deliberately is NOT the
 * "פנינה לא נוצרת למרות השכבות שלה" line this section was first written around
 * — Phase 1 put that line in the trust band, a few hundred pixels further down,
 * and printing it twice on one page spends it twice. The trust band keeps it.
 */
export function PearlRevealSection() {
  const t = useTranslations("motion.pearl");
  const source = useSequenceSource("pearl");

  if (!source) return null;

  return (
    <ScrollSequence
      // Re-probe from scratch if the orientation changes (a rotated phone, a
      // resized window): the mobile and desktop cuts are different files.
      key={source.baseUrl}
      baseUrl={source.baseUrl}
      finalStillSrc={source.finalStillSrc}
      aspect={source.aspect}
      frameCount={source.frameCount}
      ariaLabel={t("ariaLabel")}
    >
      <p className="scroll-seq__beat glass font-display max-w-xl rounded-2xl px-6 py-4 text-center text-[1.45rem] leading-snug text-balance text-foreground shadow-card sm:text-[1.7rem]">
        {t("caption")}
      </p>
    </ScrollSequence>
  );
}
