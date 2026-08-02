#!/usr/bin/env node
/**
 * Renders the site's favicon into `src/app/icon.png` — the icon a browser tab
 * shows and the one a phone uses when someone saves the page to a home screen.
 * Next's App Router picks `src/app/icon.png` up by convention and emits the
 * <link rel="icon"> for it; there is nothing to wire by hand.
 *
 * Run after changing the source:  node scripts/brand/generate-icon.mjs
 *
 * ── THE SOURCE CHANGED IN 0.17.2 ──
 * It was `public/brand/pearl-mark.svg`, a geometric shell-and-pearl drawn for
 * this size. It is now `public/brand/pearl-shell.png`, the PHOTOGRAPHIC shell
 * and pearl cut out of Pnina's own background image, because that is what she
 * asked for (2026-08-02, via Daniel): her face in the site header, and the
 * shell as the website's icon.
 *
 * The drawn mark is NOT deleted. It still drives the OG share card, and it is
 * the fallback if the photograph ever reads badly in a tab — a photograph at
 * 16px is the hard case for a favicon and this one only just survives it,
 * which is why the plate and the fill fraction below matter more than they did.
 *
 * Deliberately NOT part of the build, for the same reason the OG card is not:
 * the icon changes about once a year, and a build that has to rasterise an
 * image is a build that fails on a Tuesday for no reason. The PNG is committed.
 *
 * WHY A CREAM PLATE AND NOT A TRANSPARENT PNG
 * A transparent favicon is at the mercy of the browser chrome behind it, and
 * this shell is pale cream: on a dark tab strip a transparent version of it
 * loses its own edges. The cream plate (#fbf7f1, the site's own `--canvas`)
 * means the tab always shows her shell on her paper.
 */
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");

const SIZE = 512;
const PLATE = "#fbf7f1"; // --canvas, light
// A photograph needs more of the plate than a line drawing did: the drawn mark
// was a high-contrast outline that read at 16px with air around it, while this
// shell is a low-contrast cream object that needs every pixel it can get before
// it stops being a peach smudge. 0.86 is as far as it goes before the
// rounded-corner mask some platforms apply starts clipping the dish.
const FILL = 0.86;

const src = join(root, "public", "brand", "pearl-shell.png");
const out = join(root, "src", "app", "icon.png");
mkdirSync(dirname(out), { recursive: true });

// The cutout is already trimmed to its own bbox and square-padded, so `contain`
// inside the fill box is a straight scale with no cropping.
const inner = Math.round(SIZE * FILL);
const shell = await sharp(readFileSync(src))
  .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  // A slight sharpen, because everything below 64px is where this asset is
  // weakest. Kept gentle: pushed harder it produces orange fringing along the
  // shell's lit edge, which at 16px is worse than the softness it fixes.
  .sharpen({ sigma: 0.7 })
  .toBuffer();

// NOT `palette: true`. The drawn mark was two flat colours and quantised to a
// fraction of its size; this is a photograph with a continuous cream-to-peach
// ramp across the shell, and a 256-colour palette bands it visibly. Truecolour
// at max compression is the right trade here.
await sharp({
  create: { width: SIZE, height: SIZE, channels: 4, background: PLATE },
})
  .composite([{ input: shell, gravity: "center" }])
  .png({ compressionLevel: 9, effort: 10 })
  .toFile(out);

console.log(`[generate-icon] wrote ${out} (${SIZE}×${SIZE})`);
