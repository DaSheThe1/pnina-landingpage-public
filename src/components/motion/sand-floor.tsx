"use client";

import { useEffect, useRef } from "react";

import { prefersReducedMotion } from "@/lib/eval-flags";

/**
 * THE SAND FLOOR — the real photograph, and a finger drawn through it.
 *
 * ⛔ READ THIS FIRST (2026-07-30): the finger is TURNED OFF. `RIPPLE_ENABLED`,
 * just above the component at the bottom of this file, is `false` at Daniel's
 * request — "disable it for now so we can publish a version" — so no canvas is
 * mounted, no WebGL context is created and none of the simulation below runs.
 * The static plate is the entire layer for everybody. Everything in this file is
 * kept verbatim for the rework; the rest of this comment describes how the effect
 * behaves WHEN THE FLAG IS TRUE, which today it is not.
 *
 * Daniel: "when the mouse hovers around the screen, the sand around it will be
 * moving a little bit. Same on the phone", and then: "make the hovering above the
 * sand really nice." So this is the whole hover design of the site now — the pearl
 * that used to ride on top of it was removed on 2026-07-30 — and it is built to be
 * looked at closely.
 *
 * Two layers, one group (globals.css §10):
 *   1. THE PLATE — his photograph of rippled cream sand, `position: fixed`, at the
 *      very bottom of the page, opaque and at full strength. Server-rendered, so
 *      the sand is in the first paint for everybody, and it is the entire layer for
 *      anyone this component leaves alone.
 *   2. THE STIR — a WebGL canvas over it that redraws the same photograph with the
 *      sand pushed aside wherever the pointer or a finger has just been.
 *
 * ⚠️ 0.12.1 CHANGED WHAT IS UNDER THIS CODE. Until 0.12.0 the plate was not a
 * photograph at all — it was a near-white detail map composited `multiply` at 0.45
 * opacity, and roughly six tenths of one percent of it reached the screen. Daniel:
 * "you didn't use my sand background at all with the hover animation." The plate is
 * now the frame itself, painted with no blend mode and no opacity, which means every
 * contrast argument below is about a full-strength surface rather than a whisper.
 * The full account is in globals.css §10.
 *
 * ⚠️ AND 2026-07-30 CHANGED IT AGAIN, twice over, which is why the constants below
 * moved. The plate stopped being GRADED — the ×1.09 tone lift that was clipping the
 * red channel is gone, so what this shader samples is Daniel's photograph, with
 * nearly twice the texture to push around (stddev 7.25/255 against 3.89). And the
 * effect itself was measured and found invisible: a full drag was moving pixels by a
 * peak of 18/255 in light and 8/255 in dark, which is a thing only a pixel-differ
 * can see. It is now 83 and 61 at 1440, 49 and 31 at 390. See RELIEF_FREE.
 *
 * ── WHY THERE IS A SIMULATION AND NOT A RIPPLE FORMULA ──
 * The first version of this was the obvious one: a `sin()` ring radiating from the
 * pointer, faded by distance and decayed by a scalar. It looks like a ripple in
 * water on a screen — it has no memory, so a fast movement leaves nothing behind,
 * and it pulses instead of settling. Sand does the opposite: it takes a GROOVE, the
 * groove has an edge that catches light, and it slumps back rather than bouncing.
 *
 * So the pointer does not draw a ripple; it draws into a HEIGHT FIELD, and the
 * height field is simulated:
 *
 *     v += (neighbourAverage − h) × SPREAD    the sand slumps sideways
 *     v -= h × STIFFNESS                      and back toward flat
 *     v *= DAMPING                            with a lot of viscosity, because
 *                                             sand is not water
 *     h += v
 *
 * That runs in a small off-screen texture (`SIM_MAX` on its longest edge), one step
 * per frame, ping-ponged between two framebuffers. It costs a few hundred
 * microseconds and it buys everything that makes the thing feel real: a continuous
 * trail along the path the pointer took, a soft rim of piled sand around the
 * groove, a slump that spreads outward as it fades, and a settle with no bounce.
 *
 * The draw pass then does the OTHER half of "really nice": it does not just push
 * the texture around. It takes the GRADIENT of the height field and uses it twice —
 * once to displace the sand's UV (so grains move), and once as a surface normal to
 * relight it (so the near wall of a groove darkens and the far wall catches the
 * light). Displacement alone reads as a texture sliding behind glass; the relight is
 * what makes it read as a dent in a surface.
 *
 * ── WHY THE CANVAS DRAWS THE WHOLE PLATE, NOT JUST THE DISTURBED PART ──
 * Because it is REPLACING it. The canvas is opaque and covers the viewport exactly,
 * framed by the same `cover` arithmetic (`uCoverScale`), so what the page composites
 * is one sand surface and not two — no patch edge to feather, no disc of
 * double-drawn sand wherever the mouse went, and the hand-off from the CSS plate to
 * the canvas at first paint is invisible because the two are the same pixels.
 *
 * ── WHAT IT COSTS, AND WHEN IT COSTS NOTHING ──
 * The rAF loop exists only while there is energy left in the sand. A pointer move
 * sets it to 1; every frame decays it; when it falls below the floor the field is
 * cleared to flat, one last frame is drawn, and the loop stops. At rest this is a
 * static texture and zero CPU. It also stops outright when the tab is hidden.
 *
 * ── AND WHY THERE IS NO AMBIENT DRIFT ──
 * The brief allowed an optional whisper of idle movement. It is deliberately not
 * here: a perpetual animation behind a page that a woman in distress is trying to
 * read is exactly what CLAUDE.md rule 4 rules out, and what the always-on price
 * pulse was removed for. The sand moves when she touches it and then it settles.
 * That is also the whole reason the loop is able to stop.
 *
 * ── WHO GETS NOTHING ──
 * Reduced motion (unless `?motion=force`), no WebGL, a lost context, or a texture
 * that will not load: in every case the static plate is already on screen and this
 * component simply never marks its canvas drawn. There is no degraded state, only
 * "with stirring" and "without".
 */

