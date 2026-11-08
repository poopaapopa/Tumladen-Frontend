import { randomUUID } from 'node:crypto';
import {
  mkdir,
  readFile,
  rename,
  unlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const WEBP_QUALITY = 84;
const WEBP_EFFORT = 6;
const PREVIEW_WIDTH = 360;
const BOARD_COLOR = '#F5F5DC';
const FOREST_DARK = '#1F3623';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendDirectory = path.resolve(scriptDirectory, '..');
const assetDirectory = path.join(frontendDirectory, 'src/assets');
const tileDirectory = path.join(assetDirectory, 'tiles');
const ruleAssetDirectory = path.join(assetDirectory, 'rules');
const ruleIllustrationDirectory = path.join(ruleAssetDirectory, 'illustrations');
const ruleTileAssetDirectory = path.join(ruleAssetDirectory, 'tiles');
const geometryPath = path.join(
  frontendDirectory,
  'src/components/gameRoom/matchPlayerCard/meepleGeometry.ts',
);

const scenes = [
  {
    name: 'inn-road-rules',
    width: 800,
    height: 536,
    columns: 3,
    rows: 2,
    tileSize: 240,
    gap: 6,
    tiles: [
      { file: 'monastery_road.webp', column: 0, row: 0, rotation: 0 },
      { file: 'tavern-with-pond-near-road.webp', column: 0, row: 1, rotation: 90 },
      {
        file: 'cottage-replaced-with-tavern-and-lake.webp',
        column: 1,
        row: 1,
        rotation: 90,
      },
      { file: 'city_gate_with_road.webp', column: 2, row: 1, rotation: 90 },
    ],
    meeples: [
      { column: 1, row: 1, color: '#2E6FE8', size: 86 },
    ],
  },
  {
    name: 'cathedral-city-rules',
    width: 800,
    height: 600,
    columns: 4,
    rows: 3,
    tileSize: 180,
    gap: 5,
    tiles: [
      {
        file: 'road-village-with-tavern-lake.webp',
        column: 3,
        row: 1,
        rotation: 180,
      },
      { file: 'city_straight_shield.webp', column: 2, row: 1, rotation: 180 },
      { file: 'castle-with-extra-tower.webp', column: 1, row: 0, rotation: 270 },
      { file: 'cathedral-with-crypt.webp', column: 1, row: 1, rotation: 0 },
      { file: 'city_road_straigh.webp', column: 1, row: 2, rotation: 270 },
      {
        file: 'castle-with-extra-tower-and-wall.webp',
        column: 0,
        row: 0,
        rotation: 90,
      },
      { file: 'city_curve_shield.webp', column: 0, row: 1, rotation: 90 },
    ],
    meeples: [
      { column: 1, row: 0, color: '#E8302A', size: 72 },
    ],
  },
  {
    name: 'big-meeple-city-rules',
    width: 800,
    height: 560,
    columns: 3,
    rows: 2,
    tileSize: 240,
    gap: 6,
    tiles: [
      { file: 'city_road_straigh.webp', column: 0, row: 0, rotation: 0 },
      { file: 'city_gate_shield.webp', column: 1, row: 0, rotation: 180 },
      { file: 'city_cap_with_road.webp', column: 2, row: 0, rotation: 270 },
      { file: 'road_curve_city_side.webp', column: 0, row: 1, rotation: 0 },
      { file: 'city_gate_shield_with_road.webp', column: 1, row: 1, rotation: 0 },
      { file: 'castle-with-extra-tower.webp', column: 2, row: 1, rotation: 0 },
    ],
    meeples: [
      {
        column: 0,
        row: 0,
        color: '#E8302A',
        size: 106,
        offsetX: 50,
      },
      {
        column: 2,
        row: 1,
        color: '#2E6FE8',
        size: 78,
        offsetX: -48,
      },
    ],
  },
];

const ruleTileAssets = [
  {
    name: 'four-cities-tile-rules',
    file: 'castle-town-with-extra-tower.webp',
    rotation: 0,
  },
  {
    name: 'monastery-two-roads-tile-rules',
    file: 'monastery-with-two-roads.webp',
    rotation: 90,
  },
  {
    name: 'three-roads-inn-tile-rules',
    file: 'landscape-with-tavern-and-pond.webp',
    rotation: 270,
  },
  {
    name: 'short-road-boundaries-tile-rules',
    file: 'castle-town-road-hidden-by-bushes.webp',
    rotation: 0,
    blockedMarkers: [
      { x: 96, y: 128 },
      { x: 160, y: 128 },
    ],
  },
];

const meepleGeometrySource = await readFile(geometryPath, 'utf8');
const meeplePathMatch = meepleGeometrySource.match(/MEEPLE_PATH_DATA = "([^"]+)"/);
if (!meeplePathMatch) {
  throw new Error('Не удалось прочитать MEEPLE_PATH_DATA из meepleGeometry.ts');
}
const meeplePath = meeplePathMatch[1];

