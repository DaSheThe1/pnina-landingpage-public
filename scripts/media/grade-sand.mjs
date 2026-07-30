// Turns Daniel's two sand photographs into the four background plates the site
// ships. As of 2026-07-30 this is very nearly a RESIZE: read the note below
// before adding anything to it.
//
//   in   private-media/originals/sand-desktop-original.png   2752×1536  (not in git)
//        private-media/originals/sand-mobile-original.png    1536×2752  (not in git)
//   out  public/images/sand-light.webp             1920 wide   light scheme
//        public/images/sand-light-portrait.webp     960 wide   the same, phone plate
//        public/images/sand-dark.webp              1920 wide   dark scheme
//        public/images/sand-dark-portrait.webp      960 wide
//
// Run with:  node scripts/media/grade-sand.mjs
// The outputs are COMMITTED (there is no image optimizer at request time — the
// site is a static export), and `scripts/optimize-images.mjs` deliberately never
// touches them: it only picks up .png/.jpg, and these are referenced straight
// from CSS (globals.css §10) rather than through next/image, because a background
// plate has no intrinsic layout size and no srcSet to pick from.
//
// The two sources are separate photographs, not one frame cropped twice: the
// portrait one is a real 9:16 shot whose ripples run down the frame, which is what
// a phone wants. Neither is upscaled — both are downsampled to their output size,
// so the grain stays grain.
//
// ── 2026-07-30: THE GRADE WAS STILL CHANGING HIS PHOTOGRAPH, AND IT SHOWED ──
// Daniel, on the plates 0.12.1 shipped: "pretty sure the background doesn't have
// the same image we generated… background looks sandy but I don't think it's what
// we generated", and on the phone: "it looks ugly."
//
// He was right twice, and the cause was one line — a ×1.09 MULTIPLY (`GAIN`) whose
// job was to close the tonal gap between the frame and the cream canvas and buy
// about 0.2 of a contrast ratio. The arithmetic worked. What it did to the picture
// did not:
//
//   • His frame's mean is 243·218·186 — a warm tan whose RED channel is already
//     within twelve levels of white. Multiply that by 1.09 and red lands past 255.
//     Measured on the shipped plate: **63% of the desktop frame and 56% of the
//     phone frame had R pinned at exactly 255.** On two thirds of the picture the
//     red channel carried no information at all.
//   • Clipping one channel and not the others is a hue shift, not a brightening.
//     Sand is tan because red leads green leads blue; hold red flat and lift the
//     other two and the warm tan turns into a pale, chalky yellow. That is what
//     "sandy but not what we generated" is describing.
//   • It flattened it. Frame mean 220/255 → plate mean 239/255, and the ripple's
//     own modulation fell with it (stddev 7.25 → 3.89 at 1920). The phone frame is
//     the more contrasty of the two, so it had the most to lose — which is why the
//     phone was the one that looked wrong enough to name.
//
// So GAIN is gone, and with it the highlight knee that only existed to make GAIN
// survivable. What is left is his photograph, resized, plus the one correction
// below that the page genuinely cannot do without. The contrast that GAIN was
// buying is now bought by the paper veil instead — `--background` went from 72% to
// 84% in globals.css, which costs twelve points of sand UNDER TYPE and nothing
// anywhere else. That is the right place to spend it: the veil only pays where
// type actually is, while a tone curve on the plate is paid over every pixel of
// the picture, including the hero and the joins, where there is no type at all.
//
// ── THE ONE CORRECTION THAT STAYS: A SHADOW KNEE ──
// A fixed plate under a scrolling page means every pixel of the photograph
// eventually sits behind every paragraph, so the number that decides whether the
// page is readable is the plate's DARKEST pixel, not its average. These frames are
// bright (median 222/255) but they have a long thin dark tail — a grain of shell,
// the very bottom of a trough — running to nearly black, and a pixel that dark
// behind 12px type is a fail on its own no matter what the veil does.
//
// `tanh` is the shape that removes the tail without touching the texture: it is
// near-linear where the ripples live and saturates at FLOOR far below them. It is
// applied to LUMINANCE and re-applied to the three channels as a single ratio, so
// hue and saturation survive exactly — there is no tint matrix in the light path,
// and nothing can clip, because the curve never lifts a pixel above SOFT.
//
// It is deliberately gentler than the one it replaces (FLOOR 0.776 / WIDTH 0.085):
// it leaves **99.3% of the desktop frame and 96% of the phone frame byte-identical
// to his photograph**, against 91%/79% before, and the most it moves any surviving
// pixel is six levels.
//
// ── THE DARK PLATES ARE THE SAME PHOTOGRAPH AFTER DARK ──
// Not an inversion, and not a detail map: the frame's own luminance is normalised
// against its own percentiles and re-mapped into a narrow band just above the dark
// canvas (#1c1611). The COLOUR is the photograph's own — each pixel keeps its
// measured r:g:b ratio and only its brightness is replaced, with a small cooling
// applied on top, so the plate reads as this sand at dusk rather than as sand-
// coloured paint. (Until 2026-07-30 the dark path threw the pixel's colour away
// and multiplied a fixed 1.34/0.96/0.66 tint onto the target luminance, which is
// half again as saturated as the sand actually is: mean 46·33·22 for a photograph
// whose own ratios are 1.10/0.99/0.84. It read as orange, not as sand at night.)
import { mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

const root = process.cwd();
const originals = path.join(root, "private-media", "originals");
const outDir = path.join(root, "public", "images");

const SOURCES = [
  {
    name: "landscape",
    src: path.join(originals, "sand-desktop-original.png"),
    width: 1920,
    limit: 200 * 1024,
    quality: 78,
    suffix: "",
  },
  {
    name: "portrait",
    src: path.join(originals, "sand-mobile-original.png"),
    // 960 is 2× a 390px viewport's plate: `cover` at 390×844 renders this frame at
    // 471 CSS px wide, so 960 source pixels is exactly a 2×-DPR phone and most of a
    // 3× one. It was 864 while the plate was a graded, flattened thing that
    // compressed badly; his own frame at quality 66 fits more picture into fewer
    // bytes than the old one did at 864/q70 (175KB vs 154KB, for 23% more pixels).
    width: 960,
    limit: 200 * 1024,
    quality: 66,
    suffix: "-portrait",
  },
];

/**
 * THE SHADOW KNEE, in fractions of white — the only thing done to the light plate.
 *
 * FLOOR is the deepest luminance the light plate may reach, and it is the number
 * the contrast audit consumes: with the paper veil at alpha `a` over it, the
 * darkest background a glyph can land on is `a·canvas + (1−a)·FLOOR`. The shipped
 * plates land at 193/255, and at the veil's 84% that is
 * `0.84 × 247 + 0.16 × 193 = 238/255` — two levels better than the old ×1.09 plate
 * gave at a 72% veil, reached without touching the photograph's tone.
 *
 * WIDTH is how wide the bend is; FLOOR + WIDTH (`SOFT`, 207/255) is where it starts
 * to bite, and everything above that is the original pixel, byte for byte.
 * Measured on the desktop frame: 222→222, 210→210, 207→207, 200→201, 190→196,
 * 180→195, 20→195. The band that carries the visible ripple is untouched; what
 * gets spent is a tail that is 0.7% of the desktop frame and 3.9% of the phone one,
 * and that no one can see.
 */
const FLOOR = 0.765;
const WIDTH = 0.045;
const SOFT = FLOOR + WIDTH;

/**
 * THE DARK BAND. The dark canvas is #1c1611 — luminance 0.089 of white — and the
 * ink that sits on it goes down to `--subtle-foreground` (#a29a8f), which needs its
 * background to stay under 0.204 of white to clear 4.5:1. So the plate's deepest
 * trough sits just under the canvas at DARK_LO and its brightest crest at DARK_HI.
 *
 * WIDENED 2026-07-30, from 0.073…0.186 to these. Two things paid for it. The veil
 * over the type went to 80%, so where `--subtle-foreground` actually lives the
 * background is `0.80 × 22 + 0.20 × crest` — 29/255 at this DARK_HI, less than
 * three fifths of what that ink needs, where the old band's own 47 was being
 * treated as if the ink sat on it bare. And the band is what the ripple has to
 * work in: a groove can only push grains from one tone to another, so a plate
 * squeezed into 28 levels can never move a pixel further than 28, which is a large
 * part of why the stirring was invisible after dark. 40 levels is still a dim warm
 * room — the mean only moves from 35/255 to 43/255 — and it is enough for a finger
 * to leave a mark you can see.
 */
const DARK_LO = 0.062;
const DARK_HI = 0.22;
/** Crests are rarer than troughs in these frames, so a straight linear map spends
 *  most of the band on flat sand. >1 pushes the mid-tones down and lets the ridges
 *  keep the top of the range. */
const DARK_GAMMA = 1.35;
/**
 * The dark plate keeps each pixel's OWN colour: its r:g:b ratio is measured, its
 * brightness is replaced, and then this is applied — a small, symmetric cool. Sand
 * under a night sky loses a little of its red and picks up a little blue; it does
 * not become a different material. The multipliers are normalised out of the
 * luminance afterwards, so cooling changes hue only and never brightness.
 *
 * Deliberately SMALL. The first pass ran 0.94/1.00/1.16, which took the frame's
 * 243·218·186 to a near-neutral 228·218·216: the ripples still read, but the plate
 * came out charcoal grey under a #1c1611 canvas that is itself a warm brown, and a
 * cold floor under a warm page reads as two different materials. At these values
 * the plate keeps the sand's warmth and only steps back from the daylight in it.
 */
const DARK_COOL = { r: 0.98, g: 1.0, b: 1.05 };

for (const { src } of SOURCES) {
  if (existsSync(src)) continue;
  console.error(
    `grade-sand: ${path.relative(root, src)} is missing.\n` +
      "The originals are client-supplied and deliberately not in git " +
      "(.gitignore excludes private-media/). The committed WebP plates in " +
      "public/images/ are the shipped artefact; you only need the originals to " +
      "re-grade them."
  );
  process.exit(1);
}

await mkdir(outDir, { recursive: true });

/** Luminance of an sRGB byte triple, 0…1. Rec.709 weights on the encoded values —
 *  not gamma-correct, on purpose: this is a shaping curve on what the eye reads as
 *  brightness, not a WCAG measurement. The audit does that separately, on the
 *  rendered page. */
const lum = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

/** C1-continuous at SOFT (value AND slope), asymptotic to FLOOR below it, and the
 *  identity at and above SOFT. */
const tone = (v) => (v >= SOFT ? v : SOFT - WIDTH * Math.tanh((SOFT - v) / WIDTH));

async function plates({ src, width }) {
  const { data, info } = await sharp(src)
    .resize({ width, withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const n = info.width * info.height;

  // The frame's own working range, taken from percentiles rather than min/max so a
  // single speck of shell does not decide where the dark plate's floor lands.
  const hist = new Uint32Array(256);
  for (let i = 0; i < n; i++) {
    const j = i * info.channels;
    hist[Math.round(lum(data[j], data[j + 1], data[j + 2]) * 255)]++;
  }
  const pct = (q) => {
    let seen = 0;
    const want = q * n;
    for (let v = 0; v < 256; v++) {
      seen += hist[v];
      if (seen >= want) return v / 255;
    }
    return 1;
  };
  const lo = pct(0.005);
  const hi = pct(0.995);

  const light = Buffer.allocUnsafe(n * 3);
  const dark = Buffer.allocUnsafe(n * 3);
  let minLight = 1;
  let maxDark = 0;
  let sum = 0;
  let sumSq = 0;
  let untouched = 0;

  for (let i = 0; i < n; i++) {
    const j = i * info.channels;
    const k = i * 3;
    const r = data[j];
    const g = data[j + 1];
    const b = data[j + 2];
    const v = lum(r, g, b);

    // LIGHT — the photograph, with nothing but the dark tail folded up. The curve
    // is computed on luminance and applied to the three channels as a single ratio,
    // so hue and saturation survive exactly; and since the curve is the identity
    // above SOFT, most of the frame is the source file's own bytes.
    const t = tone(v);
    if (t - v < 0.002) untouched++;
    const scale = v > 0 ? t / v : 1;
    const lr = Math.min(255, Math.round(r * scale));
    const lg = Math.min(255, Math.round(g * scale));
    const lb = Math.min(255, Math.round(b * scale));
    light[k] = lr;
    light[k + 1] = lg;
    light[k + 2] = lb;
    const lv = lum(lr, lg, lb);
    if (lv < minLight) minLight = lv;
    sum += lv;
    sumSq += lv * lv;

    // DARK — the same frame re-lit. Its brightness is normalised against the
    // frame's own range so both photographs land on the same band; its COLOUR is
    // its own, cooled a little. `norm` divides the cooling back out of the
    // luminance so the target band is hit exactly whatever the pixel's hue.
    const nt = Math.min(1, Math.max(0, (v - lo) / Math.max(1e-6, hi - lo)));
    const dv = DARK_LO + (DARK_HI - DARK_LO) * nt ** DARK_GAMMA;
    const cr = r * DARK_COOL.r;
    const cg = g * DARK_COOL.g;
    const cb = b * DARK_COOL.b;
    const norm = lum(cr, cg, cb);
    const ds = norm > 0 ? dv / norm : 0;
    dark[k] = Math.min(255, Math.round(cr * ds));
    dark[k + 1] = Math.min(255, Math.round(cg * ds));
    dark[k + 2] = Math.min(255, Math.round(cb * ds));
    const dvl = lum(dark[k], dark[k + 1], dark[k + 2]);
    if (dvl > maxDark) maxDark = dvl;
  }

  const mean = sum / n;
  const sd = Math.sqrt(Math.max(0, sumSq / n - mean * mean));
  return { light, dark, info, mean, sd, minLight, maxDark, untouched, n };
}

for (const source of SOURCES) {
  const { light, dark, info, mean, sd, minLight, maxDark, untouched, n } =
    await plates(source);
  console.log(
    `  ${source.name} ${info.width}×${info.height}: light mean ${(
      mean * 100
    ).toFixed(1)}% of white, stddev ${(sd * 255).toFixed(2)}/255, ` +
      `darkest ${(minLight * 255).toFixed(0)}/255, ${(
        (100 * untouched) /
        n
      ).toFixed(1)}% of pixels untouched; dark plate brightest ${(
        maxDark * 255
      ).toFixed(0)}/255`
  );

  for (const [scheme, rgb] of [
    ["light", light],
    ["dark", dark],
  ]) {
    const file = path.join(outDir, `sand-${scheme}${source.suffix}.webp`);
    let pipeline = sharp(rgb, {
      raw: { width: info.width, height: info.height, channels: 3 },
    });
    // The dark plate compresses the frame into a fortieth of the sRGB range, which
    // turns the photograph's own sensor grain into visible banding-adjacent static
    // on a near-black canvas. Half a pixel of blur removes it, leaves every ripple,
    // and roughly halves the file.
    if (scheme === "dark") pipeline = pipeline.blur(0.6);
    await pipeline
      // Per-source (see SOURCES): a photograph's ripple edges are the first thing a
      // low-quality WebP smears, and the plate is now the page's actual floor.
      // `effort: 6` matches optimize-images.mjs.
      .webp({ quality: scheme === "dark" ? 72 : source.quality, effort: 6 })
      .toFile(file);

    const { size } = await stat(file);
    const rel = path.relative(root, file);
    if (size > source.limit) {
      console.error(
        `  ✗ ${rel} is ${(size / 1024).toFixed(0)}KB, over the ${(
          source.limit / 1024
        ).toFixed(0)}KB ceiling`
      );
      process.exitCode = 1;
    } else {
      console.log(`  ✓ ${rel} — ${(size / 1024).toFixed(0)}KB`);
    }
  }
}
