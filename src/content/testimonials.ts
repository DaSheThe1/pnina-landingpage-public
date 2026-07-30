/**
 * Testimonials are the highest-risk content on this site. Read
 * `docs/04-testimonials-policy.md` before touching anything here.
 *
 * The plan (agreed with Daniel) is screenshots of real messages with the
 * sender's identity removed — initials, a first name, or a pseudonym, at each
 * woman's choice. The images live in `testimonialShots` in
 * `src/content/media.ts`; the attributed text lives in `testimonials.items` in
 * `messages/he.json`.
 */

/**
 * While true, the section renders a visible notice that the quotes shown are
 * illustrative examples, not real client feedback.
 *
 * Now `false`: the screenshots in `testimonialShots` and the quotes in
 * `testimonials.items` are real messages Pnina received and shared publicly on
 * her own Instagram. The section shows `privacyNote` instead.
 *
 * ⚠️ This flag must always tell the truth about what is on screen. If anything
 * illustrative, placeholder or unconsented ever goes back into the section,
 * flip it back to `true` IN THE SAME COMMIT. Presenting made-up quotes as real
 * client experiences of sexual assault recovery is not a marketing shortcut —
 * it is fabricated testimony about trauma.
 *
 * (This comment used to say "never flip this back to `false`", which was the
 * wrong way round: `false` is the current, correct value.)
 */
export const testimonialsAreSamples = false;
