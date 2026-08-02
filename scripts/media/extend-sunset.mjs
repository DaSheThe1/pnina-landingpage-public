// Turns Pnina's own sunset photograph into the four background plates the site
// ships. Sibling of `grade-sand.mjs`, which did the same job for Daniel's sand
// frames until 0.17.0 — read that file's header first, because the shadow knee
// and the dark-plate grade here are the same two ideas and the reasoning for
// them is written out there in full.
//
//   in   private-media/originals/pnina-sunset-wide.png   2752×1536  (not in git)
//        private-media/originals/pnina-sunset-tall.png   1536×2752  (not in git)
//   out  public/images/bg-sunset.webp                 2560×1440   light, desktop
//        public/images/bg-sunset-portrait.webp        1080×1920   light, phone
//        public/images/bg-sunset-dark.webp            2560×1440   dark, desktop
//        public/images/bg-sunset-dark-portrait.webp   1080×1920   dark, phone
//
// Run with:  node scripts/media/extend-sunset.mjs
// Outputs are COMMITTED — the site is a static export with no request-time image
// pipeline, and `scripts/optimize-images.mjs` deliberately never touches these
// (it only picks up .png/.jpg; these are referenced straight from CSS, §10).
//
// ── 0.17.0: THE REAL RENDERS ARRIVED, AND THE HARD PART OF THIS FILE IS GONE ──
// It used to take Pnina's single 362×514 original and CONTINUE it sideways —
// fitting it on its tight axis and stretching its own edge bands out to the
// frame, cross-faded so the join did not read as a line. That was a workaround
// for having one small portrait image and needing two large ones.
//
// Daniel generated proper 16:9 and 9:16 masters on 2026-08-02, so there is
// nothing left to invent: each output is one real frame, resized. What remains
// is the part that was never a workaround — the shadow knee that makes the light
// plates safe to put type over, and the dusk grade that makes the dark ones safe
// to put WHITE type over. Those two are the reason this script exists at all.
//
// The masters carry Gemini's sparkle watermark. It is removed before they are
// stored, by `scripts/media/remove-gemini-mark.py`, which clones clean sand over
// it rather than inpainting — TELEA leaves a smooth, grainless patch that reads
// as a rectangle against this sand. Re-run that first if a new master arrives.
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

const root = process.cwd();
const SRC_WIDE = path.join(root, "private-media", "originals", "pnina-sunset-wide.png");
const SRC_TALL = path.join(root, "private-media", "originals", "pnina-sunset-tall.png");
const outDir = path.join(root, "public", "images");

/**
 * THE SHADOW KNEE, in linear luminance — and on this photograph it is doing real
 * work rather than trimming a tail.
 *
 * The sand plates this replaced were floored at 195/255 (linear L 0.47), which is
 * why `--background` could be turned off entirely on 2026-07-30 and the page
 * still read: the darkest pixel a glyph could land on was 7.5:1 against the ink
 * all by itself. Pnina's frame is a real photograph with a sunset in it, so it
 * has a sea, a shadow under the shell and a dark crevice between the valves. Its
 * darkest one percent measures **linear L 0.115, i.e. 2.64:1** against
 * `--foreground` — a fail on its own, before any of the lighter inks.
 *
 * Flooring it all the way back to the sand's 0.47 would have lifted more than
 * half the picture (its median is 0.418) and thrown the sunset away to keep an
 * old number. So the knee only removes the BLACK TAIL — everything above SOFT is
 * the photograph, byte for byte — and the rest of the gap is paid by the paper
 * veil, which is what `--background` is for and which only costs anything where
 * type actually sits. The split is written up beside `--background` in
 * globals.css; the two numbers have to move together.
 *
 * FLOOR is the deepest linear luminance the light plates may reach. WIDTH is how
 * wide the bend is; above FLOOR + WIDTH nothing is touched.
 */
const FLOOR = 0.24;
const WIDTH = 0.10;

/**
 * THE DARK PLATES — the same photograph at dusk, not an inversion.
 *
 * On the light plates the number that binds is the DARKEST pixel, because the ink
 * is dark. After dark it is the exact opposite: the ink is white and near-white,
 * so what has to be controlled is the BRIGHTEST pixel — and this photograph's
 * brightest thing is a sun.
 *
 * A gamma-and-gain grade was tried first and was not good enough: it left the
 * sun at linear L 0.268, which is **2.10:1** against `--subtle-foreground`
 * (#cecece). Daniel's sand-dark plate capped at 0.039 and cleared 7.46:1, which
 * is why the dark scheme needs no veil at all — and keeping that property is
 * worth more than the extra stop of sky.
 *
 * So the dark path does what `grade-sand.mjs` does: the frame's own luminance is
 * normalised against its own percentiles and re-mapped into a narrow band just
 * above the dark canvas (#1c1611). Each pixel keeps its measured r:g:b ratio and
 * only its brightness is replaced, so the plate reads as HER sunset at night
 * rather than as sunset-coloured paint.
 */
const DARK_LO = 0.006; // linear luminance of the darkest pixel after grading
const DARK_HI = 0.052; // …and the brightest. 7.4:1 against #cecece.
const DARK_COOL = [1.0, 0.97, 0.99]; // a whisper of cool, so dusk is not sepia

