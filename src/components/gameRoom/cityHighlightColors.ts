export const CITY_HIGHLIGHT_COLORS = [
  '#f3c95b',
  '#ef8f5b',
  '#69b7d6',
  '#b18bd3',
  '#77b86b',
] as const;

export const getCityHighlightColor = (index: number): string => (
  CITY_HIGHLIGHT_COLORS[index % CITY_HIGHLIGHT_COLORS.length]
);
