/**
 * A price, written the way Hebrew writes one: the shekel sign BEFORE the
 * digits, and the whole thing wrapped in `<bdi>` so the bidirectional algorithm
 * treats "₪2,880" as one isolated run. Without the isolation the sign and the
 * comma are neutral characters and can be re-ordered by whatever sits beside
 * them — which is how "₪990" ends up rendering as "990₪" next to Hebrew text.
 *
 * It lives here rather than inside `marketing-sections.tsx` because the free
 * call's value anchor (`src/components/motion/free-call-anchor.tsx`) is a client
 * component and needs the same rule; two spellings of "how this site writes a
 * price" is how one of them quietly stops being wrapped.
 *
 * The string itself always comes from `messages/he.json`. Nothing here formats
 * a number — the prices are Pnina's, written out by hand, and no code on this
 * site invents or recomputes one.
 */
export function Price({ children }: { children: string }) {
  return <bdi className="tabular-nums">{children}</bdi>;
}
