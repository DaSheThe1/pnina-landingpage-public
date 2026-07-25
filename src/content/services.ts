import type { LucideIcon } from "lucide-react";
import { CalendarHeart, Presentation, UserRound, Users } from "lucide-react";

/**
 * Structural config for what she offers, matched by index to `services.items`
 * in `messages/he.json` (all copy lives there).
 *
 * The template this replaced attached a photo to each service. There is nothing
 * honest to photograph here, so each service gets a quiet line icon instead —
 * see the note in `src/content/process.ts`.
 *
 * TODO(client): the number of entries here must match the number of items in
 * `services.items`. We are still waiting on the real list (question 4 of the
 * intake — docs/01-client-intake.md). The four below are a plausible shape to
 * build against, not a claim about what she actually does.
 */
export type Service = {
  icon: LucideIcon;
  /** The primary offer, rendered with more emphasis. Exactly one should be true. */
  primary?: boolean;
};

export const services: Service[] = [
  { icon: UserRound, primary: true }, // ליווי אישי 1:1
  { icon: Users }, // קבוצה / סדנה
  { icon: Presentation }, // הרצאות (also has its own page)
  { icon: CalendarHeart }, // פגישת היכרות
];
