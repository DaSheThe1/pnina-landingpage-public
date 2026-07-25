export type OfferConfig = {
  featured?: boolean;
};

// Copy lives in the message files (offers.items); only structural flags stay
// here, matched by index. The middle offer is the featured one.
export const offers: OfferConfig[] = [{}, { featured: true }, {}];
