import castleTownNoShield from '../assets/tiles/castle-town-no-shield.webp';
import castleTownRoadHiddenByBushes from '../assets/tiles/castle-town-road-hidden-by-bushes.webp';
import castleTownWithExtraTower from '../assets/tiles/castle-town-with-extra-tower.webp';
import castleTownWithTwoTowers from '../assets/tiles/castle-town-with-two-towers.webp';
import castleTownWithoutThreeHouse from '../assets/tiles/castle-town-without-three-house.webp';
import castleWithExtraTowerAndWall from '../assets/tiles/castle-with-extra-tower-and-wall.webp';
import castleWithExtraTower from '../assets/tiles/castle-with-extra-tower.webp';
import castleWithGatesAndRoads from '../assets/tiles/castle-with-gates-and-roads.webp';
import cathedralWithCrypt from '../assets/tiles/cathedral-with-crypt.webp';
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
import cityRoadStraight from '../assets/tiles/city_road_straigh.webp';
import cityStraightShield from '../assets/tiles/city_straight_shield.webp';
import cityStraight from '../assets/tiles/city_straight.webp';
import cottageReplacedWithTavernAndLake from '../assets/tiles/cottage-replaced-with-tavern-and-lake.webp';
import doubleCityCurve from '../assets/tiles/double_city_curve.webp';
import doubleCityOpposite from '../assets/tiles/double_city_opposite.webp';
import landscapeWithTavernAndPond from '../assets/tiles/landscape-with-tavern-and-pond.webp';
import mapWithRoadNoIcon from '../assets/tiles/map-with-road-no-icon.webp';
import monasteryRoad from '../assets/tiles/monastery_road.webp';
import monasteryWithTwoRoads from '../assets/tiles/monastery-with-two-roads.webp';
import monastery from '../assets/tiles/monastery.webp';
import roadCross from '../assets/tiles/road_cross.webp';
import roadCurveCitySide from '../assets/tiles/road_curve_city_side.webp';
import roadCurve from '../assets/tiles/road_curve.webp';
import roadStraight from '../assets/tiles/road_straight.webp';
import roadTCitySide from '../assets/tiles/road_t_city_side.webp';
import roadT from '../assets/tiles/road_t.webp';
import roadVillageWithTavernLake from '../assets/tiles/road-village-with-tavern-lake.webp';
import startTile from '../assets/tiles/start_tile.webp';
import tavernWithPondNearRoad from '../assets/tiles/tavern-with-pond-near-road.webp';
import townWithPondBushesRoad from '../assets/tiles/town-with-pond-bushes-road.webp';
import townWithTavernAndLake from '../assets/tiles/town-with-tavern-and-lake.webp';

export const TILE_IMAGES: Record<string, string> = {
  'castle-town-no-shield': castleTownNoShield,
  'castle-town-road-hidden-by-bushes': castleTownRoadHiddenByBushes,
  'castle-town-with-extra-tower': castleTownWithExtraTower,
  'castle-town-with-two-towers': castleTownWithTwoTowers,
  'castle-town-without-three-house': castleTownWithoutThreeHouse,
  'castle-with-extra-tower-and-wall': castleWithExtraTowerAndWall,
  'castle-with-extra-tower': castleWithExtraTower,
  'castle-with-gates-and-roads': castleWithGatesAndRoads,
  'cathedral-with-crypt': cathedralWithCrypt,
  city_cap_with_road: cityCapWithRoad,
  city_cap: cityCap,
  city_curve_shield: cityCurveShield,
  city_curve_with_road_curve_shield: cityCurveWithRoadCurveShield,
  city_curve_with_road_curve: cityCurveWithRoadCurve,
  city_curve: cityCurve,
  city_full_shield: cityFullShield,
  city_gate_shield_with_road: cityGateShieldWithRoad,
  city_gate_shield: cityGateShield,
  city_gate_with_road: cityGateWithRoad,
  city_gate: cityGate,
  city_road_straight: cityRoadStraight,
  city_straight_shield: cityStraightShield,
  city_straight: cityStraight,
  'cottage-replaced-with-tavern-and-lake': cottageReplacedWithTavernAndLake,
  double_city_curve: doubleCityCurve,
  double_city_opposite: doubleCityOpposite,
  'landscape-with-tavern-and-pond': landscapeWithTavernAndPond,
  'map-with-road-no-icon': mapWithRoadNoIcon,
  monastery_road: monasteryRoad,
  'monastery-with-two-roads': monasteryWithTwoRoads,
  monastery: monastery,
  road_cross: roadCross,
  road_curve_city_side: roadCurveCitySide,
  road_curve: roadCurve,
  road_straight: roadStraight,
  road_t_city_side: roadTCitySide,
  road_t: roadT,
  'road-village-with-tavern-lake': roadVillageWithTavernLake,
  start_tile: startTile,
  'tavern-with-pond-near-road': tavernWithPondNearRoad,
  'town-with-pond-bushes-road': townWithPondBushesRoad,
  'town-with-tavern-and-lake': townWithTavernAndLake,
};

export function preloadTileImages(): void {
  Object.values(TILE_IMAGES).forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}
