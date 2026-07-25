// Convert every PNG under public/images to a WebP sibling for far smaller
// payloads (better LCP / Core Web Vitals). The static export ships with
// `images: { unoptimized: true }`, so Next can't optimize at request time —
// components reference the `.webp` directly and this script keeps them in sync.
//
// The PNGs stay in the repo as the source of truth. Idempotent: a WebP that is
// already newer than its PNG is left untouched, so re-runs (and the CI build
// that prepends this to `build:static`) are cheap.
import { existsSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const imagesDir = path.join(process.cwd(), "public", "images");
const QUALITY = 80;

const pngs = (await readdir(imagesDir)).filter((f) =>
  f.toLowerCase().endsWith(".png")
);

let converted = 0;
let upToDate = 0;

for (const file of pngs) {
  const src = path.join(imagesDir, file);
  const out = src.replace(/\.png$/i, ".webp");

  if (existsSync(out)) {
    const [srcStat, outStat] = await Promise.all([stat(src), stat(out)]);
    if (outStat.mtimeMs >= srcStat.mtimeMs) {
      upToDate++;
      continue;
    }
  }

  await sharp(src).webp({ quality: QUALITY }).toFile(out);
  converted++;
  console.log(`  ✓ ${file} → ${path.basename(out)}`);
}

console.log(
  `optimize-images: ${converted} converted, ${upToDate} up-to-date (${pngs.length} PNG sources).`
);
