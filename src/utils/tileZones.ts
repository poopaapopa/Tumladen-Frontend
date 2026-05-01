import tilesData from '../data/base_tiles.json';

const SEGMENT_COORDS: Record<string, { x: number; y: number }> = {
  top_left:       { x: -50, y: -50 },
  top_center:     { x:   0, y: -50 },
  top_right:      { x:  50, y: -50 },
  left_center:    { x: -50, y:   0 },
  right_center:   { x:  50, y:   0 },
  bottom_left:    { x: -50, y:  50 },
  bottom_center:  { x:   0, y:  50 },
  bottom_right:   { x:  50, y:  50 },
  center:         { x:   0, y:   0 },
  center_t_left:  { x: -25, y: -25 },
  center_b_left:  { x: -12, y:  12 },
  center_b_right: { x:  35, y:  35 },
  right_right_b:  { x:  30, y:  55 },
  bottom_bottom:  { x:   0, y:  60 },
  right_right_t:  { x:  60, y: -25 },
};

const ZONE_OFFSETS: Record<string, Record<string, { x: number; y: number }>> = {};

for (const tile of tilesData) {
  ZONE_OFFSETS[tile.tileId] = {};
  for (const zone of tile.zones) {
    ZONE_OFFSETS[tile.tileId][zone.zoneId] = SEGMENT_COORDS[zone.segment] ?? { x: 0, y: 0 };
  }
}

function rotateOffset(offset: { x: number; y: number }, rotationDeg: number) {
  const rad = (rotationDeg * Math.PI) / 180;
  return {
    x: Math.round(offset.x * Math.cos(rad) - offset.y * Math.sin(rad)),
    y: Math.round(offset.x * Math.sin(rad) + offset.y * Math.cos(rad)),
  };
}

export function getZoneOffset(
  tileId: string,
  zoneId: string,
  rotationDeg: number = 0
): { x: number; y: number } {
  const raw = ZONE_OFFSETS[tileId]?.[zoneId];
  if (!raw) return { x: 0, y: 0 };
  return rotateOffset(raw, rotationDeg);
}
