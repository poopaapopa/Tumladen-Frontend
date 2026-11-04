import { randomUUID } from 'node:crypto';
import { access, mkdir, rename, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const WEBP_EFFORT = 6;
const DEFAULT_WEBP_QUALITY = 84;
const SUPPORTED_SOURCE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const assetDirectory = path.resolve(scriptDirectory, '../src/assets');
const argumentsList = process.argv.slice(2);
const shouldWrite = argumentsList.includes('--write');

if (argumentsList.includes('--help')) {
  console.log('Использование: node scripts/optimize-assets.mjs [--write]');
  console.log('Без --write выполняется безопасный dry-run без изменения файлов.');
  process.exit(0);
}

const unknownArguments = argumentsList.filter((argument) => argument !== '--write');
if (unknownArguments.length > 0) {
  throw new Error(`Неизвестные аргументы: ${unknownArguments.join(', ')}`);
}

const assetProfiles = [
  // В интерфейсе ачивки занимают максимум 120×120 CSS px.
  ...['castle', 'crown', 'tavern'].map((name) => ({
    source: `achievements/${name}.png`,
    output: `achievements/${name}.webp`,
    maxSize: 256,
    quality: 85,
  })),

  // Иллюстрации правил могут быть крупнее остальных UI-изображений.
  ...['city', 'fields', 'monastery', 'multiple', 'road'].map((name) => ({
    source: `${name}-rules.png`,
    output: `${name}-rules.webp`,
    maxSize: 800,
    quality: 84,
  })),

  // Иллюстрации эльфов показываются шириной до 275 CSS px.
  ...[
    'elf-campfire',
    'elf-closing-door',
    'elf-exile',
    'elf-game',
    'elf-leaves',
    'elf-mountains',
    'elves-delete-room',
  ].map((name) => ({
    source: `${name}.png`,
    output: `${name}.webp`,
    maxSize: 560,
    quality: 85,
  })),

  // Остальные растровые иллюстрации имеют собственные ограничения в UI.
  {
    source: 'castle.png',
    output: 'castle.webp',
    maxSize: 320,
    quality: 84,
  },
  {
    source: 'gameExit.png',
    output: 'gameExit.webp',
    maxSize: 520,
    quality: 85,
  },
  {
    source: 'sad-elf.png',
    output: 'sad-elf.webp',
    maxSize: 320,
    quality: 85,
  },
  {
    source: 'zamok.png',
    output: 'zamok.webp',
    maxSize: 700,
    quality: 84,
  },

  // Этот файл также используется как favicon, поэтому оставляем PNG.
  {
    source: 'icon.png',
    output: 'icon.png',
    maxSize: 64,
    format: 'png',
  },
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

const expectedFormat = (profile) => profile.format ?? 'webp';

const validateMetadata = (metadata, profile, label, format) => {
  if (!metadata.width || !metadata.height) {
    throw new Error(`Не удалось определить размер ${label}`);
  }
  if ((metadata.pages ?? 1) > 1) {
    throw new Error(`Анимированные изображения не поддерживаются: ${label}`);
  }
  if (format && metadata.format !== format) {
    throw new Error(
      `Неверный формат ${label}: ожидался ${format}, получен ${metadata.format ?? 'неизвестный'}`,
    );
  }
  if (metadata.width > profile.maxSize || metadata.height > profile.maxSize) {
    throw new Error(
      `Размер ${label} превышает ${profile.maxSize}px: ${formatDimensions(metadata)}`,
    );
  }
};

const seenSources = new Set();
const seenOutputs = new Set();

for (const profile of assetProfiles) {
  const sourcePath = resolveAssetPath(profile.source);
  const outputPath = resolveAssetPath(profile.output);
  const sourceExtension = path.extname(sourcePath).toLowerCase();
  const outputExtension = path.extname(outputPath).toLowerCase();
  const format = expectedFormat(profile);

  if (!SUPPORTED_SOURCE_EXTENSIONS.has(sourceExtension)) {
    throw new Error(`Неподдерживаемый исходный формат: ${profile.source}`);
  }
  if (outputExtension !== `.${format}`) {
    throw new Error(`Расширение не соответствует формату ${format}: ${profile.output}`);
  }
  if (!Number.isInteger(profile.maxSize) || profile.maxSize <= 0) {
    throw new Error(`Некорректный maxSize для ${profile.source}`);
  }
  if (seenSources.has(sourcePath)) {
    throw new Error(`Исходник встречается в конфигурации дважды: ${profile.source}`);
  }
  if (seenOutputs.has(outputPath)) {
    throw new Error(`Результат встречается в конфигурации дважды: ${profile.output}`);
  }

  seenSources.add(sourcePath);
  seenOutputs.add(outputPath);
}

const plans = [];
let totalBefore = 0;
let totalAfter = 0;

console.log(
  `${shouldWrite ? 'Оптимизация' : 'Предпросмотр'}: ${assetProfiles.length} изображений`,
);

// Сначала полностью декодируем и валидируем весь набор. Ошибка в одном файле
// не должна оставлять каталог наполовину преобразованным.
for (const profile of assetProfiles) {
  const sourcePath = resolveAssetPath(profile.source);
  const outputPath = resolveAssetPath(profile.output);
  const sourceIsOutput = sourcePath === outputPath;
  const sourceExists = await exists(sourcePath);
  const outputExists = sourceIsOutput ? sourceExists : await exists(outputPath);
  const format = expectedFormat(profile);

  if (!sourceIsOutput && sourceExists && outputExists) {
    throw new Error(
      `Коллизия: одновременно существуют ${profile.source} и ${profile.output}`,
    );
  }
  if (!sourceExists && !outputExists) {
    throw new Error(
      `Не найден ни исходник ${profile.source}, ни результат ${profile.output}`,
    );
  }

  const inputPath = sourceExists ? sourcePath : outputPath;
  const inputSize = (await stat(inputPath)).size;
  const inputMetadata = await sharp(inputPath).metadata();
  const inputIsOutput = inputPath === outputPath;
  const inputHasTargetDimensions = Boolean(
    inputMetadata.width
    && inputMetadata.height
    && inputMetadata.width <= profile.maxSize
    && inputMetadata.height <= profile.maxSize,
  );

  totalBefore += inputSize;

  // После первого запуска исходный PNG удаляется. Повторные запуски проверяют
  // уже созданный результат и не перекодируют его снова.
  if (inputIsOutput && (!sourceIsOutput || inputHasTargetDimensions)) {
    validateMetadata(inputMetadata, profile, profile.output, format);
    totalAfter += inputSize;
    plans.push({
      profile,
      sourcePath,
      outputPath,
      inputMetadata,
      inputSize,
      skipped: true,
    });
    continue;
  }

  if (!inputMetadata.width || !inputMetadata.height) {
    throw new Error(`Не удалось определить размер ${profile.source}`);
  }
  if ((inputMetadata.pages ?? 1) > 1) {
    throw new Error(`Анимированные изображения не поддерживаются: ${profile.source}`);
  }

  let pipeline = sharp(inputPath)
    .rotate()
    .resize({
      width: profile.maxSize,
      height: profile.maxSize,
      fit: 'inside',
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    });

  if (format === 'png') {
    pipeline = pipeline.png({
      compressionLevel: 9,
      adaptiveFiltering: true,
    });
  } else {
    pipeline = pipeline.webp({
      quality: profile.quality ?? DEFAULT_WEBP_QUALITY,
      alphaQuality: 100,
      effort: WEBP_EFFORT,
      smartSubsample: true,
    });
  }

  const output = await pipeline.toBuffer();
  const outputMetadata = await sharp(output).metadata();
  const outputSize = output.byteLength;

  validateMetadata(outputMetadata, profile, profile.output, format);

  if (outputSize >= inputSize) {
    throw new Error(
      `Оптимизация увеличивает ${profile.source}: `
      + `${formatBytes(inputSize)} → ${formatBytes(outputSize)}`,
    );
  }

  totalAfter += outputSize;
  plans.push({
    profile,
    sourcePath,
    outputPath,
    inputMetadata,
    outputMetadata,
    inputSize,
    outputSize,
    output,
    skipped: false,
  });
}

for (const plan of plans) {
  if (plan.skipped) {
    console.log(
      `  = ${plan.profile.output}: ${formatDimensions(plan.inputMetadata)}, уже оптимизировано`,
    );
    continue;
  }

  const savingPercent = ((1 - plan.outputSize / plan.inputSize) * 100).toFixed(1);
  console.log(
    `  ${shouldWrite ? '✓' : '→'} ${plan.profile.source} → ${plan.profile.output}: `
    + `${formatDimensions(plan.inputMetadata)} → ${formatDimensions(plan.outputMetadata)}, `
    + `${formatBytes(plan.inputSize)} → ${formatBytes(plan.outputSize)} `
    + `(−${savingPercent}%)`,
  );
}

const writablePlans = plans.filter((plan) => !plan.skipped);
const temporaryFiles = [];

if (shouldWrite && writablePlans.length > 0) {
  try {
    // Фаза 1: записываем и проверяем все временные файлы.
    for (const plan of writablePlans) {
      const temporaryPath = `${plan.outputPath}.tmp-${process.pid}-${randomUUID()}`;
      await mkdir(path.dirname(plan.outputPath), { recursive: true });
      await writeFile(temporaryPath, plan.output, { flag: 'wx' });
      temporaryFiles.push(temporaryPath);

      const temporaryMetadata = await sharp(temporaryPath).metadata();
      validateMetadata(
        temporaryMetadata,
        plan.profile,
        temporaryPath,
        expectedFormat(plan.profile),
      );
    }

    // Фаза 2: публикуем проверенные результаты. Исходники пока сохраняются.
    for (const [index, plan] of writablePlans.entries()) {
      if (plan.sourcePath !== plan.outputPath && await exists(plan.outputPath)) {
        throw new Error(`Результат появился во время записи: ${plan.profile.output}`);
      }
      await rename(temporaryFiles[index], plan.outputPath);
    }

    // Проверяем уже опубликованные файлы и только после этого удаляем PNG.
    for (const plan of writablePlans) {
      const outputMetadata = await sharp(plan.outputPath).metadata();
      validateMetadata(
        outputMetadata,
        plan.profile,
        plan.profile.output,
        expectedFormat(plan.profile),
      );
    }

    for (const plan of writablePlans) {
      if (plan.sourcePath !== plan.outputPath) {
        await unlink(plan.sourcePath);
      }
    }
  } catch (error) {
    await Promise.all(
      temporaryFiles.map((temporaryPath) => unlink(temporaryPath).catch(() => undefined)),
    );
    throw error;
  }
}

const optimizedCount = writablePlans.length;
const skippedCount = plans.length - optimizedCount;
const totalSavingPercent = totalBefore > 0
  ? ((1 - totalAfter / totalBefore) * 100).toFixed(1)
  : '0.0';

console.log('');
console.log(
  `Итого: ${formatBytes(totalBefore)} → ${formatBytes(totalAfter)} `
  + `(−${totalSavingPercent}%), оптимизировано ${optimizedCount}, пропущено ${skippedCount}.`,
);

if (!shouldWrite) {
  console.log('Это был dry-run. Для записи: npm run assets:optimize -- --write');
}