/** The plates written by scripts/media/grade-sand.mjs. The keys mirror the two
 *  media queries in globals.css §10 EXACTLY: if they ever disagree, a phone
 *  downloads a 1920px plate in order to show a 960px one. */
const PLATES = {
  light: {
    wide: "/images/sand-light.webp",
    portrait: "/images/sand-light-portrait.webp",
  },
  dark: {
    wide: "/images/sand-dark.webp",
    portrait: "/images/sand-dark-portrait.webp",
  },
} as const;

const PORTRAIT_QUERY = "(max-width: 640px) and (orientation: portrait)";
const DARK_QUERY = "(prefers-color-scheme: dark)";

/** Capped at 1.5 rather than the device's real ratio: this is an out-of-focus
 *  texture behind everything, and a 3× buffer on a phone is three times the fill
 *  rate for a difference nobody can see. */
const DPR_CAP = 1.5;

/** Longest edge of the height field, in texels. The field is smooth by
 *  construction — it is a slumping surface, not a picture — so it does not need
 *  pixels; 320 is about 4px of screen per texel on a laptop, and the bilinear read
 *  in the draw pass smooths the rest. */
const SIM_MAX = 320;

/** How far the fingertip reaches, in CSS px. ~120-140 is a hand's worth of sand;
 *  much more and the whole page swims. */
const BRUSH_RADIUS = 132;
/** How deep one frame of contact presses. Still low, because contact is continuous:
 *  a slow drag accumulates into a groove over several frames, which is why a slow
 *  hand leaves a deeper mark than a flick — as it should.
 *  0.09 → 0.16 on 2026-07-30, with the relief below: a review pass measured the
 *  whole effect at a peak of 18/255 on the old plates, which is under the threshold
 *  at which a person notices anything. See the note on RELIEF_FREE. */
