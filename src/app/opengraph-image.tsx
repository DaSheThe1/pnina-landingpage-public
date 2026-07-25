import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

/**
 * Social share card.
 *
 * ⚠️ HEBREW RENDERING: `next/og` renders with a bundled Latin-only font, so the
 * Hebrew here falls back and can come out as boxes. Before launch, either load a
 * Hebrew webfont into the ImageResponse (`fonts: [...]`) or replace this route
 * with a static `public/og.png` (1200×630) — see docs/05-content-guide.md.
 *
 * ⚠️ DISCRETION: this image is what appears when someone shares or is sent a
 * link, including in a group chat or on a shared/monitored device. Keep it
 * calm and non-explicit, and never put the words "sexual assault" in large type
 * on it. The current copy is intentionally understated for that reason.
 */
export const alt = "ליווי אישי ודיסקרטי — שיחה ראשונה ללא עלות";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Render the card once at build time (required by `output: "export"`; a no-op
// for the standalone build).
export const dynamic = "force-static";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff8f5",
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(194,74,133,0.22), transparent 62%), radial-gradient(circle at 85% 85%, rgba(27,155,144,0.18), transparent 58%)",
          color: "#2a2523",
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 36,
            fontWeight: 600,
            letterSpacing: -0.5,
            direction: "rtl",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 999,
              backgroundColor: "#8a1f58",
              color: "#ffffff",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            {siteConfig.monogram}
          </div>
          {siteConfig.name}
        </div>
        <div
          style={{
            marginTop: 44,
            maxWidth: 980,
            textAlign: "center",
            fontSize: 58,
            fontWeight: 600,
            letterSpacing: -1,
            lineHeight: 1.15,
            direction: "rtl",
          }}
        >
          את לא צריכה לעבור את זה לבד
        </div>
        <div
          style={{
            marginTop: 32,
            maxWidth: 860,
            textAlign: "center",
            fontSize: 28,
            lineHeight: 1.4,
            color: "#6e635d",
            direction: "rtl",
          }}
        >
          ליווי אישי ודיסקרטי, בקצב שלך. שיחה ראשונה ללא עלות וללא התחייבות.
        </div>
        <div
          style={{
            marginTop: 52,
            display: "flex",
            alignItems: "center",
            padding: "12px 28px",
            borderRadius: 999,
            border: "1px solid rgba(38,20,31,0.12)",
            backgroundColor: "rgba(255,255,255,0.7)",
            fontSize: 24,
            color: "#6e635d",
          }}
        >
          {siteConfig.domain}
        </div>
      </div>
    ),
    { ...size }
  );
}
