"use client";

import { useEffect, useRef } from "react";

/**
 * "sand-shimmer" — a quiet dot field where the dots near the cursor brighten,
 * grow and lean a couple of pixels toward it, then relax as it moves on.
 *
 * ── WHY THERE IS A CSS LAYER AND A CANVAS LAYER ──
 * The resting field is a CSS `radial-gradient` background (`.cursor-grid__field`
 * in globals.css) — a full-screen dot grid that costs one paint, ever. The
 * canvas on top draws ONLY the ~100 dots inside the cursor's radius. Repainting
 * two thousand dots every frame to change a hundred of them is the version this
 * replaced. The two grids share one origin: CSS centres its dot in each
 * 30px tile, so the canvas dots sit at 15 + 30k.
 *
 * Colours are sampled from the design tokens once at mount, so a palette change
 * carries over with no edit here.
 *
 * Only mounted for a fine pointer and no reduced-motion preference; see
 * hover-layer.tsx. TEMPORARY — one of the three hover variants survives.
 */

const SPACING = 30;
const DOT_ORIGIN = SPACING / 2;
/** How far the cursor's influence reaches. */
const RADIUS = 120;
const LERP = 0.12;

export function CursorGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const styles = getComputedStyle(document.documentElement);
    const warm = styles.getPropertyValue("--gold").trim() || "#e0a93f";
    const ink = styles.getPropertyValue("--foreground").trim() || "#26141f";

    let dpr = 1;
    let width = 0;
    let height = 0;
    let targetX = -9999;
    let targetY = -9999;
    let x = targetX;
    let y = targetY;
    let raf = 0;
    let disposed = false;

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const clear = () => ctx.clearRect(0, 0, width, height);

    const draw = () => {
      clear();
      if (x < 0) return;

      const first = Math.max(
        0,
        Math.floor((x - RADIUS - DOT_ORIGIN) / SPACING)
      );
      const last = Math.ceil((x + RADIUS - DOT_ORIGIN) / SPACING);
      const firstRow = Math.max(
        0,
        Math.floor((y - RADIUS - DOT_ORIGIN) / SPACING)
      );
      const lastRow = Math.ceil((y + RADIUS - DOT_ORIGIN) / SPACING);

      for (let col = first; col <= last; col += 1) {
        const dotX = DOT_ORIGIN + col * SPACING;
        if (dotX > width) break;
        for (let row = firstRow; row <= lastRow; row += 1) {
          const dotY = DOT_ORIGIN + row * SPACING;
          if (dotY > height) break;
          const dx = x - dotX;
          const dy = y - dotY;
          const distance = Math.hypot(dx, dy);
          if (distance > RADIUS) continue;

          // Eased falloff — a linear one puts a visible hard circle on the page.
          const t = 1 - distance / RADIUS;
          const strength = t * t;
          // A couple of pixels of lean toward the cursor. Enough to feel like
          // the field noticed; not enough to look like it is being pulled.
          const lean = strength * 2.5;
          const nx = distance > 0.001 ? dx / distance : 0;
          const ny = distance > 0.001 ? dy / distance : 0;

          ctx.globalAlpha = 0.05 + strength * 0.3;
          ctx.fillStyle = strength > 0.35 ? warm : ink;
          ctx.beginPath();
          ctx.arc(
            dotX + nx * lean,
            dotY + ny * lean,
            1 + strength * 1.4,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const tick = () => {
      raf = 0;
      x += (targetX - x) * LERP;
      y += (targetY - y) * LERP;
      draw();
      if (
        (Math.abs(targetX - x) > 0.4 || Math.abs(targetY - y) > 0.4) &&
        !disposed
      ) {
        raf = requestAnimationFrame(tick);
      }
    };

    const schedule = () => {
      if (!raf && !disposed) raf = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      if (x < 0) {
        // First sighting: start where the cursor is instead of gliding in from
        // off-screen.
        x = event.clientX;
        y = event.clientY;
      }
      targetX = event.clientX;
      targetY = event.clientY;
      schedule();
    };

    const onLeave = () => {
      targetX = -9999;
      x = -9999;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      clear();
    };

    const onResize = () => {
      resize();
      draw();
    };

    resize();
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
      canvas.width = 0;
      canvas.height = 0;
    };
  }, []);

  return (
    <div aria-hidden className="cursor-layer">
      <div className="cursor-grid__field" />
      <canvas ref={canvasRef} className="cursor-grid__canvas" />
    </div>
  );
}
