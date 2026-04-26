const PLAYER_PALETTE = [
  '#E8302A', // яркий красный
  '#2E6FE8', // яркий синий
  '#27C75A', // яркий зелёный
  '#F5C518', // яркий жёлтый
  '#A83FE8', // яркий фиолетовый
  '#1AC8D4', // яркий бирюзовый
];

export const getPlayerColorBySeat = (seat: number | undefined): string => {
  if (seat === undefined || seat < 0) return '#989898';
  return PLAYER_PALETTE[seat % PLAYER_PALETTE.length];
};
