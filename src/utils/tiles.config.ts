import { MINIO_URL } from '../api/config';

const getTileUrl = (fileName: string) => `${MINIO_URL}/tiles/${fileName}.webp`;

export const TILE_IMAGES: Record<string, string> = {
  'city_cap_with_road': getTileUrl('city_cap_with_road'),
  'city_cap': getTileUrl('city_cap'),
  'city_curve_shield': getTileUrl('city_curve_shield'),
  'city_curve_with_road_curve_shield': getTileUrl('city_curve_with_road_curve_shield'),
  'city_curve_with_road_curve': getTileUrl('city_curve_with_road_curve'),
  'city_curve': getTileUrl('city_curve'),
  'city_full_shield': getTileUrl('city_full_shield'),
  'city_gate_shield_with_road': getTileUrl('city_gate_shield_with_road'),
  'city_gate_shield': getTileUrl('city_gate_shield'),
  'city_gate_with_road': getTileUrl('city_gate_with_road'),
  'city_gate': getTileUrl('city_gate'),
  'city_road_straight': getTileUrl('city_road_straigh'),
  'city_straight_shield': getTileUrl('city_straight_shield'),
  'city_straight': getTileUrl('city_straight'),
  'double_city_curve': getTileUrl('double_city_curve'),
  'double_city_opposite': getTileUrl('double_city_opposite'),
  'monastery_road': getTileUrl('monastery_road'),
  'monastery': getTileUrl('monastery'),
  'road_cross': getTileUrl('road_cross'),
  'road_curve_city_side': getTileUrl('road_curve_city_side'),
  'road_curve': getTileUrl('road_curve'),
  'road_straight': getTileUrl('road_straight'),
  'road_t_city_side': getTileUrl('road_t_city_side'),
  'road_t': getTileUrl('road_t'),
  'start_tile': getTileUrl('start_tile'),

  // Алиасы
  '0': getTileUrl('start_tile'),
  '1': getTileUrl('road_t'),
  '2': getTileUrl('road_curve'),
  '3': getTileUrl('city_straight'),
};