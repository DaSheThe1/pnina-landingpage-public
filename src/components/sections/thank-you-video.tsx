"use client";

import { useTranslations } from "next-intl";

import { MessageVideo } from "@/components/ui/message-video";
import { posterSrc, videoSrc, videos } from "@/content/media";

/**
 * Her personal message on the thank-you page. Production streams it from the R2
 * media bucket and dev falls back to the bundled copy; `videoSrc` owns that
 * decision. See docs/06-media-and-cdn.md.
 *
 * All the playback behaviour lives in MessageVideo, which is shared with the
 * /about page.
 */
export function ThankYouVideo() {
  const t = useTranslations("pages.thankYou.video");

  return (
    <MessageVideo
      src={videoSrc("thankYou")}
      poster={posterSrc("thankYou")}
      // null: this clip's Hebrew captions are burnt into the picture. See
      // `captionsNote` in src/content/media.ts.
      captions={videos.thankYou.captions}
      trackAs="thankyou_video_watch"
      labels={{
        playWithSound: t("playWithSound"),
        playAria: t("playAria"),
        loading: t("loading"),
        noVideoNote: t("noVideoNote"),
        fullscreen: t("fullscreen"),
        fullscreenAria: t("fullscreenAria"),
        hint: t("watchFirst"),
      }}
    />
  );
}
