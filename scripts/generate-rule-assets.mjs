import { randomUUID } from 'node:crypto';
import {
  access,
  mkdir,
  readFile,
  rename,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const WEBP_EFFORT = 6;
const TILE_QUALITY = 80;
const ILLUSTRATION_QUALITY = 82;

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const assetDirectory = path.resolve(scriptDirectory, '../src/assets');
const argumentsList = process.argv.slice(2);
const shouldWrite = argumentsList.includes('--write');

if (argumentsList.includes('--help')) {
  console.log('Использование: node scripts/generate-rule-assets.mjs [--write]');
  console.log('Без --write выполняется безопасный dry-run без изменения файлов.');
  process.exit(0);
}

const unknownArguments = argumentsList.filter((argument) => argument !== '--write');
if (unknownArguments.length > 0) {
  throw new Error(`Неизвестные аргументы: ${unknownArguments.join(', ')}`);
}

const tileSources = [
  ['city_gate', 'city-gate'],
  ['road_straight', 'road-straight'],
  ['monastery', 'monastery'],
  ['start_tile', 'start-tile'],
  ['cottage-replaced-with-tavern-and-lake', 'tavern'],
  ['cathedral-with-crypt', 'cathedral'],
];

const illustrationSources = [
  'city',
  'fields',
  'monastery',
  'multiple',
  'road',
];

const profiles = [
  ...tileSources.flatMap(([sourceName, outputName]) => (
    [96, 192].map((width) => ({
      source: `tiles/${sourceName}.webp`,
      output: `rules/tiles/${outputName}-${width}.webp`,
      width,
      height: width,
      quality: TILE_QUALITY,
    }))
  )),
  ...illustrationSources.map((name) => ({
    source: `rules/illustrations/${name}-rules.webp`,
    output: `rules/illustrations/${name}-rules-360.webp`,
    width: 360,
    quality: ILLUSTRATION_QUALITY,
  })),
];

const exists = async (filePath) => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MiB`;
};

const formatDimensions = ({ width, height }) => `${width ?? '?'}×${height ?? '?'}`;

const resolveAssetPath = (relativePath) => {
  if (path.isAbsolute(relativePath)) {
    throw new Error(`Ожидался относительный путь: ${relativePath}`);
  }

  const resolvedPath = path.resolve(assetDirectory, relativePath);
  const relativeToAssets = path.relative(assetDirectory, resolvedPath);

  if (relativeToAssets.startsWith('..') || path.isAbsolute(relativeToAssets)) {
    throw new Error(`Путь выходит за пределы src/assets: ${relativePath}`);
  }

  return resolvedPath;
};

const validateMetadata = (metadata, profile, label) => {
  if (!metadata.width || !metadata.height) {
    throw new Error(`Не удалось определить размер ${label}`);
  }
  if ((metadata.pages ?? 1) > 1) {
    throw new Error(`Анимированные изображения не поддерживаются: ${label}`);
  }
  if (metadata.format !== 'webp') {
    throw new Error(
      `Неверный формат ${label}: ожидался webp, получен ${metadata.format ?? 'неизвестный'}`,
    );
  }
  if (metadata.width !== profile.width) {
    throw new Error(
      `Неверная ширина ${label}: ожидалось ${profile.width}px, получено ${metadata.width}px`,
    );
  }
  if (profile.height && metadata.height !== profile.height) {
    throw new Error(
      `Неверная высота ${label}: ожидалось ${profile.height}px, получено ${metadata.height}px`,
    );
  }
};

const seenOutputs = new Set();
for (const profile of profiles) {
  const outputPath = resolveAssetPath(profile.output);
  if (seenOutputs.has(outputPath)) {
    throw new Error(`Результат встречается в конфигурации дважды: ${profile.output}`);
  }
  seenOutputs.add(outputPath);
}

console.log(
  `${shouldWrite ? 'Генерация' : 'Предпросмотр'}: ${profiles.length} responsive-изображений правил`,
);

const plans = [];

for (const profile of profiles) {
  const sourcePath = resolveAssetPath(profile.source);
  const outputPath = resolveAssetPath(profile.output);

  if (!await exists(sourcePath)) {
    throw new Error(`Не найден исходник: ${profile.source}`);
  }

  const sourceSize = (await stat(sourcePath)).size;
  const sourceMetadata = await sharp(sourcePath).metadata();

  if (!sourceMetadata.width || sourceMetadata.width < profile.width) {
    throw new Error(
      `Исходник ${profile.source} уже целевой ширины или меньше: `
      + `${sourceMetadata.width ?? '?'}px ≤ ${profile.width}px`,
    );
  }

  const output = await sharp(sourcePath)
    .rotate()
    .resize({
      width: profile.width,
      height: profile.height,
      fit: profile.height ? 'cover' : 'inside',
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    })
    .webp({
      quality: profile.quality,
      alphaQuality: 100,
      effort: WEBP_EFFORT,
      smartSubsample: true,
    })
    .toBuffer();

  const outputMetadata = await sharp(output).metadata();
  validateMetadata(outputMetadata, profile, profile.output);

  if (output.byteLength >= sourceSize) {
    throw new Error(
      `Responsive-вариант не меньше исходника ${profile.source}: `
      + `${formatBytes(sourceSize)} → ${formatBytes(output.byteLength)}`,
    );
  }

  const outputExists = await exists(outputPath);
  const isUpToDate = outputExists && (await readFile(outputPath)).equals(output);

  plans.push({
    profile,
    output,
    outputPath,
    sourceMetadata,
    sourceSize,
    outputMetadata,
    isUpToDate,
  });
}

for (const plan of plans) {
  const marker = plan.isUpToDate ? '=' : shouldWrite ? '✓' : '→';
  const status = plan.isUpToDate ? ', актуально' : '';
  const savingPercent = ((1 - plan.output.byteLength / plan.sourceSize) * 100).toFixed(1);

  console.log(
    `  ${marker} ${plan.profile.source} → ${plan.profile.output}: `
    + `${formatDimensions(plan.sourceMetadata)} → ${formatDimensions(plan.outputMetadata)}, `
    + `${formatBytes(plan.sourceSize)} → ${formatBytes(plan.output.byteLength)} `
    + `(−${savingPercent}%)${status}`,
  );
}

const writablePlans = plans.filter((plan) => !plan.isUpToDate);
const temporaryFiles = [];

if (shouldWrite && writablePlans.length > 0) {
  try {
    for (const plan of writablePlans) {
      const temporaryPath = `${plan.outputPath}.tmp-${process.pid}-${randomUUID()}`;
      await mkdir(path.dirname(plan.outputPath), { recursive: true });
      await writeFile(temporaryPath, plan.output, { flag: 'wx' });
      temporaryFiles.push(temporaryPath);

      const temporaryMetadata = await sharp(temporaryPath).metadata();
      validateMetadata(temporaryMetadata, plan.profile, temporaryPath);
    }

    for (const [index, plan] of writablePlans.entries()) {
      await rename(temporaryFiles[index], plan.outputPath);
    }

    for (const plan of writablePlans) {
      const publishedMetadata = await sharp(plan.outputPath).metadata();
      validateMetadata(publishedMetadata, plan.profile, plan.profile.output);
    }
  } catch (error) {
    await Promise.all(
      temporaryFiles.map((temporaryPath) => unlink(temporaryPath).catch(() => undefined)),
    );
    throw error;
  }
}

const tilePlans = plans.filter((plan) => plan.profile.output.startsWith('rules/tiles/'));
const illustrationPlans = plans.filter((plan) => (
  plan.profile.output.startsWith('rules/illustrations/')
));
const sumOutputBytes = (selectedPlans) => (
  selectedPlans.reduce((sum, plan) => sum + plan.output.byteLength, 0)
);

console.log('');
console.log(
  `Итого: ${formatBytes(sumOutputBytes(plans))}; `
  + `тайлы ${formatBytes(sumOutputBytes(tilePlans))}, `
  + `иллюстрации ${formatBytes(sumOutputBytes(illustrationPlans))}.`,
);
console.log(
  `${writablePlans.length === 0 ? 'Все файлы актуальны' : `Требуют обновления: ${writablePlans.length}`}.`,
);

if (!shouldWrite && writablePlans.length > 0) {
  console.log('Это был dry-run. Для записи: npm run assets:rules:generate -- --write');
}
