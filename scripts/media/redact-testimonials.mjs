#!/usr/bin/env node
/**
 * Redacts third-party identity out of the testimonial screenshots.
 *
 * Run:  node scripts/media/redact-testimonials.mjs
 *
 * WHY THIS EXISTS
 * `public/testimonials/` (rendered from `testimonialShots` in
 * src/content/media.ts) holds screenshots of private messages women sent
 * Pnina. docs/04-testimonials-policy.md is the rule: no phone number, no
 * profile photo, no full name and no handle belonging to anyone but her may
 * survive into the published file. The publish leak gate cannot see a face or
 * an @handle inside a JPEG, so this is the only thing standing between a real
 * woman's Instagram identity and a public repository that keeps its history
 * forever.
 *
 * HOW IT WORKS
 * Each region below is blurred with a sigma large enough to destroy the glyph
 * or face structure entirely — not pixelated (pixelation of known-shaped text
 * is partially reversible) and not merely darkened. Everything outside the
 * listed regions is untouched, so the message a woman actually wrote stays
 * perfectly legible: that text is the whole point of the screenshot.
 *
 * SOURCES
 * Reads the pristine copy from `private-media/originals/<name>.original.jpg`
 * when one exists, so the script is idempotent — re-running never blurs an
 * already-blurred file a second time. `private-media/` is deny-listed in
 * scripts/publish-public.sh and never reaches the mirror.
 *
 * ADDING A SCREENSHOT
 * Copy it to private-media/originals/<name>.original.jpg FIRST, then add an
 * entry here with its regions, then run this. Never hand-edit the file in
 * public/images — the redaction has to be reproducible and reviewable.
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const publicDir = join(root, "public", "images");
const originalsDir = join(root, "private-media", "originals");

/**
 * Regions are in SOURCE PIXELS (the screenshots are 824×1216 and 830×1222 —
 * check `metadata()` before adding coordinates for a new one).
 */
const JOBS = [
  {
    file: "review-1.jpg",
    regions: [
      // Three copies of the SENDER's WhatsApp profile photo, beside her voice
      // notes. It is not Pnina (compare public/images/pnina-portrait.jpg), so
      // it is a third party's face on a public page — exactly what docs/04
      // says must not survive. At display size they are 12px specks; the blur
      // costs the screenshot nothing.
      { left: 154, top: 150, width: 70, height: 74, sigma: 14 },
      { left: 154, top: 253, width: 70, height: 74, sigma: 14 },
      { left: 154, top: 356, width: 70, height: 74, sigma: 14 },
    ],
  },
  {
    file: "review-2.jpg",
    regions: [
      // Top sliver: the reel attribution row ("LenzSpot · believe in
      // yourself") from a third-party account, already half cropped by the
      // screenshot. A legible account name that is not hers and not the
      // sender's — blurred rather than cropped, because cropping would change
      // the image's aspect ratio and the registered dimensions with it.
      { left: 0, top: 0, width: 784, height: 18, sigma: 10 },
    ],
  },
  {
    file: "review-3.jpg",
    regions: [
      // The Instagram handle that shipped legible in the first release
      // (@… under the yellow banner, upper third). A dark overlay was laid
      // over it in a later pass; this re-applies a real blur on top of the
      // pristine original so the redaction is destructive rather than a
      // darkening that a contrast stretch could partially lift.
      { left: 405, top: 112, width: 292, height: 62, sigma: 22 },
    ],
  },
];

for (const { file, regions } of JOBS) {
  const original = join(originalsDir, file.replace(/\.jpg$/, ".original.jpg"));
  const target = join(publicDir, file);
  const source = existsSync(original) ? original : target;

  if (source === target) {
    console.warn(
      `[redact] ${file}: no private-media/originals copy — redacting IN PLACE.\n` +
        `         Re-running will blur the already-blurred file again. Save an original.`
    );
  }

  const base = sharp(source);
  const { width, height } = await base.metadata();

  const overlays = await Promise.all(
    regions.map(async ({ left, top, width: w, height: h, sigma }) => {
      if (left + w > width || top + h > height) {
        throw new Error(
          `[redact] ${file}: region ${left},${top} ${w}×${h} falls outside ${width}×${height}`
        );
      }
      const patch = await sharp(source)
        .extract({ left, top, width: w, height: h })
        // Blur the crop, then blur again after a downscale round-trip: a single
        // pass on a small crop can leave enough low-frequency structure for a
        // letterform to still be guessable.
        .blur(sigma)
        .resize({ width: Math.max(4, Math.round(w / 8)) })
        .resize({ width: w, height: h })
        .blur(sigma / 2)
        .toBuffer();
      return { input: patch, left, top };
    })
  );

  await sharp(source)
    .composite(overlays)
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(`${target}.tmp`);

  const { rename } = await import("node:fs/promises");
  await rename(`${target}.tmp`, target);
  console.log(
    `[redact] ${file}: ${regions.length} region(s) blurred → public/images/${file}`
  );
}
