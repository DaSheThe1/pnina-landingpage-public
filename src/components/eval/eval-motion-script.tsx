/**
 * ⚠️ TEMPORARY — the pre-paint half of the `?motion=force` and `?accent=`
 * evaluation knobs.
 * Read the header of `src/lib/eval-flags.ts` first; it explains what this is
 * for, why it is allowed to persist, and when the whole thing gets deleted.
 *
 * ── WHY AN INLINE SCRIPT ──
 * The override is now sticky, so on a load with NO parameter the decision has
 * to be made before the first paint: `EvalOverrides` runs in an effect, i.e.
 * after React has hydrated, and by then the page has already been painted in
 * its reduced-motion rendering — the reveals resolved, the spine drawn, the
 * sequence already at its end state. Nothing would then re-run. The result is
 * not a flicker but a silently wrong review.
 *
 * So this one runs synchronously, as the first thing in the document, and does
 * exactly one thing: put `data-motion="force"` on <html> when this browser has
 * been told to force motion. Every rule that reads it — the reduced-motion
 * block and §7 in globals.css — then applies to the very first frame.
 *
 * `data-accent` rides along for the same reason, and a sharper one: an accent
 * decides what colour the primary CTA is, so applying it after hydration would
 * paint the shipped rose button and then swap it for a gold one in front of the
 * person reviewing the gold. A flash of the wrong accent is worse than none.
 *
 * ── WHY THIS IS SAFE TO SHIP ──
 * For anyone who has never typed `?motion=`, the whole body is: read the query
 * string, find nothing, read one localStorage key, find nothing, stop. It sets
 * no attribute, writes nothing, and costs a few hundred bytes of parse. It
 * cannot throw (whole body wrapped) and it cannot block: no network, no
 * layout read, no cookie.
 *
 * The key names are duplicated from `EVAL_MOTION_KEY` / `EVAL_ACCENT_KEY` in
 * src/lib/eval-flags.ts ON PURPOSE — this source is stringified into the
 * document, so it cannot import. Change one, change the other. The accent list
 * is duplicated from `ACCENT_VARIANTS` for the same reason.
 */
const EVAL_MOTION_SCRIPT = `
try {
  var d = document.documentElement;
  var q = new URLSearchParams(location.search);

  var k = "pnina:eval-motion";
  var p = q.get("motion");
  if (p === "force") localStorage.setItem(k, "force");
  else if (p === "reset") localStorage.removeItem(k);
  if (localStorage.getItem(k) === "force")
    d.setAttribute("data-motion", "force");

  var ak = "pnina:eval-accent";
  var a = q.get("accent");
  if (a === "reset") localStorage.removeItem(ak);
  else if (a === "amber" || a === "gold" || a === "pink" || a === "peach" || a === "sea")
    localStorage.setItem(ak, a);
  var av = localStorage.getItem(ak);
  if (av === "amber" || av === "gold" || av === "pink" || av === "peach" || av === "sea")
    d.setAttribute("data-accent", av);
} catch (e) {}
`;

export function EvalMotionScript() {
  return (
    <script
      // Not user input and not interpolated: a constant string in this file.
      dangerouslySetInnerHTML={{ __html: EVAL_MOTION_SCRIPT }}
    />
  );
}
