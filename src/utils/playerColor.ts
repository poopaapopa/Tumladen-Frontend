const PLAYER_PALETTE = [
  '#A62D2D',
  '#2D54A6',
  '#27AE60',
  '#D4AF37',
  '#7D2DA6',
  '#2C3E50',
];

export const getPlayerColorBySeat = (seat: number | undefined): string => {
  if (seat === undefined || seat < 0) return '#989898';
  return PLAYER_PALETTE[seat % PLAYER_PALETTE.length];
};
