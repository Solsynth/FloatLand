/** Fortune level → accent color, shared by the dashboard oracle and trend cards. */
export const FORTUNE_LEVEL_COLORS: Record<number, string> = {
  0: "#7A587D",
  1: "#79709C",
  2: "#8DB7EF",
  3: "#FEDE81",
  4: "#E04A46",
  5: "#FFB7C0",
};

export function fortuneLevelColor(level: number): string {
  return FORTUNE_LEVEL_COLORS[level] ?? "#8DB7EF";
}
