import type { LucideIcon } from "lucide-react";
import { Home, Eye, MessageCircleHeart, Wind, ShieldCheck } from "lucide-react";

/**
 * "מה הופך לאפשרי בתהליך הליווי" — structural config only, matched BY INDEX to
 * `moments.items` in `messages/he.json`.
 *
 * ── READ THIS BEFORE EDITING THE COPY ──
 * These five started life as five specific women Pnina described, and two of
 * them were identifiable as she told them. Nobody on this site has consented to
 * having her recovery published, so every one of them is written in the
 * generalised "יש רגע שבו אישה…" form: no names, no initials, no ages, no
 * dates, no numbers, no detail that could only belong to one person. That is
 * not a stylistic preference — it is the same rule that governs testimonials
 * (docs/04-testimonials-policy.md) applied to a story told in the third person.
 * If a real story is ever to be told as a real story, it needs that woman's
 * explicit consent first.
 *
 * They are also framed as things Pnina has WITNESSED, never as things the
 * accompaniment promises. The closing line ("כל תהליך הוא אחר") is part of the
 * section for that reason and is not decoration.
 */
export type Moment = {
  icon: LucideIcon;
  tint: "plum" | "teal" | "gold";
};

export const moments: Moment[] = [
  { icon: Home, tint: "plum" }, // לבד בבית, ורגועה
  { icon: Eye, tint: "teal" }, // בהירות לגבי מערכת יחסים
  { icon: MessageCircleHeart, tint: "gold" }, // לספר בקול בפעם הראשונה
  { icon: Wind, tint: "plum" }, // לזהות חרדה ולהחזיר שליטה
  { icon: ShieldCheck, tint: "teal" }, // להציב גבול ולבחור בעצמה
];
