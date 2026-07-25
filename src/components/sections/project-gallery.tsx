"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowUpRight, ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";

import { SectionHeading } from "@/components/sections/marketing-sections";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { galleryImages, hasGallery, type GalleryImage } from "@/content/gallery";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

// Slide width as a % of the carousel frame. The centred slide fills this width
// at full size; the two neighbours sit in equally-wide slots but are scaled
// down (SIDE_SCALE) AND nudged inward toward the centre (SIDE_SHIFT, a % of a
// slot's width) so they sit close to the main image rather than way out at the
// edges. The leftover edge gutters are where the arrows float on the
// background. With SLIDE_W=40 / SIDE_SCALE=0.5 / SIDE_SHIFT=17.5 the sides land
// at roughly 7–27% and 73–93% of the frame: ~3% gap to the centre, ~7% gutter.
const SLIDE_W = 40;
const SIDE_SCALE = 0.5;
const SIDE_SHIFT = 17.5;

// Mirrored clones on each end so the centred slide always has real neighbours
// and the loop is seamless in both directions.
const CLONES = 3;

/**
 * Auto-advancing, infinitely-looping **centre-mode** carousel (coverflow). One
 * slide sits enlarged in the middle while its neighbours peek in scaled-down on
 * each side; every step slides the track over by one and the new centre grows
 * as the old one shrinks. The user can also step with the on-screen arrows.
 * `CLONES` copies are mirrored onto both ends and, whenever the centre lands in
 * a clone zone, the track silently snaps to the matching real slide (no
 * animation) so the loop never visibly rewinds. Pauses on hover/focus and while
 * the lightbox is open; clicking a tile opens it full-size. Shared by the
 * /examples gallery and the home-page teaser.
 */
