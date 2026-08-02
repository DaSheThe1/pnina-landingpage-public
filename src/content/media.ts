/**
 * Every image and video slot on the site, in one place.
 *
 * Some of it has arrived and some of it has not, so a slot with nothing behind
 * it yet is `src: null` and its component renders a designed placeholder instead
 * of a broken image. That is the whole point of this file: the site is
 * presentable at every stage, and "what are we still waiting on?" is answered by
 * reading one file rather than grepping components.
 *
 * To add real media: drop the file under `public/` (see docs/05-content-guide.md
 * for naming), set `src` to its path, and write real Hebrew `alt` text. The
 * placeholder disappears on its own.
 *
 * Videos ARE listed here too, at the bottom: `videos` holds each clip's local
 * path and its filename in the R2 bucket, and `videoSrc()` resolves which of the
 * two a build should use. See docs/06-media-and-cdn.md.
 */
import { publicEnv } from "@/lib/env";
import { imageVariants } from "@/lib/image-manifest.generated";
export type ImageSlot = {
  /** Path under `public/` once supplied; `null` while we are still waiting. */
  src: string | null;
  /**
   * Hebrew alt text. Required even for placeholders — it is what a screen
   * reader announces, and this audience includes people who rely on one.
   */
  alt: string;
  /** What we asked the client for. Kept so nobody has to reconstruct intent. */
  note: string;
  width?: number;
  height?: number;
  /**
   * How a component that draws this slot at a FIXED SQUARE size should fit it.
   *
   * Only `logo` reads this today (`BrandMark`), and it exists so that swapping a
   * photograph for a transparent cutout stays a content change:
   *
   *   "circle"  (default) — a circular crop with a hairline ring. Right for a
   *             photograph, whose frame is rectangular and whose edge would
   *             otherwise dissolve into the header.
   *   "contain" — the whole image, uncropped, unrounded, no ring. Right for a
   *             transparent cutout or a line mark, where the artwork already
   *             carries its own silhouette and a crop would clip it.
   */
  shape?: "circle" | "contain";
};

/** Single portraits/marks used in fixed positions. */
export const media: Record<
  | "logo"
  | "founderTeaser"
  | "aboutPortrait"
  | "lecturesPortrait"
  | "trackShell"
  | "trackPearl",
  ImageSlot
