/**
 * The two accompaniment tracks, matched BY INDEX to `offers.items` in
 * `messages/he.json` (all copy, including the prices, lives there).
 *
 * Index 0 is מסלול צדפה (a month), index 1 is מסלול פנינה (three months). They
 * are deliberately rendered as equals: her own framing is "שני המסלולים זהים
 * באופיים, ההבדל ביניהם הוא הזמן", so there is no `featured` flag, no badge, no
 * shadow card and no button on either rung. The only button in the section is
 * the free introductory call.
 *
 * `node` is the shape the rung wears on the ladder's spine — the ONLY thing
 * that visually distinguishes the two, and it is a picture of the section's
 * title ("מהצדפה אל הפנינה"), not a ranking. `pearl` is the single filled node
 * on the whole page; if a third track is ever added it does NOT get one.
 */
export type OfferTrack = {
  node: "hollow" | "pearl";
};

export const offerTracks: OfferTrack[] = [
  { node: "hollow" }, // צדפה — חודש
  { node: "pearl" }, // פנינה — שלושה חודשים
];