export function GalleryCarousel({
  images,
  intervalMs = 2600,
  /** Tailwind aspect class for a slide. Portrait sets (phone screenshots) need
   *  their own ratio; the default suits landscape photos. */
  aspectClass = "aspect-[4/3]",
  /** `contain` letterboxes instead of cropping — required for screenshots,
   *  where cropping can cut the sentence that is the whole point of the
   *  image. */
  fit = "cover",
  /** The caption strip that slides up on hover. Off for screenshots, whose alt
   *  text is a transcription and would cover the message itself. */
  showCaption = true,
  /** How far the two neighbouring slides shrink. Portrait sets need a larger
   *  value than landscape ones or the neighbours become unreadable slivers. */
  sideScale = SIDE_SCALE,
}: {
  images: GalleryImage[];
  intervalMs?: number;
  aspectClass?: string;
  fit?: "cover" | "contain";
  showCaption?: boolean;
  sideScale?: number;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  // `index` is the position of the *centred* slide within the cloned `slides`
  // array. The real images occupy [CLONES, CLONES + images.length - 1].
  const [index, setIndex] = useState(CLONES);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  // Bumped on every manual arrow press so the auto-advance timer restarts.
  const [kick, setKick] = useState(0);
  // Below md we drop the 3-up coverflow for one big swipeable image.
  const [mobile, setMobile] = useState(false);
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const swipedRef = useRef(false);

  const n = images.length;
  const loops = n > 1;

  useEffect(() => {
    const calc = () => setMobile(window.innerWidth < 768);
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const slides = loops
    ? [...images.slice(n - CLONES), ...images, ...images.slice(0, CLONES)]
    : images;

  // On mobile a single near-full-width slide (with a sliver of each neighbour
  // peeking to hint the swipe); on desktop the coverflow slot width.
  const slideW = mobile ? 88 : SLIDE_W;

  // Centre slide `index`: shift the track so that slide's midpoint hits the
  // container midpoint (50%). translateX is a % of the track, whose width is
  // 100% of the container, so the % value maps straight to container space.
  const translatePct = loops ? 50 - (index * slideW + slideW / 2) : 0;

  const step = useCallback(
    (dir: number) => {
      if (!loops) return;
      setAnimate(true);
      setIndex((i) => i + dir);
    },
    [loops]
  );

  // Auto-advance, unless paused or the lightbox is open. `kick` restarts it
  // after a manual press so the next auto-step is a full interval away.
  useEffect(() => {
    if (paused || openIdx !== null || !loops) return;
    const id = window.setInterval(() => step(1), intervalMs);
    return () => window.clearInterval(id);
  }, [paused, openIdx, loops, intervalMs, step, kick]);

  // Re-enable the transition on the frame after an un-animated snap.
  useEffect(() => {
    if (animate) return;
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setAnimate(true))
    );
    return () => cancelAnimationFrame(id);
  }, [animate]);

  // When the centre settles in a clone zone, jump (no animation) to its twin.
  const handleTransitionEnd = () => {
    if (!loops) return;
    if (index >= n + CLONES) {
      setAnimate(false);
      setIndex(index - n);
    } else if (index < CLONES) {
      setAnimate(false);
      setIndex(index + n);
    }
  };

  const onArrow = (dir: number) => {
    step(dir);
    setKick((k) => k + 1);
  };

  const navigate = useCallback(
    (dir: number) =>
      setOpenIdx((i) => (i === null ? i : (i + dir + n) % n)),
    [n]
  );

  return (
    <>
      <div
        className="relative mt-14"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        onTouchStart={(e) => {
          const t = e.touches[0];
          touchRef.current = { x: t.clientX, y: t.clientY };
          swipedRef.current = false;
          setPaused(true);
        }}
        onTouchEnd={(e) => {
          const start = touchRef.current;
          touchRef.current = null;
          setPaused(false);
          if (!start) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - start.x;
          const dy = t.clientY - start.y;
          // Horizontal swipe past the threshold steps one image; flag it so the
          // tap-to-open handler doesn't also fire on release.
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
            swipedRef.current = true;
            onArrow(dx < 0 ? 1 : -1);
          }
        }}
      >
        {/* dir=ltr on the clipping container so the track is anchored to the
            left and overflows rightward — otherwise the surrounding RTL layout
            right-anchors it and translateX() pushes every tile off-screen. */}
        <div dir="ltr" className="overflow-hidden">
          <div
            className="flex"
            style={{
              width: "100%",
              transform: `translateX(${translatePct}%)`,
              transition: animate
                ? "transform 600ms cubic-bezier(0.4, 0, 0.2, 1)"
                : "none",
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {slides.map((image, i) => {
              const isCentre = loops ? i === index : false;
              // Left neighbours nudge right (+), right neighbours nudge left (−),
              // so both pull in toward the centred image.
              const sideDir = i < index ? 1 : -1;
              const transform =
                isCentre || !loops || mobile
                  ? "translateX(0) scale(1)"
                  : `translateX(${sideDir * SIDE_SHIFT}%) scale(${sideScale})`;
              return (
                <div
                  key={`${image.src}-${i}`}
                  style={{ flex: `0 0 ${loops ? slideW : 100}%` }}
                  className="px-1.5 sm:px-2.5"
                >
                  <div
                    aria-hidden={loops && !isCentre}
                    style={{
                      transform,
                      transition:
                        "transform 600ms cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    <button
                      type="button"
                      tabIndex={loops && !isCentre ? -1 : 0}
                      onClick={() => {
                        if (swipedRef.current) {
                          swipedRef.current = false;
                          return;
                        }
                        setOpenIdx(images.indexOf(image));
                      }}
                      aria-label={image.alt}
                      className={cn(
                        "group relative block w-full cursor-zoom-in overflow-hidden rounded-2xl border bg-surface-1 transition-shadow duration-500",
                        aspectClass,
                        isCentre || !loops
                          ? "border-brand/30 shadow-[0_30px_70px_-30px_rgba(194,74,133,0.55)]"
                          : "border-foreground/[0.08] shadow-card"
                      )}
                    >
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        sizes="(min-width: 768px) 40vw, 88vw"
                        className={cn(
                          "transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]",
                          fit === "contain" ? "object-contain" : "object-cover"
                        )}
                      />
                      {showCaption ? (
                        <div
                          aria-hidden
                          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        />
                      ) : null}
                      <span
                        aria-hidden
                        className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white opacity-0 backdrop-blur transition-all duration-300 group-hover:opacity-100"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </span>
                      {showCaption ? (
                        <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-4 text-start text-sm font-medium leading-snug text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                          {image.alt}
                        </span>
                      ) : null}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {loops ? (
          <>
            <button
              type="button"
              onClick={() => onArrow(1)}
              aria-label="הבא"
              className="absolute right-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur transition-colors hover:border-brand/40 hover:bg-black/70 md:inline-flex md:right-4"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => onArrow(-1)}
              aria-label="הקודם"
              className="absolute left-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur transition-colors hover:border-brand/40 hover:bg-black/70 md:inline-flex md:left-4"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          </>
        ) : null}
      </div>

      {/* Mobile controls live below the image (the side arrows are hidden); the
          image itself is also swipeable. */}
      {loops ? (
        <div className="mt-6 flex items-center justify-center gap-5 md:hidden">
          <button
            type="button"
            onClick={() => onArrow(1)}
            aria-label="הבא"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-foreground/15 bg-foreground/[0.04] text-foreground transition-colors hover:border-brand/40 hover:bg-foreground/10"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => onArrow(-1)}
            aria-label="הקודם"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-foreground/15 bg-foreground/[0.04] text-foreground transition-colors hover:border-brand/40 hover:bg-foreground/10"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        </div>
      ) : null}

      {openIdx !== null ? (
        <GalleryLightbox
          images={images}
          index={openIdx}
          onClose={() => setOpenIdx(null)}
          onNavigate={navigate}
        />
      ) : null}
    </>
  );
}

/**
 * Full-screen image viewer. Backdrop click or Esc closes; ← / → (and the on-
 * screen arrows) step through the set; the close control sits top-start.
 *
 * Shared with the testimonials wall — the review screenshots are unreadable at
 * card size, so tapping one has to open it full-size.
 */
export function GalleryLightbox({
  images,
  index,
  onClose,
  onNavigate,
}: {
  images: GalleryImage[];
  index: number;
  onClose: () => void;
  onNavigate: (dir: number) => void;
}) {
  const t = useTranslations("common");
  const image = images[index];
  const many = images.length > 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate(1);
      if (e.key === "ArrowLeft") onNavigate(-1);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, onNavigate]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.alt}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200 sm:p-8"
    >
      {/* Close — top-start (top-left in this RTL layout) */}
      <button
        type="button"
        onClick={onClose}
        aria-label={t("close")}
        className="absolute left-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      {many ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(-1);
            }}
            aria-label={t("previous")}
            className="absolute left-4 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(1);
            }}
            aria-label={t("next")}
            className="absolute right-4 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      ) : null}

      {/* Image — clicks here don't close the viewer */}
      <figure
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-full max-w-5xl flex-col items-center animate-in zoom-in-95 duration-200"
      >
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes="90vw"
          style={{ width: "auto", height: "auto" }}
          className="max-h-[82vh] max-w-full rounded-xl object-contain shadow-2xl"
        />
        <figcaption className="mt-4 max-w-2xl text-center text-sm text-white/80">
          {image.alt}
        </figcaption>
      </figure>
    </div>
  );
}

/**
 * Optional photo gallery on the landing page.
 *
 * Renders nothing at all until real photos exist in `src/content/media.ts` —
 * an empty carousel shell would look broken, and this site has to be
 * presentable at every stage of the client handover.
 */
export function GalleryTeaser() {
  const t = useTranslations("homeGallery");

  if (!hasGallery) return null;

  return (
    <section className="bg-background px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow={t("eyebrow")}
            title={t("title")}
            description={t("description")}
          />
        </Reveal>
        <GalleryCarousel images={galleryImages} />
        <Reveal>
          <div className="mt-12 flex justify-center">
            <Link
              href="/#gallery"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-11 rounded-lg px-5 text-[15px]"
              )}
            >
              {t("cta")}
              <ArrowUpRight data-icon="inline-end" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
