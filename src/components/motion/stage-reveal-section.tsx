"use client";

import { useTranslations } from "next-intl";

import { ScrollSequence } from "@/components/motion/scroll-sequence";
import { useSequenceSource } from "@/components/motion/sequence-source";

/**
 * The /lectures sequence — "האור עולה": a dark hall, a pool of golden light, a
 * speaker stepping into it, the warmth reaching the seats (docs/13 §4). It runs
 * at the top of the page because this audience (HR leads, counsellors, community
 * centres) decides in the first screen whether she is a speaker they can put in
 * front of a room.
 *
 * No caption beat: the copy on this page is still placeholder until Pnina
 * confirms what she actually talks about, and this is not the place to invent a
 * line for her. Add one here when Phase 1 lands her real lecture content.
 *
 * Renders nothing until the frames exist — see sequence-source.ts.
 */
export function StageRevealSection() {
  const t = useTranslations("motion.stage");
  const source = useSequenceSource("stage");

  if (!source) return null;

  return (
    <ScrollSequence
      key={source.baseUrl}
      baseUrl={source.baseUrl}
      finalStillSrc={source.finalStillSrc}
      aspect={source.aspect}
      frameCount={source.frameCount}
      ariaLabel={t("ariaLabel")}
    />
  );
}