> = {
  /**
   * The mark beside her name in the header and the footer.
   *
   * This is the same profile photo as `aboutPortrait` and for the same reason
   * it works there: it is only ever drawn at 28-32px, far below the point where
   * the low-resolution source shows. Falls back to the monogram badge if it is
   * ever removed, which is also fine to ship — plenty of practices have no logo.
   *
   * ── THE GEOMETRIC MARK IS STILL THE MARK ──
   * `public/brand/pearl-mark.svg` (an open scallop holding a pearl, v0.8.0) is
   * the brand mark and is not going anywhere: it drives the favicon
   * (`src/app/icon.png` via `scripts/brand/generate-icon.mjs`) and the OG share
   * card, both of which read that SVG file DIRECTLY and never touch this slot.
   * It was DRAWN for that job — a handful of strokes that still read at 28px,
   * where any photograph turns to mush. Nothing below changes it.
   *
   * ── THE PHOTOGRAPHIC SHELL, WHEN IT LANDS ──
   * Pnina asked for the shell and the pearl from her own background photograph
   * (`private-media/originals/pnina-sunset-original.png`) to become the lockup
   * mark. That needs a clean transparent cutout, and it is being produced
   * externally: a cream shell on cream sand does not segment automatically, and
   * the attempts (GrabCut, OpenCV) came out worse than what is here now.
   *
   * When the file arrives it goes to `public/brand/pearl-shell.png` and this
   * slot becomes:
   *
   *     src:   "/brand/pearl-shell.png"
   *     shape: "contain"
   *
   * and nothing else on the site changes. `shape` is why: `BrandMark` reads it
   * and picks between the circular photo crop (default) and an uncropped,
   * unringed fit. A cutout under the circle treatment would clip the dish and
   * draw a hairline ring around transparent air, which is exactly what used to
   * make this a component change rather than a content one.
   *
   * Until then the header keeps her face, which is honestly not a bad look for
   * a personal practice. It only ever draws at 28-32px, far below the point
   * where the low-resolution source shows.
   */
  logo: {
    src: "/images/pnina-portrait.jpg",
    alt: "פנינה פאף",
    shape: "circle",
    note: "תמונת הפנים שלה, בחיתוך עגול. פנינה ביקשה במפורש (2026-08-02) שבראש האתר יופיעו הפנים שלה ולא הצדפה. הצדפה והפנינה הגזורות (public/brand/pearl-shell.png) הן אייקון האתר בלשונית הדפדפן, ואפשר לשלב אותן במקום אחר בעמוד, רק לא כאן.",
    width: 320,
    height: 320,
  },
  /**
   * Portrait on the homepage founder section. Real photo, roughly 2:3 portrait.
   */
  founderTeaser: {
    src: "/images/pnina-about.jpg",
    alt: "פנינה פאף",
    note: "תמונה מלאה שלה. אפשר להחליף בכל תמונה אחרת ביחס דומה (לגובה).",
    width: 854,
    height: 1332,
  },
  /**
   * Avatar-sized crop used at the top of /about, beside the story.
   *
   * ⚠️ This one is her Instagram profile picture: the ORIGINAL is 150×150 px and
   * the file is a 320px upscale. It only holds up inside the round avatar frame
   * (~10rem). Do not put it in a large rectangular panel.
   */
  aboutPortrait: {
    src: "/images/pnina-portrait.jpg",
    alt: "פנינה פאף",
    note: "תמונת פרופיל בלבד (150px במקור). מתאימה רק לעיגול קטן.",
    width: 320,
    height: 320,
  },
  /** Portrait on /lectures, ideally her actually speaking. */
  lecturesPortrait: {
    src: null,
    alt: "תמונה מהרצאה",
    note: "תמונה מהרצאה מול קהל — זו התמונה שמוכרת הרצאות. יחס 4:3.",
  },

  /* ── The two offer-track figures (OffersSection, added 2026-07-29) ──
     One image at the head of each track column, carrying the section's own
     picture: "מהצדפה אל הפנינה". They are a MATCHED PAIR — same crop, same
     lighting, same background — because the two columns are deliberately equals
     and one photographed object next to one illustration would silently rank
     them.

     DELIVERED 2026-07-29. Daniel generated both, approved both, and they are a
     true pair: the same warm brown backdrop, the same low side light, the same
     square crop and the same distance — a closed scallop for צדפה, the same
     shell opened around a pearl for פנינה. Full-resolution masters (2048², PNG)
     are archived in `private-media/originals/track-{shell,pearl}-original.png`,
     which is gitignored and never mirrored; what ships is the 880² JPEG below
     plus the WebP ladder the optimiser derives from it.

     ── WHY .jpg AND NOT THE .webp THIS COMMENT USED TO PROMISE ──
     `scripts/optimize-images.mjs` only takes PNG/JPEG sources: it turns each one
     into a ladder of WebP widths under `public/images/optimized/` and records
     them in the manifest that `src/lib/image-loader.ts` reads. Dropping a
     hand-made `.webp` in here would have skipped that entirely and shipped one
     880px file to every phone. As `.jpg` the loader serves a 5-9KB WebP at the
     size actually drawn. Same convention as every other still on this site.
     `public/images/` and not the R2 bucket: the bucket carries the video and the
     scroll-sequence frames (docs/06, docs/13), while every still on the site is
     a bundled, build-optimised asset. Re-run `pnpm optimize:images` after
     replacing either file (`prebuild` does it too).

     Geometry: SQUARE, drawn at ~176px. 880² gives the ladder room without
     putting a heavy master in the repo. */
  trackShell: {
    src: "/images/track-shell.jpg",
    alt: "צדפה סגורה על רקע חום חם",
    note: "מסלול צדפה. הועבר ב-2026-07-29, המקור המלא ב-private-media/originals/track-shell-original.png. זוג תואם עם trackPearl: אותו קרופ, אותה תאורה, אותו רקע.",
  },
  trackPearl: {
    src: "/images/track-pearl.jpg",
    alt: "צדפה פתוחה ובתוכה פנינה",
    note: "מסלול פנינה. הועבר ב-2026-07-29, המקור המלא ב-private-media/originals/track-pearl-original.png. זוג תואם עם trackShell: אותו קרופ, אותה תאורה, אותו רקע.",
  },
};

/**
 * The two videos, when they are served from `public/` rather than the CDN.
 *
 * `null` means no video exists yet, and the components render their branded
 * poster panel INSTEAD of a <video> element. That matters: pointing a <video>
 * at a file that does not exist makes every visitor's browser issue a failing
 * request on every page load, which is both wasteful and noisy in the console.
 *
 * Production normally leaves these null and sets NEXT_PUBLIC_HERO_VIDEO_URL /
 * NEXT_PUBLIC_THANK_YOU_VIDEO_URL to the Cloudflare R2 URLs instead — see
 * docs/06-media-and-cdn.md. Use these slots for a local file during dev.
 */
/**
 * All three clips are vertical 9:16 phone recordings with burnt-in Hebrew
 * captions, which is why every video frame on this site is portrait rather than
 * the 16:9 the scaffold assumed. Keep that in mind before swapping one out:
 * a landscape replacement will letterbox inside a portrait frame.
 *
 * `hero` is muted and autoplays (browsers block autoplay with sound), so its
 * captions carry the message. `about` is a spoken piece and keeps its audio, so
 * it stays click-to-play.
 */