const shadeHexColor = (hexColor, brightness) => {
  const colorValue = Number.parseInt(hexColor.slice(1), 16);
  const channels = [16, 8, 0].map((shift) => (
    Math.round(((colorValue >> shift) & 0xff) * brightness)
  ));
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
};

const createMeepleSvg = ({
  color,
  size,
  opacity = 1,
  selected = false,
}) => {
  const layers = Array.from({ length: 18 }, (_, index) => {
    const layer = 18 - index;
    const brightness = 0.35 + (index / 18) * 0.38;
    return `<path d="${meeplePath}" fill="${shadeHexColor(color, brightness)}" `
      + `transform="translate(${layer * 5}, ${layer * -10})"/>`;
  }).join('');

  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"
      viewBox="-150 -200 750 750">
      <defs>
        <filter id="meeple-shadow" x="-30%" y="-30%" width="170%" height="180%">
          <feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="#11170f"
            flood-opacity="0.42"/>
          ${selected ? `<feDropShadow dx="0" dy="0" stdDeviation="18"
            flood-color="${color}" flood-opacity="0.7"/>` : ''}
        </filter>
        <linearGradient id="meeple-bevel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.3"/>
          <stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/>
          <stop offset="1" stop-color="#000000" stop-opacity="0.2"/>
        </linearGradient>
      </defs>
      <g filter="url(#meeple-shadow)" opacity="${opacity}"
        transform="translate(256,512) skewX(12) translate(-256,-512)">
        ${layers}
        <path d="${meeplePath}" fill="${color}" stroke="#000000" stroke-opacity="0.1"
          stroke-width="2"/>
        <path d="${meeplePath}" fill="url(#meeple-bevel)"/>
      </g>
    </svg>
  `);
};

const renderTile = async ({ file, rotation }, tileSize) => {
  const radius = Math.round(tileSize * 0.055);
  const mask = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}">
      <rect width="${tileSize}" height="${tileSize}" rx="${radius}" fill="#ffffff"/>
    </svg>
  `);

  const rotatedTile = await sharp(path.join(tileDirectory, file))
    .rotate(rotation)
    .resize(tileSize, tileSize, { fit: 'cover', kernel: sharp.kernel.lanczos3 })
    .ensureAlpha()
    .png()
    .toBuffer();

  return sharp(rotatedTile)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
};

