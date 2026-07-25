import type { LucideIcon } from "lucide-react";
import { HeartHandshake, MessagesSquare, Phone, Route } from "lucide-react";

import type { ImageSlot } from "@/content/media";

/**
 * The steps of the accompaniment, matched by index to `process.steps` in
 * `messages/he.json` (copy lives there; only structure lives here).
 *
 * Every step now has a real image, so the designed fallback panel only shows if
 * one is removed. `tint` still drives the step's accent colour (the rule, the
 * numeral, the icon plate), cycling plum → teal → gold → plum so the four rows
 * walk the palette instead of repeating one hue.
 *
 * The sources are square (1:1) and are cropped to a 4:3 band at the top of each
 * card, so the subject wants to sit in the middle of the frame; anything near
 * the top or bottom edge is what gets cut.
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
      src: "/images/process-1.jpg",
      alt: "יד רושמת שם ומספר טלפון על טאבלט, לצד אגרטל פרחים",
      note: "שלב 1 — השארת פרטים.",
      width: 900,
      height: 900,
    },
  },
  {
    icon: MessagesSquare,
    tint: "teal",
    image: {
      src: "/images/process-2.jpg",
      alt: "שתי נשים יושבות בשיחה בסלון חמים, כוסות תה בידיים",
      note: "שלב 2 — שיחת ההיכרות.",
      width: 900,
      height: 900,
    },
  },
  {
    icon: Route,
    tint: "gold",
    image: {
      src: "/images/process-3.jpg",
      alt: "מפת דרך מצוירת של התהליך, פרושה על שולחן לאור נר",
      note: "שלב 3 — תמונה ברורה של הדרך.",
      width: 900,
      height: 900,
    },
  },
  {
    icon: HeartHandshake,
    tint: "plum",
    image: {
      src: "/images/process-4.jpg",
      alt: "שתי נשים צועדות יחד בשביל מואר לעבר זריחה",
      note: "שלב 4 — מתחילות לצעוד יחד.",
      width: 900,
      height: 900,
    },
  },
];
