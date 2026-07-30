import type { LucideIcon } from "lucide-react";
import { HeartHandshake, MessagesSquare, Phone, Route } from "lucide-react";

import type { ImageSlot } from "@/content/media";

/**
 * The steps of the accompaniment, matched by index to `process.steps` in
 * `messages/he.json` (copy lives there; only structure lives here).
 *
 * NO PHOTOGRAPHS HERE RIGHT NOW, on purpose. Four AI-generated illustrations
 * shipped in this slot until v0.8.0 and they had to go: a hand writing on a
 * tablet whose "text" was garbled pseudo-English, a "road map" covered in
 * letter-shaped noise, and a fantasy-lit sunrise walk. Anyone who looked for
 * two seconds saw machine-made stock on a page about being believed, which is
 * the one thing this site cannot afford. The files are deleted, not just
 * unreferenced.
 *
 * With `src: null` every card renders the designed numeral panel instead — a
 * tinted gradient with a large 01/02/03/04 in the display serif. That is a
 * finished look, not a placeholder, and the section is fine to ship this way
 * indefinitely. The `alt`/`note` fields below stay as the brief for whatever
 * replaces them: real photographs (hers or properly licensed), square-ish, with
 * the subject in the middle of the frame — the crop is a 4:3 band at the top of
 * each card, so anything near the top or bottom edge is what gets cut.
 *
 * `tint` drives the step's accent colour (the rule, the numeral, the icon
 * plate). The three names are historical: since v0.8.0 `plum` resolves to the
 * natural brown and `teal` to the silver-blue. See STEP_TINTS in
 * `marketing-sections.tsx`.
 */
export type ProcessStep = {
  icon: LucideIcon;
  tint: "plum" | "teal" | "gold";
  image?: ImageSlot;
};

export const processSteps: ProcessStep[] = [
  {
    icon: Phone,
    tint: "plum",
    image: {
      src: null,
      alt: "שלב ראשון: השארת שם וטלפון",
      note: "שלב 1 — השארת פרטים. צריך צילום אמיתי, לא איור.",
      width: 900,
      height: 900,
    },
  },
  {
    icon: MessagesSquare,
    tint: "teal",
    image: {
      src: null,
      alt: "שלב שני: שיחת ההיכרות",
      note: "שלב 2 — שיחת ההיכרות. צריך צילום אמיתי, לא איור.",
      width: 900,
      height: 900,
    },
  },
  {
    icon: Route,
    tint: "gold",
    image: {
      src: null,
      alt: "שלב שלישי: תמונה ברורה של הדרך",
      note: "שלב 3 — תמונה ברורה של הדרך. צריך צילום אמיתי, לא איור.",
      width: 900,
      height: 900,
    },
  },
  {
    icon: HeartHandshake,
    tint: "plum",
    image: {
      src: null,
      alt: "שלב רביעי: מתחילות לצעוד יחד",
      note: "שלב 4 — מתחילות לצעוד יחד. צריך צילום אמיתי, לא איור.",
      width: 900,
      height: 900,
    },
  },
];
