// Build-time image pipeline for the static export.
//
// Production is `output: "export"`, so there is no Next.js image optimizer at
// request time and no on-the-fly WebP/AVIF. Whatever sits in `public/` is
// exactly what every visitor downloads. This script is the substitute: it
// pre-renders each source image into a small ladder of WebP widths under
// `public/images/optimized/`, and writes a manifest that
// `src/lib/image-loader.ts` (the custom `next/image` loader) reads to build a
// real `srcSet`. Components keep pointing at the original `.jpg`/`.png` path —
// nothing in a component needs to know this happened.
//
// Outputs and the manifest are COMMITTED. `next dev`, `pnpm build` and the CI
// export all go through the same loader, so a missing file would be a broken
// image in every mode, not just in CI. Re-running is cheap and idempotent: a
// variant newer than its source is left alone.
//
// SKIPPED ON PURPOSE
//   • `process-*.jpg` — the four AI images the "how it works" steps used to
//     carry. The visual-identity phase (docs/12 §B D9) deleted them, and the
//     steps now render their number on a tinted panel instead, so the rule
//     below matches nothing. It is kept as a guard: if anyone drops a file of
//     that name back into public/images, it should NOT quietly acquire a WebP
//     ladder and reappear on the page.
//
// TESTIMONIAL SCREENSHOTS: `review-*.jpg` are re-encoded FROM `public/`, which
// is the redacted copy. Never point this script at `private-media/originals/`
// — those still show the sender's handle. Format conversion only; no crop, no
// resize past the ladder, nothing that could reveal what was redacted. See
// docs/04-testimonials-policy.md.
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const root = process.cwd();
const imagesDir = path.join(root, "public", "images");
const outDir = path.join(imagesDir, "optimized");
const manifestPath = path.join(root, "src", "lib", "image-manifest.generated.ts");

/** Files left exactly as they are (see the header). */
const SKIP = /^process-\d+\.jpg$/i;

/**
 * Candidate widths. A source only gets the entries comfortably below its own
 * width (upscaling costs bytes and buys nothing), plus its native width as the
 * top rung.
 */
const LADDER = [128, 256, 320, 480, 640, 828, 1080];

/**
 * Screenshots of a conversation are text at small point sizes: the sentence in
 * the bubble IS the testimonial, and WebP's chroma handling smears it first.
 * They get a higher quality than the photographs.
 */
const QUALITY_PHOTO = 80;
const QUALITY_SCREENSHOT = 88;

const isScreenshot = (file) => /^review-/i.test(file);

const sources = (await readdir(imagesDir))
  .filter((f) => /\.(png|jpe?g)$/i.test(f))
  .filter((f) => !SKIP.test(f))
  .sort();

await mkdir(outDir, { recursive: true });

/** `{ "/images/pnina-about.jpg": [320, 480, 640, 854] }` */
const manifest = {};
/** Every variant this run believes should exist; anything else gets swept. */
const expected = new Set();
let written = 0;
let upToDate = 0;

for (const file of sources) {
  const src = path.join(imagesDir, file);
  const stem = file.replace(/\.[^.]+$/, "");
  const meta = await sharp(src).metadata();
  const intrinsic = meta.width ?? 0;
  if (!intrinsic) {
    console.warn(`  ! ${file}: no intrinsic width, skipped`);
    continue;
  }

  // `< intrinsic * 0.9` keeps the ladder from emitting a 828px variant of an
  // 854px source — two near-identical files for no benefit.
  const widths = [
    ...LADDER.filter((w) => w < intrinsic * 0.9),
    intrinsic,
  ].sort((a, b) => a - b);

  const quality = isScreenshot(file) ? QUALITY_SCREENSHOT : QUALITY_PHOTO;

  for (const width of widths) {
    const out = path.join(outDir, `${stem}-${width}.webp`);
    expected.add(path.basename(out));

    if (existsSync(out)) {
      const [srcStat, outStat] = await Promise.all([stat(src), stat(out)]);
      if (outStat.mtimeMs >= srcStat.mtimeMs) {
        upToDate++;
        continue;
      }
    }

    await sharp(src)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality, effort: 6 })
      .toFile(out);
    written++;
    console.log(`  ✓ ${file} → optimized/${stem}-${width}.webp`);
  }

  // ── ⚠️ A CONTENT HASH, AND IT IS NOT COSMETIC ──
  // These files are served from Cloudflare with `max-age=14400`, and the
  // OPTIMISED variants keep their filename when the source image changes. On
  // 2026-08-04 a re-cropped header portrait deployed correctly and the edge
  // went on serving the previous bytes under the same URL for hours — verified
  // by md5: the plain URL and the same URL with a `?bust=` differed, and only
  // the busted one matched the file that had just been pushed.
  //
  // So the loader appends `?v=<hash>` (see src/lib/image-loader.ts). A query
  // string is part of Cloudflare's cache key, so a changed image is a changed
  // URL and every visitor gets it on the next request instead of in four hours.
  // Hashing the SOURCE rather than each variant is deliberate: one value per
  // image, and any re-encode of the source changes all its widths together,
  // which is exactly when they all need busting.
  manifest[`/images/${file}`] = {
    widths,
    v: createHash("sha1").update(await readFile(src)).digest("hex").slice(0, 8),
  };
}

// Sweep variants whose source was renamed, deleted or moved onto the skip list.
// Without this, `public/images/optimized/` accumulates orphans that the loader
// never asks for but the export still ships — and, for a testimonial
// screenshot, a stale variant could outlive the redaction it was derived from.
let swept = 0;
for (const file of await readdir(outDir)) {
  if (expected.has(file)) continue;
  await rm(path.join(outDir, file));
  swept++;
  console.log(`  – removed orphan optimized/${file}`);
}

const manifestSource = `// GENERATED by scripts/optimize-images.mjs — do not edit by hand.
//
// Maps each source image under public/images/ to the WebP widths that exist in
// public/images/optimized/, plus a short hash of the SOURCE file's contents.
// src/lib/image-loader.ts turns the widths into a srcSet and appends the hash as
// \`?v=\`, which is what busts Cloudflare's cache when an image is re-cropped
// without being renamed. A path that is absent here is served exactly as
// authored.
//
// Regenerate with: pnpm optimize:images
export type ImageVariant = { widths: readonly number[]; v: string };

export const imageVariants: Record<string, ImageVariant> = ${JSON.stringify(
  manifest,
  null,
  2
)};
`;

const previous = existsSync(manifestPath)
  ? readFileSync(manifestPath, "utf8")
  : "";
if (previous !== manifestSource) {
  await writeFile(manifestPath, manifestSource, "utf8");
  console.log(`  ✓ manifest → ${path.relative(root, manifestPath)}`);
}

const skipped = (await readdir(imagesDir)).filter((f) => SKIP.test(f)).length;
console.log(
  `optimize-images: ${written} written, ${upToDate} up-to-date, ${swept} swept ` +
    `across ${sources.length} sources (${skipped} skipped by policy).`
);