const writeIfChanged = async (outputPath, buffer) => {
  let existing;
  try {
    existing = await readFile(outputPath);
  } catch {
    existing = undefined;
  }
  if (existing?.equals(buffer)) return false;

  await mkdir(path.dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.tmp-${process.pid}-${randomUUID()}`;
  try {
    await writeFile(temporaryPath, buffer, { flag: 'wx' });
    await rename(temporaryPath, outputPath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
  return true;
};

const writeResponsiveAsset = async (
  outputDirectory,
  name,
  fullBuffer,
  previewWidth = PREVIEW_WIDTH,
) => {
  const previewBuffer = await sharp(fullBuffer)
    .resize({ width: previewWidth, kernel: sharp.kernel.lanczos3 })
    .webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT, smartSubsample: true })
    .toBuffer();

  const fullPath = path.join(outputDirectory, `${name}.webp`);
  const previewPath = path.join(outputDirectory, `${name}-${previewWidth}.webp`);
  const [fullChanged, previewChanged] = await Promise.all([
    writeIfChanged(fullPath, fullBuffer),
    writeIfChanged(previewPath, previewBuffer),
  ]);

  const fullMetadata = await sharp(fullPath).metadata();
  const previewMetadata = await sharp(previewPath).metadata();
  console.log(
    `${fullChanged || previewChanged ? '✓' : '='} ${name}: `
    + `${fullMetadata.width}×${fullMetadata.height}, `
    + `${previewMetadata.width}×${previewMetadata.height}`,
  );
};

const renderScene = async (scene) => {
  const contentWidth = scene.columns * scene.tileSize + (scene.columns - 1) * scene.gap;
  const contentHeight = scene.rows * scene.tileSize + (scene.rows - 1) * scene.gap;
  const originX = Math.round((scene.width - contentWidth) / 2);
  const originY = Math.round((scene.height - contentHeight) / 2);
  const tilePosition = (column, row) => ({
    left: originX + column * (scene.tileSize + scene.gap),
    top: originY + row * (scene.tileSize + scene.gap),
  });

  const tileBuffers = await Promise.all(
    scene.tiles.map((tile) => renderTile(tile, scene.tileSize)),
  );

  const shadows = scene.tiles.map((tile) => {
    const position = tilePosition(tile.column, tile.row);
    return `<rect x="${position.left}" y="${position.top + 3}" width="${scene.tileSize}"
      height="${scene.tileSize}" rx="${Math.round(scene.tileSize * 0.055)}"
      fill="${FOREST_DARK}" fill-opacity="0.2" filter="url(#tile-shadow)"/>`;
  }).join('');
  const shadowLayer = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${scene.width}" height="${scene.height}">
      <defs>
        <filter id="tile-shadow" x="-20%" y="-20%" width="150%" height="160%">
          <feGaussianBlur stdDeviation="5"/>
        </filter>
      </defs>
      ${shadows}
    </svg>
  `);

  const composites = [{ input: shadowLayer, left: 0, top: 0 }];
  scene.tiles.forEach((tile, index) => {
    composites.push({ input: tileBuffers[index], ...tilePosition(tile.column, tile.row) });
  });

  for (const meeple of scene.meeples) {
    const meeplePosition = tilePosition(meeple.column, meeple.row);
    composites.push({
      input: createMeepleSvg(meeple),
      left: Math.round(
        meeplePosition.left
        + (scene.tileSize - meeple.size) / 2
        + (meeple.offsetX ?? 0),
      ),
      top: Math.round(
        meeplePosition.top
        + (scene.tileSize - meeple.size) / 2
        + (meeple.offsetY ?? 0),
      ),
    });
  }

  const fullBuffer = await sharp({
    create: {
      width: scene.width,
      height: scene.height,
      channels: 4,
      background: BOARD_COLOR,
    },
  })
    .composite(composites)
    .webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT, smartSubsample: true })
    .toBuffer();

  await writeResponsiveAsset(ruleIllustrationDirectory, scene.name, fullBuffer);
};

