#!/usr/bin/env node
/**
 * Renders `public/brand/pearl-mark.svg` into `src/app/icon.png` — the site's
 * favicon and the icon a phone uses when someone saves the page to a home
 * screen. Next's App Router picks `src/app/icon.png` up by convention and emits
 * the <link rel="icon"> for it; there is nothing to wire by hand.
 *
 * Run after editing the mark:  node scripts/brand/generate-icon.mjs
 *
 * Deliberately NOT part of the build, for the same reason the OG card is not:
 * the mark changes about once a year, and a build that has to rasterise an
 * image is a build that fails on a Tuesday for no reason. The PNG is committed.
 *
 * WHY A CREAM PLATE AND NOT A TRANSPARENT PNG
 * A transparent favicon is at the mercy of the browser chrome behind it, and
 * these strokes are gold: on a dark tab strip a transparent version of this mark
 * is a smear. The cream plate (#fbf7f1, the site's own `--canvas`) means the
 * tab always shows her mark on her paper.
 *
 * THE MARK IS RECOLOURED HERE, on purpose. In the page its strokes are
 * `currentColor`; baked into a 512px plate they need one fixed value, and the
 * decorative gold (--gold #c9a227) is only about 2.3:1 on cream — at 16px in a
 * tab that is a yellow blur. #8a6418 is a deeper gold, 5.0:1 on the plate, and
 * still reads as gold rather than as brown. The pearl's own pale fill is inside
 * the mark and is deliberately NOT recoloured — see the note in the SVG.
 */
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");

const SIZE = 512;
const PLATE = "#fbf7f1"; // --canvas, light
const MARK = "#8a6418"; // deep gold, 5.0:1 on the plate
// The mark's artboard is 64×64 but the INKED area is not: including the 2.3
// stroke it runs x 9.85→54.15 and y 10.35→54.65, i.e. a 44.3 square centred at
// (32, 32.5) rather than at (32, 32). Scaling the artboard instead of the bbox
// is what leaves a favicon looking small and lonely with a low centre of
// gravity, so this scales and centres the bbox.
const BBOX = { x: 9.85, y: 10.35, size: 44.3 };
// Share of the plate the mark's bbox occupies. An app icon wants to be nearly
// edge-to-edge; 0.72 is as far as it goes before the rounded-corner mask some
// platforms apply starts clipping the dish.
const FILL = 0.72;

const markSvg = readFileSync(
  join(root, "public", "brand", "pearl-mark.svg"),
  "utf8"
);

// Strip the XML declaration/comment wrapper and re-host the mark inside a
// plate-sized artboard. `currentColor` resolves off the wrapping <g>.
const inner = markSvg
  .replace(/<\?xml[^>]*\?>/g, "")
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/^[\s\S]*?<svg[^>]*>/, "")
  .replace(/<\/svg>\s*$/, "");

const scale = (SIZE * FILL) / BBOX.size;
const tx = SIZE / 2 - (BBOX.x + BBOX.size / 2) * scale;
const ty = SIZE / 2 - (BBOX.y + BBOX.size / 2) * scale;

const composed = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${PLATE}"/>
  <!-- fill="none" is load-bearing: it lives on the mark's own <svg> element,
       which is exactly the element this composition throws away. Without it the
       shell's outline path fills solid black and the icon is a black blob. -->
  <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})" color="${MARK}" fill="none">
    ${inner}
  </g>
</svg>`;

const out = join(root, "src", "app", "icon.png");
mkdirSync(dirname(out), { recursive: true });

await sharp(Buffer.from(composed), { density: 384 })
  .resize(SIZE, SIZE)
  .png({ compressionLevel: 9 })
  .toFile(out);

console.log(`[generate-icon] wrote ${out} (${SIZE}×${SIZE})`);
