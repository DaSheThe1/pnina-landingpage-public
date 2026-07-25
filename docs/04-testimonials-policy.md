# Testimonials policy

**Read this before adding, editing, or publishing anything testimonial-shaped.**

Testimonials are the highest-risk content on this site. A quote here is a woman
saying, in public, that she experienced a sexual assault. Getting this wrong does
not produce a marketing problem; it produces real harm to a specific person.

## The rules

1. **Explicit, specific consent.** Not "she said nice things in a message" —
   consent to publish *that message*, on *this website*, in *that form*. Consent
   to be quoted anonymously is not consent to have a screenshot published.
2. **No identifying details survive.** Crop out the phone number, the profile
   photo, the contact name, the timestamp if it narrows things down, the group
   name, any place or workplace, any detail of the incident that would identify
   the person to someone who knows her.
3. **Attribution is her choice**: initials, a first name, or a pseudonym. When a
   pseudonym is used, the site must not imply it is a real first name.
4. **Consent is revocable.** If she withdraws it, the testimonial comes down
   immediately — and see the warning about git history below.
5. **Never invent a testimonial.** Not as a placeholder that "will be replaced
   later", not as an example, not as a demo for the client. The placeholders
   currently in `messages/he.json` are visibly labelled as illustrative examples
   and the section renders a notice saying so, because
   `testimonialsAreSamples = true` in `src/content/testimonials.ts`.
6. **`testimonialsAreSamples` is flipped by Pnina, not by an agent.** Flipping it
   is the act of asserting that everything shown is real client feedback.

## Why git history matters here

The public repo is world-readable and **keeps its history forever**. A screenshot
with a visible phone number, pushed once and deleted the next day, remains in
that repository's history permanently, reachable by anyone, attached to a woman
who told this practice about a sexual assault. Deleting the file does not undo
publication.

This is why `scripts/publish-public.sh` blocks the push when it finds:
- any Israeli phone number not declared in `src/config/site.ts`, and
- any file in `public/testimonials/` not registered in `src/content/media.ts`.

The second check exists so that every published screenshot has passed through the
one file where the consent decision is recorded. Do not work around either gate.
If one fires, the answer is to fix the content, never to disable the check.

## How to add one, once consent exists

1. Crop the screenshot so nothing in rule 2 survives. Check the edges and any
   notification bar.
2. Save it to `public/testimonials/` with a non-identifying filename
   (`testimonial-01.webp`, not `rachel-whatsapp.webp`).
3. Register it in `testimonialShots` in `src/content/media.ts` with Hebrew alt
   text that conveys the sentiment without repeating identifying detail.
4. Add the attributed text to `testimonials.items` in `messages/he.json`.
5. Record where and when consent was given — outside this repo, wherever client
   records are kept.
6. Only once every displayed testimonial is real: Pnina flips
   `testimonialsAreSamples` to `false`.
