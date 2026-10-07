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
import baseTiles from '../data/base_tiles.json';
import innsAndCathedralsTiles from '../data/inns_cathedrals.json';

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

const EXPANSION_INNS_AND_CATHEDRALS = 'inns_and_cathedrals';
const DEFAULT_PRELOAD_CONCURRENCY = 4;
const IMAGE_LOAD_TIMEOUT_MS = 15_000;

const BASE_TILE_IDS = [...new Set(baseTiles.map((tile) => tile.tileId))];
const EXPANSION_TILE_IDS: Record<string, string[]> = {
  [EXPANSION_INNS_AND_CATHEDRALS]: [
    ...new Set(innsAndCathedralsTiles.map((tile) => tile.tileId)),
  ],
};

const loadedTileImages = new Map<string, HTMLImageElement>();
const imageRequests = new Map<string, Promise<HTMLImageElement | null>>();

interface NetworkInformationLike {
  effectiveType?: string;
  saveData?: boolean;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformationLike;
}

type RequestIdleCallback = (
  callback: IdleRequestCallback,
  options?: IdleRequestOptions,
) => number;

export interface TileImagePreloadProgress {
  completed: number;
  failed: number;
  total: number;
}

interface TileImagePreloadOptions {
  concurrency?: number;
  onProgress?: (progress: TileImagePreloadProgress) => void;
  signal?: AbortSignal;
}

const getConnection = (): NetworkInformationLike | undefined =>
  (navigator as NavigatorWithConnection).connection;

/** Avoids spending the player's limited traffic on assets that are not visible yet. */
export const shouldLimitBackgroundPreload = (): boolean => {
  if (typeof navigator === 'undefined') return false;

  const connection = getConnection();
  return Boolean(
    connection?.saveData ||
    connection?.effectiveType === 'slow-2g' ||
    connection?.effectiveType === '2g',
  );
};

export const getGameTileIds = (expansions: string[] = []): string[] => {
  const tileIds = new Set(BASE_TILE_IDS);
  expansions.forEach((expansion) => {
    EXPANSION_TILE_IDS[expansion]?.forEach((tileId) => tileIds.add(tileId));
  });
  return [...tileIds];
};

const getTileImageSources = (tileIds: Iterable<string>): string[] => [
  ...new Set(
    [...tileIds]
      .map((tileId) => TILE_IMAGES[tileId])
      .filter((src): src is string => Boolean(src)),
  ),
];

const loadAndDecodeImage = (src: string): Promise<HTMLImageElement | null> => {
  const cachedImage = loadedTileImages.get(src);
  if (cachedImage) return Promise.resolve(cachedImage);

  const existingRequest = imageRequests.get(src);
  if (existingRequest) return existingRequest;

  const request = new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    let settled = false;

    const finish = (loaded: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      imageRequests.delete(src);

      if (loaded) {
        loadedTileImages.set(src, image);
        resolve(image);
      } else {
        resolve(null);
      }
    };

    const finishAfterDecode = async () => {
      try {
        await image.decode?.();
      } catch {
        // A successful load is enough on browsers with a partial decode() implementation.
      }
      finish(image.naturalWidth > 0);
    };

    const timeout = window.setTimeout(() => {
      finish(image.complete && image.naturalWidth > 0);
    }, IMAGE_LOAD_TIMEOUT_MS);

    image.decoding = 'async';
    image.onload = () => void finishAfterDecode();
    image.onerror = () => finish(false);
    image.src = src;

    if (image.complete) void finishAfterDecode();
  });

  imageRequests.set(src, request);
  return request;
};

/** Returns the exact decoded image instance shared by the preloader and Konva. */
export const getCachedTileImage = (tileId: string | undefined): HTMLImageElement | undefined => {
  if (!tileId) return undefined;
  const src = TILE_IMAGES[tileId];
  return src ? loadedTileImages.get(src) : undefined;
};

/** Loads one tile into the shared decoded-image cache. */
export const loadTileImage = (tileId: string): Promise<HTMLImageElement | null> => {
  const src = TILE_IMAGES[tileId];
  return src ? loadAndDecodeImage(src) : Promise.resolve(null);
};

/**
 * Loads a selected set of tiles with bounded concurrency and waits until the
 * browser has decoded them. Requests are shared between the lobby and match.
 */
export const preloadTileImages = async (
  tileIds: Iterable<string>,
  options: TileImagePreloadOptions = {},
): Promise<TileImagePreloadProgress> => {
  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    return { completed: 0, failed: 0, total: 0 };
  }

  const sources = getTileImageSources(tileIds);
  const total = sources.length;
  let completed = sources.filter((src) => loadedTileImages.has(src)).length;
  let failed = 0;
  let nextIndex = 0;
  const pendingSources = sources.filter((src) => !loadedTileImages.has(src));

  const reportProgress = () => {
    if (options.signal?.aborted) return;
    options.onProgress?.({ completed, failed, total });
  };

  reportProgress();

  const worker = async () => {
    while (!options.signal?.aborted) {
      const sourceIndex = nextIndex;
      nextIndex += 1;
      const src = pendingSources[sourceIndex];
      if (!src) return;

      const image = await loadAndDecodeImage(src);
      if (options.signal?.aborted) return;

      if (image) completed += 1;
      else failed += 1;
      reportProgress();
    }
  };

  const concurrency = Math.max(
    1,
    Math.min(options.concurrency ?? DEFAULT_PRELOAD_CONCURRENCY, pendingSources.length || 1),
  );
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  return { completed, failed, total };
};

/** Starts non-critical loading only when the browser is idle. */
export const scheduleGameTilePreload = (expansions: string[] = []): (() => void) => {
  if (typeof window === 'undefined' || shouldLimitBackgroundPreload()) {
    return () => undefined;
  }

  const controller = new AbortController();
  const start = () => {
    void preloadTileImages(getGameTileIds(expansions), {
      concurrency: 3,
      signal: controller.signal,
    });
  };

  const requestIdleCallback = Reflect.get(window, 'requestIdleCallback') as
    | RequestIdleCallback
    | undefined;
  const cancelIdleCallback = Reflect.get(window, 'cancelIdleCallback') as
    | ((handle: number) => void)
    | undefined;

  if (requestIdleCallback && cancelIdleCallback) {
    const idleCallbackId = requestIdleCallback(start, { timeout: 1_500 });
    return () => {
      controller.abort();
      cancelIdleCallback(idleCallbackId);
    };
  }

  const timeoutId = setTimeout(start, 300);
  return () => {
    controller.abort();
    clearTimeout(timeoutId);
  };
};