const TARGETS = [
  { src: SRC_WIDE, name: "bg-sunset", dark: "bg-sunset-dark", width: 2560, height: 1440, quality: 80 },
  {
    src: SRC_TALL,
    name: "bg-sunset-portrait",
    dark: "bg-sunset-dark-portrait",
    width: 1080,
    height: 1920,
    quality: 78,
  },
];

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const linearToSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
const luminance = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** Raw RGB pixels plus their dimensions, so the knee can work per pixel. */
async function pixels(img) {
  const { data, info } = await img
    .clone()
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

function fromPixels({ data, width, height }) {
  return sharp(Buffer.from(data), { raw: { width, height, channels: 3 } });
}

async function build({ src, name, dark: darkName, width, height, quality }) {
  // One real frame per output, resized to fit. `cover` rather than `fill` so the
  // aspect is preserved and any rounding is a crop of a pixel or two rather than
  // a stretch; both masters are already the target aspect, so nothing is lost.
  const canvas = sharp(src).resize(width, height, { fit: "cover", kernel: "lanczos3" });

  // The joins are deliberately left hard. Feathering them — a blurred copy of
  // each seam band laid back over the seam — was tried and was worse: the band
  // picks up the canvas fill at the frame edge and lands as a bright vertical
  // halo, which is far more visible than the change of detail it was hiding.
  const flat = sharp(await canvas.png().toBuffer());
  const light = await pixels(flat);
  const dark = { ...light, data: Buffer.from(light.data) };

  // The dark grade needs the frame's own range before it can re-map into one, so
  // luminance is walked once up front. 0.5/99.5 rather than min/max: a single
  // encoder-artefact pixel at either end must not set the whole plate's exposure.
  const lums = new Float32Array(light.data.length / 3);
  for (let i = 0, p = 0; i < light.data.length; i += 3, p++) {
    lums[p] = luminance(
      srgbToLinear(light.data[i] / 255),
      srgbToLinear(light.data[i + 1] / 255),
      srgbToLinear(light.data[i + 2] / 255)
    );
  }
  const sorted = Float32Array.from(lums).sort();
  const pick = (q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
  const srcLo = pick(0.005);
  const srcHi = pick(0.995);

  const soft = FLOOR + WIDTH;
  let lifted = 0;
  for (let i = 0; i < light.data.length; i += 3) {
    const r = srgbToLinear(light.data[i] / 255);
    const g = srgbToLinear(light.data[i + 1] / 255);
    const b = srgbToLinear(light.data[i + 2] / 255);
    const y = luminance(r, g, b);

    // ── light: the knee, applied to LUMINANCE and re-applied to the three
    // channels as one RATIO, so the pixel keeps its own colour and only its
    // brightness moves. Same technique, and the same curve, as grade-sand.mjs:
    //
    //     out = soft − (soft − FLOOR)·tanh((soft − y)/(soft − FLOOR))
    //
    // which is continuous and slope-1 at `soft` (so there is no visible edge
    // where it starts to bite) and asymptotes to FLOOR as y goes to black.
    // Above `soft` the pixel is not touched at all.
    // ⚠️ AND IT HAS TO DESATURATE AS IT LIFTS. A pure ratio was the first
    // version and it put a vivid ORANGE SMEAR under the shell: the shadow there
    // is a deeply saturated warm pixel, so multiplying all three channels by
    // k≈3 pins red at 1 while green and blue climb, and a shadow turns into a
    // highlighter. Real shadows lifted by haze go GREY, not vivid, so the more
    // a pixel is lifted the further it is mixed toward the neutral of its own
    // new luminance. Pixels near `soft` are barely mixed at all, which is why
    // the picture's own colour survives everywhere it is actually visible.
    if (y < soft) {
      const span = soft - FLOOR;
      const out = soft - span * Math.tanh((soft - y) / span);
      const k = y > 1e-6 ? out / y : 0;
      const mix = Math.min(0.45, Math.max(0, (k - 1) * 0.2));
      const chan = (lin) => linearToSrgb(Math.min(1, (1 - mix) * lin * k + mix * out));
      light.data[i] = Math.round(255 * (y > 1e-6 ? chan(r) : linearToSrgb(out)));
      light.data[i + 1] = Math.round(255 * (y > 1e-6 ? chan(g) : linearToSrgb(out)));
      light.data[i + 2] = Math.round(255 * (y > 1e-6 ? chan(b) : linearToSrgb(out)));
      lifted++;
    }

    // ── dark: the pixel's own colour, its brightness replaced by the same
    // position inside the narrow dusk band. `y` here is the ORIGINAL luminance
    // (this runs on the untouched copy), so the light plate's knee does not
    // leak into the dark one.
    const t = Math.min(1, Math.max(0, (y - srcLo) / Math.max(srcHi - srcLo, 1e-6)));
    const targetY = DARK_LO + (DARK_HI - DARK_LO) * t;
    const kd = y > 1e-6 ? targetY / y : 0;
    for (let c = 0; c < 3; c++) {
      const lin = srgbToLinear(dark.data[i + c] / 255);
      const v = y > 1e-6 ? lin * kd * DARK_COOL[c] : targetY;
      dark.data[i + c] = Math.round(255 * linearToSrgb(Math.min(1, Math.max(0, v))));
    }
  }

  await fromPixels(light).webp({ quality, effort: 6 }).toFile(path.join(outDir, `${name}.webp`));
  await fromPixels(dark)
    .webp({ quality: quality - 4, effort: 6 })
    .toFile(path.join(outDir, `${darkName}.webp`));

  const pct = ((lifted / (light.data.length / 3)) * 100).toFixed(1);
  console.log(`  ${name.padEnd(20)} ${width}×${height}   knee touched ${pct}% of the frame`);
}

for (const src of [SRC_WIDE, SRC_TALL]) {
  if (!existsSync(src)) {
    console.error(`missing source: ${src}`);
    process.exit(1);
  }
}
await mkdir(outDir, { recursive: true });
console.log("plates:");
for (const t of TARGETS) await build(t);
