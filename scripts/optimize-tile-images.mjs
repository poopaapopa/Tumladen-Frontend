import { readdir, rename, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const TARGET_SIZE = 640;
const WEBP_QUALITY = 80;
const WEBP_EFFORT = 6;

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const tileDirectory = path.resolve(scriptDirectory, '../src/assets/tiles');
const shouldWrite = process.argv.includes('--write');

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MiB`;
};

const formatDimensions = ({ width, height }) => `${width ?? '?'}×${height ?? '?'}`;

const fileNames = (await readdir(tileDirectory))
  .filter((fileName) => fileName.toLowerCase().endsWith('.webp'))
  .sort((left, right) => left.localeCompare(right));

let totalBefore = 0;
let totalAfter = 0;
let optimizedCount = 0;
let skippedCount = 0;

console.log(
  `${shouldWrite ? 'Оптимизация' : 'Предпросмотр'}: ${fileNames.length} WebP-тайлов, ` +
  `максимум ${TARGET_SIZE}×${TARGET_SIZE}, quality ${WEBP_QUALITY}`,
);

for (const fileName of fileNames) {
  const inputPath = path.join(tileDirectory, fileName);
  const temporaryPath = `${inputPath}.tmp-${process.pid}`;
  const inputSize = (await stat(inputPath)).size;
  const inputMetadata = await sharp(inputPath).metadata();

  totalBefore += inputSize;

  if (
    (inputMetadata.width ?? 0) <= TARGET_SIZE &&
    (inputMetadata.height ?? 0) <= TARGET_SIZE
  ) {
    totalAfter += inputSize;
    skippedCount += 1;
    console.log(
      `  = ${fileName}: ${formatDimensions(inputMetadata)}, уже оптимизирован`,
    );
    continue;
  }

  const output = await sharp(inputPath)
    .resize({
      width: TARGET_SIZE,
      height: TARGET_SIZE,
      fit: 'inside',
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    })
    .webp({
      quality: WEBP_QUALITY,
      alphaQuality: 100,
      effort: WEBP_EFFORT,
      smartSubsample: true,
    })
    .toBuffer();

  const outputMetadata = await sharp(output).metadata();
  const outputSize = output.byteLength;

  if (outputSize >= inputSize) {
    totalAfter += inputSize;
    skippedCount += 1;
    console.log(
      `  = ${fileName}: новый файл не меньше исходного (${formatBytes(inputSize)})`,
    );
    continue;
  }

  if (shouldWrite) {
    try {
      await writeFile(temporaryPath, output);
      await rename(temporaryPath, inputPath);
    } catch (error) {
      await unlink(temporaryPath).catch(() => undefined);
      throw error;
    }
  }

  totalAfter += outputSize;
  optimizedCount += 1;
  const savingPercent = Math.round((1 - outputSize / inputSize) * 100);
  console.log(
    `  ${shouldWrite ? '✓' : '→'} ${fileName}: ` +
    `${formatDimensions(inputMetadata)} → ${formatDimensions(outputMetadata)}, ` +
    `${formatBytes(inputSize)} → ${formatBytes(outputSize)} (−${savingPercent}%)`,
  );
}

const totalSavingPercent = totalBefore > 0
  ? Math.round((1 - totalAfter / totalBefore) * 100)
  : 0;

console.log('');
console.log(
  `Итого: ${formatBytes(totalBefore)} → ${formatBytes(totalAfter)} ` +
  `(−${totalSavingPercent}%), оптимизировано ${optimizedCount}, пропущено ${skippedCount}.`,
);

if (!shouldWrite) {
  console.log('Это был dry-run. Для записи: npm run assets:tiles:optimize -- --write');
}
