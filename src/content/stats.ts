export type Stat = {
  /** Numeric portion used by the animated counter; suffix kept separate. */
  to: number;
  suffix?: string;
  prefix?: string;
};

/**
 * Labels live in `messages/he.json` (stats.items) and are matched by index.
 *
 * ⚠️ EVERY NUMBER HERE IS A PLACEHOLDER ZERO. Do not invent figures for this
 * site. "עזרתי ל-200 נשים" is a claim about real people's lives; if it is not
 * true it is both a lie and, for this audience, a cruel one. The stats strip
 * hides itself entirely while every value is 0, so shipping without them is
 * safe — see StatsSection.
 *
 * TODO(client): question 4 of the intake (docs/01-client-intake.md) asks her
 * for these. Fill in only what she confirms, and delete the rest.
 */
export const stats: Stat[] = [
  { to: 0, suffix: "+" }, // נשים שליוויתי
  { to: 0, suffix: "+" }, // שנות ניסיון
  { to: 0, suffix: "+" }, // הרצאות וסדנאות
  { to: 0 }, // (spare slot — delete if unused)
];

/** True once at least one real number exists. Gates the whole section. */
export const hasStats = stats.some((stat) => stat.to > 0);
