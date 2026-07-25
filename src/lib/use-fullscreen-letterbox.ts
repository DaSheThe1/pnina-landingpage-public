"use client";

import { useEffect, type RefObject } from "react";

/**
 * Letterbox a video while it is fullscreen instead of cropping it.
 *
 * Every clip on this site is a 9:16 phone recording, framed inline in a 9:16
 * phone and filled with `object-cover`. That is right inline, but `object-fit`
 * keeps applying in fullscreen: on a 16:9 screen `cover` scales a portrait
 * video up until only a narrow vertical band survives and her head is off the
 * top of the frame. Switching to `contain` shows the whole clip at its own
 * proportions with black bars either side, which is what "fullscreen" should
 * mean here.
 *
 * This lives in JS rather than a `video:fullscreen { … }` CSS rule because that
 * rule is dropped by the Tailwind v4 / Lightning CSS build and never reaches
 * the browser — verified against the compiled stylesheet. See the note in
 * globals.css.
 *
 * Nothing is needed for iOS Safari, whose `webkitEnterFullscreen` hands off to
 * the native player and letterboxes on its own; the vendor event is listened
 * for anyway so older WebKit desktop builds are covered.
 *
 * Once she supplies a landscape clip this hook becomes a no-op rather than a
 * thing to remove: `contain` and `cover` are identical when the video's aspect
 * ratio already matches the screen's.
 */
export function useFullscreenLetterbox(
  ref: RefObject<HTMLVideoElement | null>
) {
  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const sync = () => {
      const isFullscreen =
        document.fullscreenElement === video ||
        (
          document as Document & { webkitFullscreenElement?: Element }
        ).webkitFullscreenElement === video;

      // Clearing back to "" hands control to the Tailwind class, so the inline
      // frame goes back to filling its phone-shaped container on exit.
      video.style.objectFit = isFullscreen ? "contain" : "";
      video.style.backgroundColor = isFullscreen ? "#000" : "";
    };

    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    sync();

    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, [ref]);
}
