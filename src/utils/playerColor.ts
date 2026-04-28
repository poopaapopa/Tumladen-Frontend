const PLAYER_PALETTE = [
  '#E8302A',
  '#2E6FE8',
  '#27C75A',
  '#F5C518',
  '#A83FE8',
  '#1AC8D4',
];

export const getPlayerColorBySeat = (seat: number | undefined): string => {
  if (seat === undefined || seat < 0) return '#989898';
  return PLAYER_PALETTE[seat % PLAYER_PALETTE.length];
};