export type VideoKey = "hero" | "thankYou" | "about";

export const videos: Record<
  VideoKey,
  {
    /** Local file under `public/`, used in dev and as the last fallback. */
    src: string | null;
    /**
     * Filename inside the R2 media bucket. Resolved against
     * NEXT_PUBLIC_MEDIA_BASE_URL by `videoSrc()` below, so production needs one
     * env var rather than one per clip. Swapping a clip = editing this string.
     */
    remote?: string;
    poster?: string;
    /**
     * WebVTT caption file under `public/`, or `null` while none exists.
     *
     * `null` mounts no `<track>` at all — same rule as `src`, because a track
     * pointing at a missing file makes every browser fetch and fail on load.
     * A clip whose captions are burnt into the picture keeps `null` forever;
     * that is what `captionsNote` records, so nobody has to re-derive why.
     */
    captions: string | null;
    captionsNote: string;
    note: string;
  }
> = {
  hero: {
    src: "/video/pnina-hero.mp4",
    remote: "first-video.mp4",
    poster: "/images/poster-hero.jpg",
    captions: null,
    captionsNote:
      "לא נדרש: הכתוביות בעברית צרובות בתוך הווידאו עצמו (הסרטון מושתק בהפעלה אוטומטית, ולכן הן נושאות את המסר).",
    note: "סרטון לראש הדף. אילם (מושתק) כי דפדפנים חוסמים הפעלה אוטומטית עם קול.",
  },
  thankYou: {
    // Same clip as the hero for now, per Daniel. Replace with a dedicated
    // "thank you for reaching out" recording when she films one.
    src: "/video/pnina-hero.mp4",
    remote: "first-video.mp4",
    poster: "/images/poster-hero.jpg",
    captions: null,
    captionsNote: "לא נדרש כרגע — אותו קובץ של ראש הדף, עם כתוביות צרובות.",
    note: "כרגע אותו סרטון של ראש הדף. כדאי סרטון ייעודי קצר לדף התודה.",
  },
  about: {
    src: "/video/pnina-about.mp4",
    remote: "aboutpage.mp4",
    poster: "/images/poster-about.jpg",
    // ⚠️ OPEN ITEM. This is the one clip that genuinely needs a caption file:
    // 2 min 11 s of speech with nothing burnt in, so a Deaf or hard-of-hearing
    // visitor gets nothing from it today. Waiting on the Hebrew transcript from
    // Pnina — docs/12 §C. Once it lands, save it as `/video/pnina-about.vtt`
    // and set this to that path; the player picks it up with no other change.
    captions: null,
    captionsNote:
      "⚠️ חסר. הסרטון מדובר ואין בו כתוביות צרובות — נדרש תמלול בעברית (VTT) לנגישות. ממתינים לתמלול מפנינה.",
    note: "הסרטון הארוך לעמוד עליי. עם קול, ולכן בהפעלה בלחיצה ולא אוטומטית.",
  },
};

/** Per-video env overrides, for the case where one clip must come from a
 *  different origin than the bucket. Normally all three are unset. */
const VIDEO_URL_OVERRIDES: Record<VideoKey, string | undefined> = {
  hero: publicEnv.heroVideoUrl,
  thankYou: publicEnv.thankYouVideoUrl,
  about: publicEnv.aboutVideoUrl,
};

/**
 * Where a given video actually loads from, in priority order:
 *
 *   1. its NEXT_PUBLIC_*_VIDEO_URL override, if set;
 *   2. NEXT_PUBLIC_MEDIA_BASE_URL + its `remote` filename (the production path);
 *   3. the bundled /public file (dev);
 *   4. `null` — the component renders its poster panel and mounts no <video>.
 *
 * Call this instead of reading `videos[key].src`: a component that reads the
 * local path directly silently ships a 20 MB MP4 from the site origin.
 */
export function videoSrc(key: VideoKey): string | null {
  const override = VIDEO_URL_OVERRIDES[key];
  if (override) return override;

  const video = videos[key];
  const base = publicEnv.mediaBaseUrl;
  if (base && video.remote) {
    // Manual join, not `new URL(remote, base)`: the URL constructor treats a
    // base with a path ("https://host/pnina-website") as a FILE and replaces the
    // last segment, which would drop the bucket path from every video URL.
    return `${base.replace(/\/+$/, "")}/${video.remote}`;
  }
  return video.src;
}

