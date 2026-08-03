/**
 * Cut the two shipped crops of Pnina's portrait from the one original she sent.
 *
 * She sent a single 1200×1600 balcony selfie on the 2026-08-03 call, and the
 * site needs two different framings of it:
 *
 *   public/images/pnina-portrait.jpg   900×1125 (4:5)  founder section, /about
 *   public/images/pnina-mark.jpg       320×320  (1:1)  the header mark
 *
 * ── WHY THIS IS A SCRIPT AND NOT A CSS CROP ──
 * The site is a static export; there is no request-time image pipeline, so the
 * bytes a phone downloads are the bytes committed here. Cropping with
 * `object-position` would ship the whole 1200×1600 frame — including the half
 * of it that is a garden — to every visitor and then hide most of it.
 *
 * ── THE FRAMING IS HERS ──
 * *"במי אני תמונה מעל הראש עד הכתפיים או חזה"* (Pnina), and *"way less green
 * space"* (Daniel). Both windows are anchored near the TOP of the source, which
 * is where her face is; a centred crop of a selfie lands on the collarbone.
 *
 * Run: node scripts/media/crop-portrait.mjs
 * Input: private-media/originals/pnina-portrait-original.jpg (not published)
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = "private-media/originals/pnina-portrait-original.jpg";
const OUT = "public/images";

/** Fraction of the source width each window keeps, and where its top edge sits.
 *  Tuned by eye against the one photograph that exists; if she sends another,
 *  re-check these two numbers rather than assuming they travel. */
const CROPS = [
  { name: "pnina-portrait.jpg", widthPct: 0.86, topPct: 0.02, ratio: 4 / 5, out: [900, 1125] },
  { name: "pnina-mark.jpg", widthPct: 0.72, topPct: 0.06, ratio: 1, out: [320, 320] },
];

const image = sharp(SRC);
const { width, height } = await image.metadata();
await mkdir(OUT, { recursive: true });

for (const crop of CROPS) {
  let w = Math.round(width * crop.widthPct);
  let h = Math.round(w / crop.ratio);
  let top = Math.round(height * crop.topPct);
  // Never read past the bottom edge: shrink the window rather than move it up,
  // so the face stays where it was framed.
  if (top + h > height) {
    h = height - top;
    w = Math.round(h * crop.ratio);
  }
  const left = Math.round((width - w) / 2);
  await sharp(SRC)
    .extract({ left, top, width: w, height: h })
    .resize(crop.out[0], crop.out[1], { fit: "cover" })
    .jpeg({ quality: 88, progressive: true, mozjpeg: true })
    .toFile(path.join(OUT, crop.name));
  console.log(`${crop.name}  ${w}x${h} @ ${left},${top}  ->  ${crop.out.join("x")}`);
}