const createBlockedMarkersSvg = (markers) => Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
    <defs>
      <filter id="marker-shadow" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#ffffff"
          flood-opacity="0.95"/>
      </filter>
    </defs>
    ${markers.map(({ x, y }) => `
      <g transform="translate(${x} ${y})" filter="url(#marker-shadow)">
        <path d="M -10 -10 L 10 10 M 10 -10 L -10 10" fill="none"
          stroke="#ffffff" stroke-width="11" stroke-linecap="round"/>
        <path d="M -10 -10 L 10 10 M 10 -10 L -10 10" fill="none"
          stroke="#B2192A" stroke-width="7" stroke-linecap="round"/>
      </g>
    `).join('')}
  </svg>
`);

const renderRuleTileAsset = async ({ name, file, rotation, blockedMarkers = [] }) => {
  const tile = sharp(path.join(tileDirectory, file))
    .rotate(rotation)
    .resize(256, 256, { fit: 'cover', kernel: sharp.kernel.lanczos3 });

  if (blockedMarkers.length > 0) {
    tile.composite([{ input: createBlockedMarkersSvg(blockedMarkers), left: 0, top: 0 }]);
  }

  const fullBuffer = await tile
    .webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT, smartSubsample: true })
    .toBuffer();

  await writeResponsiveAsset(ruleTileAssetDirectory, name, fullBuffer, 128);
};

const renderFieldBoundaryAsset = async () => {
  const tileSize = 256;
  const gap = 4;
  const width = tileSize * 2 + gap;
  const [leftTile, rightTile] = await Promise.all([
    renderTile({ file: 'castle-with-extra-tower.webp', rotation: 0 }, tileSize),
    renderTile({ file: 'castle-town-without-three-house.webp', rotation: 180 }, tileSize),
  ]);
  const marker = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${tileSize}">
      <defs>
        <marker id="arrow" markerWidth="38" markerHeight="32" refX="18" refY="16"
          orient="auto" markerUnits="userSpaceOnUse" viewBox="0 0 38 32">
          <path d="M 3 3 L 35 16 L 3 29 z" fill="#083F82" stroke="#FFFDF2"
            stroke-width="4" stroke-linejoin="round" paint-order="stroke"/>
        </marker>
      </defs>
      <path d="M 436 50 C 384 30, 346 23, 292 19" fill="none" stroke="#FFFDF2"
        stroke-width="15" stroke-linecap="round"/>
      <path d="M 436 50 C 384 30, 346 23, 292 19" fill="none" stroke="#083F82"
        stroke-width="9" stroke-linecap="round" marker-end="url(#arrow)"/>
    </svg>
  `);

  const fullBuffer = await sharp({
    create: {
      width,
      height: tileSize,
      channels: 4,
      background: BOARD_COLOR,
    },
  })
    .composite([
      { input: leftTile, left: 0, top: 0 },
      { input: rightTile, left: tileSize + gap, top: 0 },
      { input: marker, left: 0, top: 0 },
    ])
    .webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT, smartSubsample: true })
    .toBuffer();

  await writeResponsiveAsset(
    ruleTileAssetDirectory,
    'field-boundary-tile-rules',
    fullBuffer,
    256,
  );
};

const renderMeepleSelectionAsset = async () => {
  const width = 720;
  const height = 180;
  const color = '#E8302A';
  const composites = [
    {
      input: createMeepleSvg({ color, size: 112, selected: true }),
      left: 72,
      top: 32,
    },
  ];

  for (let index = 0; index < 5; index += 1) {
    composites.push({
      input: createMeepleSvg({ color, size: 88, opacity: 0.42 }),
      left: 184 + index * 98,
      top: 50,
    });
  }

  const fullBuffer = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: BOARD_COLOR,
    },
  })
    .composite(composites)
    .webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT, smartSubsample: true })
    .toBuffer();

  await writeResponsiveAsset(
    ruleIllustrationDirectory,
    'big-meeple-selection-rules',
    fullBuffer,
  );
};

for (const scene of scenes) {
  await renderScene(scene);
}

for (const tileAsset of ruleTileAssets) {
  await renderRuleTileAsset(tileAsset);
}

await renderFieldBoundaryAsset();
await renderMeepleSelectionAsset();