/**
 * The WebP a video's poster should actually load, rather than the JPEG the
 * registry names.
 *
 * A `<video poster="…">` is a plain HTML attribute: it never touches
 * `next/image`, so the custom loader in `src/lib/image-loader.ts` cannot reach
 * it and the poster was the one image on the homepage still shipping as a raw
 * JPEG — while being the LCP element of the hero. This resolves the registered
 * path against the generated ladder and returns its top rung.
 *
 * Top rung, not a small one, because there is no `srcSet` here: one URL serves
 * every screen. The full-resolution WebP is still smaller than the JPEG it
 * replaces (poster-hero: 33.7 KB → 20.7 KB).
 *
 * Falls back to the registered path when the image has no variants, so a poster
 * added without running `pnpm optimize:images` still renders.
 */
export function posterSrc(key: VideoKey): string | undefined {
  const poster = videos[key].poster;
  if (!poster) return undefined;

  const widths = imageVariants[poster];
  if (!widths || widths.length === 0) return poster;

  const stem = poster.replace(/^\/images\//, "").replace(/\.[^.]+$/, "");
  return `/images/optimized/${stem}-${widths[widths.length - 1]}.webp`;
}

/**
 * Optional photo gallery. Empty = the gallery section removes itself from the
 * page entirely (it does not render an empty shell). Only add photos here that
 * Pnina has explicitly cleared for publication.
 */
export const gallery: ImageSlot[] = [];

/**
 * Testimonial screenshots (WhatsApp/Instagram messages Pnina received).
 *
 * ⚠️ Read `docs/04-testimonials-policy.md` before adding ANY of these.
 * Screenshots of private messages are the highest-risk content on this site:
 * every one must be cropped so no phone number, profile photo, full name or
 * handle survives, and must be published only with that person's consent.
 *
 * REDACTION STATUS — all three are cleared as of v0.6.0 (2026-07-29).
 * The blurs are applied by `scripts/media/redact-testimonials.mjs`, which reads
 * the pristine copies from `private-media/originals/` (never mirrored) and
 * writes the published files. That script — not a hand edit — is the record of
 * what was removed and why; re-run it after replacing any original.
 *
 *   review-1  three copies of the SENDER's WhatsApp profile photo, beside her
 *             voice notes. Blurred. Not Pnina's own photo.
 *   review-2  the reel-attribution sliver along the top edge, which carried a
 *             third-party account name. Blurred.
 *   review-3  the Instagram handle under the yellow banner. This one shipped
 *             LEGIBLE in the first public release; it is now destroyed at the
 *             source (a contrast stretch recovers nothing).
 *
 * The message text in all three is untouched and stays fully legible — that
 * text is the entire reason the screenshot is here.
 *
 * Before adding a fourth: read docs/04-testimonials-policy.md, put the original
 * in private-media/originals/, and add its regions to the redaction script.
 */
export const testimonialShots: ImageSlot[] = [
  {
    src: "/images/review-1.jpg",
    alt: "צילום מסך של הודעת וואטסאפ: ״רק להגיד לך שאת חזקה, מהממת ומרגשת ומייצגת כל כך הרבה נשים. תודה.״",
    note: "הודעת וואטסאפ. מפורסם באישור. תמונת הפרופיל של השולחת מטושטשת.",
    width: 830,
    height: 1222,
  },
  {
    src: "/images/review-2.jpg",
    alt: "צילום מסך של הודעה באינסטגרם: ״תודה ששלחת לי, הגיע לי בול בזמן.״",
    note: "הודעה באינסטגרם. מפורסם באישור. שם החשבון בפס העליון מטושטש.",
    width: 784,
    height: 1226,
  },
  {
    src: "/images/review-3.jpg",
    alt: "צילום מסך של הודעה באינסטגרם: ״לראות אותך נותן לי תקווה, לדעת שאפשר אחרת.״",
    note: "הודעה באינסטגרם. מפורסם באישור. שם המשתמש בצילום טושטש.",
    width: 824,
    height: 1216,
  },
];

/** True when a slot has real media behind it. */
export function hasMedia(slot: ImageSlot): slot is ImageSlot & { src: string } {
  return typeof slot.src === "string" && slot.src.length > 0;
}

/**
 * ── THE SCROLL-SEQUENCE FRAMES ARE NOT REGISTERED HERE ──
 *
 * The "pearl reveal" frames (the process animation) and the "האור עולה" frames
 * on /lectures live ONLY on the media CDN: ninety WebP frames per orientation
 * per sequence is far too heavy for this repo or the public mirror, and unlike
 * every slot above they are not a thing the client owes us one of — they are a
 * generated sequence with a fixed naming convention.
 *
 * So their single definition is `src/components/motion/sequence-source.ts`:
 * the bucket layout (`motion/<collection>/{m,d}/f_001.webp …`, docs/13 §5), how
 * many frames were exported, and the loader every consumer probes with. A
 * second `motionFrameBase()` helper briefly lived here, which is how the
 * process scrub and `ScrollSequence` ended up asking the same prefix for
 * different files; it is gone on purpose. Ask `useSequenceSource()`.
 */
