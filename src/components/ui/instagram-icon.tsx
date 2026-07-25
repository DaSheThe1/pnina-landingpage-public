import { useId, type SVGProps } from "react";

/**
 * Instagram brand glyph (lucide ships no brand marks).
 *
 * By default it paints Instagram's own corner-to-corner brand gradient
 * (amber → magenta → indigo) rather than `currentColor`, so the mark is
 * recognisable at a glance the way the WhatsApp icon's green is. Pass
 * `brand={false}` to fall back to `currentColor` — use that anywhere the icon
 * sits on a dark or coloured fill where the gradient would disappear.
 *
 * The gradient id is generated per instance: two hard-coded ids on one page
 * collide, and whichever SVG renders second silently paints with the first
 * one's stops.
 *
 * Decorative — give the wrapping link/button an aria-label.
 */
export function InstagramIcon({
  className,
  brand = true,
  ...props
}: SVGProps<SVGSVGElement> & { brand?: boolean }) {
  const gradientId = useId();
  const stroke = brand ? `url(#${gradientId})` : "currentColor";

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {brand ? (
        <defs>
          {/* Instagram's official mark runs the gradient from the bottom-left
              corner to the top-right, which is why this is 0,1 → 1,0. */}
          <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#f9ce34" />
            <stop offset="30%" stopColor="#ee2a7b" />
            <stop offset="70%" stopColor="#c62aa4" />
            <stop offset="100%" stopColor="#6228d7" />
          </linearGradient>
        </defs>
      ) : null}
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
