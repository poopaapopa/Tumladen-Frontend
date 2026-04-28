// Импорт всех ассетов из папки assets/tiles
import cityCapWithRoad from '../assets/tiles/city_cap_with_road.webp';
import cityCap from '../assets/tiles/city_cap.webp';
import cityCurveShield from '../assets/tiles/city_curve_shield.webp';
import cityCurveWithRoadCurveShield from '../assets/tiles/city_curve_with_road_curve_shield.webp';
import cityCurveWithRoadCurve from '../assets/tiles/city_curve_with_road_curve.webp';
import cityCurve from '../assets/tiles/city_curve.webp';
import cityFullShield from '../assets/tiles/city_full_shield.webp';
import cityGateShieldWithRoad from '../assets/tiles/city_gate_shield_with_road.webp';
import cityGateShield from '../assets/tiles/city_gate_shield.webp';
import cityGateWithRoad from '../assets/tiles/city_gate_with_road.webp';
import cityGate from '../assets/tiles/city_gate.webp';
import cityRoadStraight from '../assets/tiles/city_road_straigh.webp'; // В названии файла в структуре опечатка (straigh), сохранил её
import cityStraightShield from '../assets/tiles/city_straight_shield.webp';
import cityStraight from '../assets/tiles/city_straight.webp';
import doubleCityCurve from '../assets/tiles/double_city_curve.webp';
import doubleCityOpposite from '../assets/tiles/double_city_opposite.webp';
import monasteryRoad from '../assets/tiles/monastery_road.webp';
import monastery from '../assets/tiles/monastery.webp';
import roadCross from '../assets/tiles/road_cross.webp';
import roadCurveCitySide from '../assets/tiles/road_curve_city_side.webp';
import roadCurve from '../assets/tiles/road_curve.webp';
import roadStraight from '../assets/tiles/road_straight.webp';
import roadTCitySide from '../assets/tiles/road_t_city_side.webp';
import roadT from '../assets/tiles/road_t.webp';
import startTile from '../assets/tiles/start_tile.webp';

export const TILE_IMAGES: Record<string, string> = {
  // Основные ключи по названиям
  'city_cap_with_road': cityCapWithRoad,
  'city_cap': cityCap,
  'city_curve_shield': cityCurveShield,
  'city_curve_with_road_curve_shield': cityCurveWithRoadCurveShield,
  'city_curve_with_road_curve': cityCurveWithRoadCurve,
  'city_curve': cityCurve,
  'city_full_shield': cityFullShield,
  'city_gate_shield_with_road': cityGateShieldWithRoad,
  'city_gate_shield': cityGateShield,
  'city_gate_with_road': cityGateWithRoad,
  'city_gate': cityGate,
  'city_road_straight': cityRoadStraight,
  'city_straight_shield': cityStraightShield,
  'city_straight': cityStraight,
  'double_city_curve': doubleCityCurve,
  'double_city_opposite': doubleCityOpposite,
  'monastery_road': monasteryRoad,
  'monastery': monastery,
  'road_cross': roadCross,
  'road_curve_city_side': roadCurveCitySide,
  'road_curve': roadCurve,
  'road_straight': roadStraight,
  'road_t_city_side': roadTCitySide,
  'road_t': roadT,
  'start_tile': startTile,

  // Алиасы (если бэкенд присылает числовые ID или короткие строки)
  '0': startTile,
  '1': roadT,
  '2': roadCurve,
  '3': cityStraight,
};