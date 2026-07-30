import { z } from "zod";

/**
 * Lead payload contract. Shared by the client form, `/api/contact`, and the
 * Cloudflare Worker that serves that route in the static-export production
 * build — all three MUST validate identically, so this file is the only place
 * the shape is defined.
 *
 * Deliberately tiny: a name, a phone number, and ONE optional free-text field.
 *
 * ── THE RULE ON `question`, AND WHY IT IS DRAWN WHERE IT IS ──
 * The field is Pnina's own question — "מה הכי היית רוצה שיקרה בעקבות השיחה
 * שלנו?" — and it is **optional, forever**. It asks what she wants to HAPPEN
 * NEXT, not what happened to her, and that distinction is the whole safety
 * argument: a "tell me a bit about what you went through" box would create a
 * permanent record of the most sensitive thing a woman could write, sitting in
 * an n8n execution log, a spreadsheet and an inbox.
 *
 * So the boundary, restated (AGENTS.md rule 1 says the same):
 *   - exactly ONE free-text field, carrying her exact question;
 *   - never required, never validated into being filled, never nagged for;
 *   - never re-worded into a prompt to describe the assault;
 *   - never a second one, and never widened past 300 characters;
 *   - never sent to analytics. `AnalyticsEvent` must not learn it exists.
 * `.strict()` stays, so anything else the client invents is rejected outright.
 */

/** Where the lead came from, so the two audiences can be told apart. */
export const leadSources = ["landing", "lectures", "contact"] as const;
export type LeadSource = (typeof leadSources)[number];

/*
 * Israeli phone validation.
 *
 * This used to be a length check ("between 7 and 15 digits"), which accepted
 * 123456789 and 000-0000000 — a lead that cannot be called back is worse than
 * no lead, because nobody finds out until Pnina dials it. So the number is now
 * checked against the actual Israeli numbering plan (משרד התקשורת) instead.
 *
 * ISRAEL ONLY, deliberately. Every prefix below is one a number can really be
 * reached on in Israel, and a structural check is only worth anything if it is
 * anchored to a real plan; "any country code + 8..15 digits" is the old
 * anything-goes rule wearing a plus sign. A visitor calling from abroad still
 * has the email and the WhatsApp link in the footer. If that ever proves too
 * strict, widening it is one regex here plus the copy of it in
 * worker/src/contact.js — not a redesign.
 */

/** Mobile: 050-059 + 7 digits. Kept as `05\d` rather than an allow-list of
 *  live operator prefixes so a newly allocated one is not rejected. */
const IL_MOBILE = /^05\d{8}$/;
/** Virtual / VoIP operators: 072-079 + 7 digits. Real people are reachable on
 *  these (Rami Levy, 012 Mobile and friends all issue them). */
const IL_VIRTUAL = /^07[2-9]\d{7}$/;
/** Landline: area code 02/03/04/08/09 + 7 digits. 05 and 07 are excluded above
 *  on purpose — they are mobile ranges with a different length. */
const IL_LANDLINE = /^0[23489]\d{7}$/;

/** Separators a person actually types: spaces, hyphens, dots, parens. */
const PHONE_SEPARATORS = /[\s()./-]/g;

/**
 * Returns the number in canonical national form (`0547547452`), or `null` if it
 * is not a valid Israeli number.
 *
 * Accepts the ways people really write it: `054-754-7452`, `054 7547452`,
 * `+972-54-7547452`, `00972547547452`, with or without the trunk `0` after the
 * country code.
 */
export function normalizeIsraeliPhone(value: string): string | null {
  const compact = value.trim().replace(PHONE_SEPARATORS, "");
  // Digits with at most one leading `+`. Kills "call me", emails and formulas.
  if (!/^\+?\d+$/.test(compact)) return null;

  let digits = compact.startsWith("+") ? compact.slice(1) : compact;
  // International dial-out prefix, e.g. 00972-54-...
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("972")) {
    // Re-attach the trunk 0 that the country code replaces. The inner strip
    // handles the redundant +9720... form some people type.
    digits = `0${digits.slice(3).replace(/^0+/, "")}`;
  }

  if (
    IL_MOBILE.test(digits) ||
    IL_VIRTUAL.test(digits) ||
    IL_LANDLINE.test(digits)
  ) {
    return digits;
  }
  return null;
}

/** Shared by the client form and the API so both reject identically. */
export function isValidPhone(value: string): boolean {
  return normalizeIsraeliPhone(value) !== null;
}

export const contactSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    /**
     * Stored in canonical national form (`0547547452`) no matter how it was
     * typed, so every lead reaching n8n looks the same and can be dialled or
     * turned into a wa.me link without another parsing step downstream.
     */
    phone: z
      .string()
      .trim()
      .max(60)
      .refine(isValidPhone)
      .transform((value) => normalizeIsraeliPhone(value) as string),
    /**
     * Which CTA produced this lead. A woman looking for personal support and an
     * HR manager booking a talk need completely different replies, so n8n can
     * route on this. Optional + defaulted so a stale cached client keeps working.
     */
    source: z.enum(leadSources).optional().default("landing"),
    /**
     * Her question, answered only if the visitor felt like it. Optional, capped
     * at 300 characters, and never a condition of submitting — read the header
     * of this file before touching it.
     */
    question: z.string().trim().max(300).optional(),
    // Locale the form was submitted in, so n8n can format the reply.
    language: z.enum(["he"]).optional().default("he"),
    /**
     * Honeypot. Real people never see this field; bots fill it. Named `company`
     * because that is what autofill-driven bots look for.
     */
    company: z.string().trim().max(120).optional().default(""),
  })
  .strict();

export type ContactPayload = z.infer<typeof contactSchema>;
