import type { LucideIcon } from "lucide-react";
import {
  Anchor,
  Compass,
  Feather,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Sunrise,
  Waves,
} from "lucide-react";

/**
 * "למי הליווי מתאים" — structural config only, matched BY INDEX to
 * `audience.items` in `messages/he.json` (all copy lives there).
 *
 * The eight entries are the eight subjects Pnina named herself, in her order.
 * Adding or removing one means adding or removing the matching item in the
 * message file in the same commit, or the icons slide by one.
 *
 * `tint` cycles the three palette legs (plum → teal → gold) so the grid is not
 * eight identical pink tiles — the same device the process cards use.
 */
export type AudienceTopic = {
  icon: LucideIcon;
  tint: "plum" | "teal" | "gold";
};

export const audienceTopics: AudienceTopic[] = [
  { icon: Sparkles, tint: "plum" }, // חיזוק הביטחון העצמי
  { icon: Feather, tint: "teal" }, // שחרור מאשמה ובושה
  { icon: ShieldCheck, tint: "gold" }, // הצבת גבולות
  { icon: Waves, tint: "plum" }, // התמודדות עם חרדות
  { icon: Compass, tint: "teal" }, // יציאה מדפוסי ריצוי
  { icon: HeartHandshake, tint: "gold" }, // בניית ערך עצמי
  { icon: Anchor, tint: "plum" }, // יציאה מתחושת תקיעות
  { icon: Sunrise, tint: "teal" }, // בחירה בעצמך
];
