/**
 * Every image and video slot on the site, in one place.
 *
 * Pnina has not sent photos or video yet, so each slot below is `src: null` and
 * the components render a designed placeholder instead of a broken image. That
 * is the whole point of this file: the site is presentable at every stage, and
 * "what are we still waiting on?" is answered by reading one file rather than
 * grepping components.
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
};

/** Single portraits/marks used in fixed positions. */
export const media: Record<
  "logo" | "founderTeaser" | "aboutPortrait" | "lecturesPortrait",
  ImageSlot
> = {
  /**
   * The mark beside her name in the header and the footer.
   *
   * This is the same profile photo as `aboutPortrait` and for the same reason
   * it works there: it is only ever drawn at 28-32px, far below the point where
   * the low-resolution source shows. Falls back to the monogram badge if it is
   * ever removed, which is also fine to ship — plenty of practices have no logo.
   */
  logo: {
    src: "/images/pnina-portrait.jpg",
    alt: "פנינה פאף",
    note: "כרגע תמונת הפרופיל. אם יהיה לוגו מעוצב — להחליף כאן.",
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
    note: string;
  }
> = {
  hero: {
    src: "/video/pnina-hero.mp4",
    remote: "first-video.mp4",
    poster: "/images/poster-hero.jpg",
    note: "סרטון לראש הדף. אילם (מושתק) כי דפדפנים חוסמים הפעלה אוטומטית עם קול.",
  },
  thankYou: {
    // Same clip as the hero for now, per Daniel. Replace with a dedicated
    // "thank you for reaching out" recording when she films one.
    src: "/video/pnina-hero.mp4",
    remote: "first-video.mp4",
    poster: "/images/poster-hero.jpg",
    note: "כרגע אותו סרטון של ראש הדף. כדאי סרטון ייעודי קצר לדף התודה.",
  },
  about: {
    src: "/video/pnina-about.mp4",
    remote: "aboutpage.mp4",
    poster: "/images/poster-about.jpg",
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
 * ⚠️ OPEN ITEM on `review-3`: an Instagram handle (@…) is still legible in the
 * upper third of that screenshot. That is a real, identifiable third party who
 * has not consented to appearing here. Crop or blur it before this site is
 * published — see docs/04-testimonials-policy.md.
 */
export const testimonialShots: ImageSlot[] = [
  {
    src: "/images/review-1.jpg",
    alt: "צילום מסך של הודעת וואטסאפ: ״רק להגיד לך שאת חזקה, מהממת ומרגשת ומייצגת כל כך הרבה נשים. תודה.״",
    note: "הודעת וואטסאפ. מפורסם באישור.",
    width: 830,
    height: 1222,
  },
  {
    src: "/images/review-2.jpg",
    alt: "צילום מסך של הודעה באינסטגרם: ״תודה ששלחת לי, הגיע לי בול בזמן.״",
    note: "הודעה באינסטגרם. מפורסם באישור.",
    width: 784,
    height: 1226,
  },
  {
    src: "/images/review-3.jpg",
    alt: "צילום מסך של הודעה באינסטגרם: ״לראות אותך נותן לי תקווה, לדעת שאפשר אחרת.״",
    note: "הודעה באינסטגרם. ⚠️ יש בצילום שם משתמש גלוי — צריך לטשטש לפני עלייה לאוויר.",
    width: 824,
    height: 1216,
  },
];

/** True when a slot has real media behind it. */
export function hasMedia(slot: ImageSlot): slot is ImageSlot & { src: string } {
  return typeof slot.src === "string" && slot.src.length > 0;
}