const BRUSH_DEPTH = 0.16;

/** The three numbers that decide what the surface IS. Sand, not water: heavy
 *  damping, weak restoring force, a little sideways slump.
 *      DAMPING   ↑ → the groove lingers.      ↓ → it snaps back.
 *      STIFFNESS ↑ → it springs (water).      ↓ → it stays dented (mud).
 *      SPREAD    ↑ → the dent slumps wide.    ↓ → it stays a pinprick. */
const DAMPING = 0.9;
const STIFFNESS = 0.052;
const SPREAD = 0.2;

/**
 * How many CSS px of sand one unit of field gradient pushes aside, and how hard the
 * relight reads. The RATIO between these two is a contrast decision, not a taste
 * one, and it is the reason this effect is safe to run under paragraphs.
 *
 * DISPLACEMENT IS STILL FREE, and that is the whole reason this is safe to run
 * under paragraphs. Moving the plate's UV around resamples the same photograph, so
 * the darkest pixel that can end up behind a letter is still the plate's own floor
 * — 193/255, set by the shadow knee in scripts/media/grade-sand.mjs, and the number
 * the veil in `--background` is sized against. A groove can therefore shove the
 * grains a long way (20-30px here) without costing a contrast ratio at all, and
 * the eye reads MOVEMENT far more readily than it reads tone.
 *
 * RELIGHTING IS NOT FREE. It scales the plate, so it can push a pixel below that
 * floor, and every point of it lands directly in what the audit measures. The first
 * build ran RELIEF at 1.4 with an 8× multiplier on top: the groove came out as a
 * dithered charcoal brush-stroke darkening the page by 8-17%, in exactly the place
 * the reader's eye is. So the expensive direction stays small — see the asymmetry
 * below — and its whole job is to stop the effect reading as a texture sliding
 * behind glass. The dent is drawn by the displacement.
 *
 * Scale, so these are not magic: a slow drag builds a groove about 0.3 deep and
 * ~130px wide, which puts the gradient this pass reads at roughly 0.06-0.07.
 *
 * 560 → 820 on 2026-07-30, with the rest of this block. It is the free half of the
 * increase and it does most of the work: on the new plates, which have real
 * photographic texture to move (stddev 7.25/255 against the old graded plate's
 * 3.89), pushing the grains further is what makes the stroke read as sand rather
 * than as a shadow.
 */
const DISPLACE = 820;
/**
 * ── THE ASYMMETRY, AND WHY IT IS NOT A TRICK ──
 * Relighting is only expensive in ONE direction, and which direction depends on the
 * scheme. The page carries dark ink on the light plate, so a groove that DARKENS
 * the sand spends contrast while one that BRIGHTENS it spends nothing at all — it
 * lifts the sand's own troughs toward white, which reads as the grains being
 * smoothed flat where the finger passed. After dark the ink is pale on a dark
 * plate, so it is exactly the other way round: darkening a patch only pushes it
 * further from the type, and brightening is what costs.
 *
 * So the free side gets a generous multiplier and the expensive side a small one,
 * and `uFreeSign` (+1 light, −1 dark) is what decides which is which.
 *
 * ── AND THE TWO SCHEMES NEED DIFFERENT NUMBERS (2026-07-30) ──
 * A review pass measured the finished effect and found it below the threshold of
 * perception: a full cursor drag moved pixels by a PEAK of 18/255 in light and
 * 8/255 in dark. Daniel asked for sand that visibly moves under the pointer, and
 * only a pixel-differ could prove it was running at all.
 *
 * Relight is a MULTIPLIER, so what it is worth in levels of sRGB depends entirely
 * on how bright the thing it multiplies is. The light plate sits around 221/255, so
 * 2% of it is four and a half levels. The dark plate sits around 43/255, so the same
 * 2% is under one. That is the whole reason dark was six times weaker than light,
 * and no single pair of constants can fix both — so the pair is per-scheme now,
 * uploaded as a uniform beside `uFreeSign`. Measured on a full drag, rest versus
 * mid-stroke, peak delta over the viewport (the dark figures also needed the wider
 * band in grade-sand.mjs — a plate squeezed into 28 levels cannot move a pixel
 * further than 28 however hard you push it):
 *
 *      light 1440   18 → 83/255      dark 1440   8 → 61/255
 *      light  390    ~ → 49/255      dark  390   ~ → 31/255
 *
 * The cost side moved too, but it is still a fraction of the free side and it is
 * still the number to watch: at these values a groove darkens the light plate by at
 * most ~4%, which is eight levels of the plate and under two once the 84% paper veil
 * in `--background` is over it. Raise RELIEF_COST further and you are spending the
 * audit's margin, not the plate's.
 */
const RELIEF_FREE = { light: 4.2, dark: 13 };
const RELIEF_COST = { light: 0.55, dark: 1.5 };

/** Per-frame decay of the JS-side energy that keeps the loop alive. Slower than the
 *  field's own decay on purpose, so the loop is still running while the last of the
 *  groove settles. */
const ENERGY_DECAY = 0.955;
const ENERGY_FLOOR = 0.002;

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

/**
 * THE SIMULATION. One texel = one patch of sand. R holds height, G holds velocity,
 * both centred on 0.5 because this is an 8-bit target: at a brush depth of 0.09 a
 * single quantisation step is about 4% of one frame's press, and the field is
 * integrated over dozens of frames, so it never shows.
 *
 * The brush is applied along the SEGMENT the pointer travelled since the last
 * frame, not at its current point. At 60fps a fast flick moves 40-60px between
 * frames, and a per-point brush would leave a dotted line of craters instead of a
 * groove.
 */
const SIM_FRAG = `
precision highp float;
uniform sampler2D uPrev;
uniform vec2 uTexel;
uniform vec2 uBrushA;
uniform vec2 uBrushB;
uniform float uBrushRadius;
uniform float uBrushDepth;
varying vec2 vUv;

/** Distance from p to the segment ab, all in field UV. */
float segDist(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  float len = max(1e-6, dot(ab, ab));
  float t = clamp(dot(p - a, ab) / len, 0.0, 1.0);
  return distance(p, a + ab * t);
}

void main() {
  vec2 self = texture2D(uPrev, vUv).rg;
  float h = self.r - 0.5;
  float v = self.g - 0.5;

  // Neighbour average. Clamped rather than wrapped: the field has edges and sand
  // does not slump in from off-screen.
  float l = texture2D(uPrev, clamp(vUv - vec2(uTexel.x, 0.0), 0.0, 1.0)).r - 0.5;
  float r = texture2D(uPrev, clamp(vUv + vec2(uTexel.x, 0.0), 0.0, 1.0)).r - 0.5;
  float d = texture2D(uPrev, clamp(vUv - vec2(0.0, uTexel.y), 0.0, 1.0)).r - 0.5;
  float u = texture2D(uPrev, clamp(vUv + vec2(0.0, uTexel.y), 0.0, 1.0)).r - 0.5;
  float avg = (l + r + d + u) * 0.25;

  v += (avg - h) * ${SPREAD.toFixed(3)};
  v -= h * ${STIFFNESS.toFixed(4)};
  v *= ${DAMPING.toFixed(3)};
  h += v;
  // A fingertip can only displace so much sand: without this a pointer parked in
  // one place keeps pressing frame after frame and digs a well.
  h = clamp(h, -0.34, 0.16);

  if (uBrushDepth > 0.0) {
    float dist = segDist(vUv, uBrushA, uBrushB);
    // Cosine-shaped press: no hard edge anywhere, and a fingertip's own softness
    // at the centre rather than a cone point.
    float fall = smoothstep(uBrushRadius, 0.0, dist);
    h -= uBrushDepth * fall * fall;
  }

  gl_FragColor = vec4(h + 0.5, v + 0.5, 0.0, 1.0);
}`;

/**
 * THE DRAW. Reads the height field twice: as a displacement, and as a surface
 * normal to relight the grains with. The light comes from the upper inline-start —
 * the same direction as in every one of her reference photographs — so the far wall
 * of a groove brightens and the near wall falls into shadow.
 */
const DRAW_FRAG = `
precision highp float;
uniform sampler2D uTex;
uniform sampler2D uField;
uniform vec2 uRes;
uniform vec2 uTexel;
uniform vec2 uCoverScale;
uniform float uFreeSign;
uniform vec2 uRelief;
varying vec2 vUv;

void main() {
  // Central differences at THREE widths, averaged. A single narrow stencil turns
  // 8-bit quantisation in the field into a visible comb across the steep wall of a
  // groove — which is exactly where the displacement is largest — and a single wide
  // one rounds the rim off. Two, four and eight texels, weighted down as they widen,
  // does neither.
  vec2 a = uTexel * 2.0;
  vec2 b = uTexel * 4.0;
  vec2 cc = uTexel * 8.0;
  vec2 gradA = vec2(
    texture2D(uField, clamp(vUv + vec2(a.x, 0.0), 0.0, 1.0)).r
      - texture2D(uField, clamp(vUv - vec2(a.x, 0.0), 0.0, 1.0)).r,
    texture2D(uField, clamp(vUv + vec2(0.0, a.y), 0.0, 1.0)).r
      - texture2D(uField, clamp(vUv - vec2(0.0, a.y), 0.0, 1.0)).r
  );
  vec2 gradB = 0.5 * vec2(
    texture2D(uField, clamp(vUv + vec2(b.x, 0.0), 0.0, 1.0)).r
      - texture2D(uField, clamp(vUv - vec2(b.x, 0.0), 0.0, 1.0)).r,
    texture2D(uField, clamp(vUv + vec2(0.0, b.y), 0.0, 1.0)).r
      - texture2D(uField, clamp(vUv - vec2(0.0, b.y), 0.0, 1.0)).r
  );
  vec2 gradC = 0.25 * vec2(
    texture2D(uField, clamp(vUv + vec2(cc.x, 0.0), 0.0, 1.0)).r
      - texture2D(uField, clamp(vUv - vec2(cc.x, 0.0), 0.0, 1.0)).r,
    texture2D(uField, clamp(vUv + vec2(0.0, cc.y), 0.0, 1.0)).r
      - texture2D(uField, clamp(vUv - vec2(0.0, cc.y), 0.0, 1.0)).r
  );
  vec2 grad = (gradA + gradB + gradC) / 3.0;

  // Displace in CSS px, then convert to UV, so the effect is the same size on
  // every screen.
  vec2 offset = grad * ${DISPLACE.toFixed(1)} / uRes * vec2(1.0, 1.0);
  vec2 moved = vUv + offset;
  vec2 uv = (moved - 0.5) * uCoverScale + 0.5;
  vec3 col = texture2D(uTex, clamp(uv, 0.0, 1.0)).rgb;

  // Relight. The gradient IS the slope, so its dot product with the light direction
  // is the whole shading model this needs: the surface is nearly flat everywhere,
  // and a full normal would be arithmetic nobody could see. The light comes from
  // the upper inline-start, as it does in every one of her reference photographs.
  //
  // The two multipliers are asymmetric on purpose, and per-scheme — see RELIEF_FREE
  // above. uRelief is (free, cost) for whichever scheme is on screen.
  float slope = dot(grad, vec2(-0.72, 0.7));
  float freeSide = max(slope * uFreeSign, 0.0);
  float costSide = max(-slope * uFreeSign, 0.0);
  float lit = 1.0 + uFreeSign * (freeSide * uRelief.x - costSide * uRelief.y);
  gl_FragColor = vec4(clamp(col * lit, 0.0, 1.0), 1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function program(gl: WebGLRenderingContext, frag: string) {
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  return prog;
}

/** One RGBA8 target of the height field, plus the framebuffer that writes it. */
function target(gl: WebGLRenderingContext, w: number, h: number) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0
  );
  // Flat sand: height 0 and velocity 0, both encoded at 0.5.
  gl.clearColor(0.5, 0.5, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  return { texture, fbo, w, h };
}

/**
 * ⛔ TEMPORARY — THE POINTER RIPPLE IS DISABLED. Daniel, 2026-07-30:
 *
 *   "Also the mouse animation when hovering above the sand is currently not
 *    working. Disable it for now so we can publish a version and then we're
 *    going to work on it and edit it in a better way."
 *
 * So this is a HOLD, not a removal. Every line of the simulation, the shaders and
 * the constants above stays exactly where it is; the only change is that the
 * effect never starts. Flipping `RIPPLE_ENABLED` back to `true` is the whole of
 * what "turn it back on" means — do not delete the code below it, and do not
 * "clean up" the now-unreferenced shader constants, because they are the thing
 * being kept.
 *
 * What is still on screen: `.sand-floor__plate`, the static photograph, which was
 * always the entire layer for reduced motion, for no-WebGL and for the first
 * paint. A visitor sees the same sand; it just does not move under the pointer.
 *
 * Two things follow from the gate, and both are deliberate:
 *   • no WebGL context is ever created — no `<canvas>` in the DOM at all, so
 *     there is nothing for a driver to lose and nothing to profile;
 *   • the rAF loop is gone, which gives the main thread back to CSS. The header
 *     backdrop's transition was measured being starved by this loop; with the
 *     loop gone the FAB, the mobile menu and the FAQ disclosures animate at
 *     their authored durations again.
 */
/* Typed `boolean` rather than left to infer the literal `false`: with the literal
   type TypeScript narrows everything after the gate to `never` and reports the
   whole simulation as unreachable code, which is precisely the code this flag
   exists to preserve. */
const RIPPLE_ENABLED: boolean = false;

export function SandFloor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // ⛔ See RIPPLE_ENABLED above. Gated FIRST, before the ref is even read, so
    // that nothing below — no context, no shader, no texture fetch, no listener
    // — is created while the effect is on hold.
    if (!RIPPLE_ENABLED) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    // The accessibility panel's motion switch (and `?motion=force`) — see
    // src/lib/eval-flags.ts. With that switch on the still plate stays and
    // nothing below is created at all. The device's own reduced-motion setting
    // is deliberately not read: the ripple runs for everyone by default.
    if (prefersReducedMotion()) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    if (!gl) return;

    const simProgram = program(gl, SIM_FRAG);
    const drawProgram = program(gl, DRAW_FRAG);
    if (!simProgram || !drawProgram) return;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    for (const prog of [simProgram, drawProgram]) {
      const loc = gl.getAttribLocation(prog, "aPos");
      gl.useProgram(prog);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    }

    const sim = {
      prev: gl.getUniformLocation(simProgram, "uPrev"),
      texel: gl.getUniformLocation(simProgram, "uTexel"),
      brushA: gl.getUniformLocation(simProgram, "uBrushA"),
      brushB: gl.getUniformLocation(simProgram, "uBrushB"),
      brushRadius: gl.getUniformLocation(simProgram, "uBrushRadius"),
      brushDepth: gl.getUniformLocation(simProgram, "uBrushDepth"),
    };
    const draw = {
      tex: gl.getUniformLocation(drawProgram, "uTex"),
      field: gl.getUniformLocation(drawProgram, "uField"),
      res: gl.getUniformLocation(drawProgram, "uRes"),
      texel: gl.getUniformLocation(drawProgram, "uTexel"),
      coverScale: gl.getUniformLocation(drawProgram, "uCoverScale"),
      freeSign: gl.getUniformLocation(drawProgram, "uFreeSign"),
      relief: gl.getUniformLocation(drawProgram, "uRelief"),
    };

    const portrait = window.matchMedia(PORTRAIT_QUERY);
    const dark = window.matchMedia(DARK_QUERY);

    let sandTexture: WebGLTexture | null = null;
    let texWidth = 1;
    let texHeight = 1;
    let fields: ReturnType<typeof target>[] = [];
    let front = 0;
    let ready = false;
    let disposed = false;

    /** Pointer position in field UV (y up), and where it was last frame. */
    let px = -1;
    let py = -1;
    let lastX = -1;
    let lastY = -1;
    let pressing = false;
    let energy = 0;
    let raf = 0;

    const sizeField = () => {
      for (const f of fields) {
        gl.deleteTexture(f.texture);
        gl.deleteFramebuffer(f.fbo);
      }
      const aspect = window.innerWidth / Math.max(1, window.innerHeight);
      const w = aspect >= 1 ? SIM_MAX : Math.round(SIM_MAX * aspect);
      const h = aspect >= 1 ? Math.round(SIM_MAX / aspect) : SIM_MAX;
      fields = [
        target(gl, Math.max(8, w), Math.max(8, h)),
        target(gl, Math.max(8, w), Math.max(8, h)),
      ];
      front = 0;
    };

    const sizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      const w = Math.max(1, Math.round(window.innerWidth * dpr));
      const h = Math.max(1, Math.round(window.innerHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    /** `background-size: cover`, as a uniform: which fraction of the plate is
     *  visible. The plate and the canvas have to frame the photograph identically
     *  or the hand-off between them would show. */
    const coverScale = (): [number, number] => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scale = Math.max(vw / texWidth, vh / texHeight);
      return [vw / (scale * texWidth), vh / (scale * texHeight)];
    };

    const stepSim = () => {
      const src = fields[front];
      const dst = fields[1 - front];
      gl.useProgram(simProgram);
      gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo);
      gl.viewport(0, 0, dst.w, dst.h);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, src.texture);
      gl.uniform1i(sim.prev, 0);
      gl.uniform2f(sim.texel, 1 / src.w, 1 / src.h);
      // The brush travels from where the pointer was to where it is. Radius is in
      // field UV, taken along X so a wide window does not give an oval fingertip.
      gl.uniform2f(sim.brushA, lastX, lastY);
      gl.uniform2f(sim.brushB, px, py);
      gl.uniform1f(sim.brushRadius, BRUSH_RADIUS / Math.max(1, window.innerWidth));
      gl.uniform1f(sim.brushDepth, pressing ? BRUSH_DEPTH : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      front = 1 - front;
      lastX = px;
      lastY = py;
      pressing = false;
    };

    const paint = () => {
      const field = fields[front];
      gl.useProgram(drawProgram);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sandTexture);
      gl.uniform1i(draw.tex, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, field.texture);
      gl.uniform1i(draw.field, 1);
      gl.uniform2f(draw.res, window.innerWidth, window.innerHeight);
      gl.uniform2f(draw.texel, 1 / field.w, 1 / field.h);
      const [cx, cy] = coverScale();
      gl.uniform2f(draw.coverScale, cx, cy);
      const scheme = dark.matches ? "dark" : "light";
      gl.uniform1f(draw.freeSign, scheme === "dark" ? -1 : 1);
      gl.uniform2f(draw.relief, RELIEF_FREE[scheme], RELIEF_COST[scheme]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const tick = () => {
      raf = 0;
      if (disposed || !ready) return;
      stepSim();
      paint();
      energy *= ENERGY_DECAY;
      if (energy < ENERGY_FLOOR) {
        // Settle for real rather than freezing a faint groove: flatten the field
        // and draw the undisturbed sand one last time.
        for (const f of fields) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, f.fbo);
          gl.viewport(0, 0, f.w, f.h);
          gl.clearColor(0.5, 0.5, 0, 1);
          gl.clear(gl.COLOR_BUFFER_BIT);
        }
        paint();
        energy = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const schedule = () => {
      if (!raf && !disposed && ready && !document.hidden) {
        raf = requestAnimationFrame(tick);
      }
    };

    const stir = (clientX: number, clientY: number) => {
      const nx = clientX / Math.max(1, window.innerWidth);
      // The field's Y runs up, the pointer's runs down.
      const ny = 1 - clientY / Math.max(1, window.innerHeight);
      if (px < 0) {
        // First contact: no segment yet, or the brush would carve a line in from
        // the corner of the window.
        lastX = nx;
        lastY = ny;
      }
      px = nx;
      py = ny;
      pressing = true;
      energy = 1;
      schedule();
    };

    const onPointerMove = (event: PointerEvent) => {
      stir(event.clientX, event.clientY);
    };

    /** Touch gets its own listener rather than relying on pointer events: a browser
     *  sends `pointercancel` the moment it decides a touch is a scroll, and Daniel
     *  asked for the sand to move under a finger — including one that is scrolling,
     *  which is when `touchmove` is the only event still arriving. */
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) stir(touch.clientX, touch.clientY);
    };

    const onTouchEnd = () => {
      // Lifting the finger ends the stroke; the next one starts a fresh groove
      // rather than being joined to the last place it was touched.
      px = -1;
      py = -1;
    };

    const loadTexture = () => {
      const scheme = dark.matches ? "dark" : "light";
      const src = PLATES[scheme][portrait.matches ? "portrait" : "wide"];
      const image = new Image();
      image.decoding = "async";
      image.src = src;
      image.onload = () => {
        if (disposed) return;
        if (!sandTexture) sandTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, sandTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        texWidth = image.naturalWidth || 1;
        texHeight = image.naturalHeight || 1;
        sizeCanvas();
        if (!fields.length) sizeField();
        ready = true;
        paint();
        // Only now does the canvas become visible; until this point the CSS plate
        // has been the whole layer. See `.sand-floor__canvas` in §10.
        canvas.setAttribute("data-drawn", "");
      };
      // No error handler beyond this: a plate that will not load leaves the canvas
      // invisible and the CSS background does the entire job.
    };

    const onResize = () => {
      if (!ready) return;
      sizeCanvas();
      sizeField();
      px = -1;
      py = -1;
      paint();
    };

    const onSchemeOrOrientation = () => {
      ready = false;
      canvas.removeAttribute("data-drawn");
      loadTexture();
    };

    const onVisibility = () => {
      if (document.hidden && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      ready = false;
      canvas.removeAttribute("data-drawn");
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    loadTexture();

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("webglcontextlost", onContextLost);
    portrait.addEventListener("change", onSchemeOrOrientation);
    dark.addEventListener("change", onSchemeOrOrientation);

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      portrait.removeEventListener("change", onSchemeOrOrientation);
      dark.removeEventListener("change", onSchemeOrOrientation);
      for (const f of fields) {
        gl.deleteTexture(f.texture);
        gl.deleteFramebuffer(f.fbo);
      }
      if (sandTexture) gl.deleteTexture(sandTexture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(simProgram);
      gl.deleteProgram(drawProgram);
    };
  }, []);

  return (
    <div aria-hidden className="sand-floor">
      <div className="sand-floor__plate" />
      {/* ⛔ Not rendered while RIPPLE_ENABLED is false — an empty <canvas> in the
          tree would still make a compositing layer on every route for a surface
          nothing is drawing to. The plate above is the whole layer. */}
      {RIPPLE_ENABLED ? (
        <canvas ref={canvasRef} className="sand-floor__canvas" />
      ) : null}
    </div>
  );
}
