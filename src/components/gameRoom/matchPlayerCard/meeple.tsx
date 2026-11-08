import React from 'react';
import { Image as KonvaImage, Path as KonvaPath } from 'react-konva';
import { Meeple3D } from './meeple3D';
import {
  MEEPLE_PATH_DATA as PATH_DATA,
  MEEPLE_VARIANT_CONFIG as VARIANT_CONFIG,
  type MeepleVariant,
} from './meepleGeometry';

export { Meeple3D };

export const KonvaMeeple: React.FC<{ x: number; y: number; color: string; size?: number; variant: MeepleVariant }> = ({
  x, y, color, variant, size = 28
}) => {
  const { image, hasError } = useMeepleImage(color, variant);

  if (!image) {
    if (!hasError) return null;

    const scale = size / 512;
    return (
      <KonvaPath
        data={PATH_DATA}
        x={x}
        y={y}
        offsetX={256}
        offsetY={256}
        scaleX={scale}
        scaleY={scale}
        fill={color}
        stroke="rgba(255,255,255,0.85)"
        strokeWidth={10}
        listening={false}
      />
    );
  }

  return (
    <KonvaImage
      image={image}
      x={x - size / 2}
      y={y - size / 2}
      width={size}
      height={size}
    />
  );
};

function parseColor(color: string): [number, number, number] {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return [d[0], d[1], d[2]];
}

function brightenColor(color: string, brightness: number): string {
  const [r, g, b] = parseColor(color);
  const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v * brightness)));
  return `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`;
}

function buildMeepleSvgUrl(color: string, variant: MeepleVariant = 'lying'): string {
  const cfg = VARIANT_CONFIG[variant];

  const extrusionPaths = Array.from({ length: cfg.layers }, (_, i) => {
    const layer = cfg.layers - i;
    const brightness = 0.35 + (i / cfg.layers) * 0.38;
    const fill = brightenColor(color, brightness);
    return `<path d="${PATH_DATA}" fill="${fill}" transform="translate(${layer * cfg.dx},${layer * cfg.dy})"/>`;
  }).join('');

  const innerContent = `
    ${extrusionPaths}
    <path d="${PATH_DATA}" fill="${color}" stroke="rgba(0,0,0,0.1)" stroke-width="2"/>
    <path d="${PATH_DATA}" fill="url(#bevel)"/>
  `;

  const groupContent = cfg.groupTransform
    ? `<g transform="${cfg.groupTransform}">${innerContent}</g>`
    : innerContent;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${cfg.viewBox}">
  <defs>
    <linearGradient id="bevel" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="white" stop-opacity="0.3"/>
      <stop offset="50%" stop-color="white" stop-opacity="0"/>
      <stop offset="100%" stop-color="black" stop-opacity="0.2"/>
    </linearGradient>
  </defs>
  ${groupContent}
</svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

const meepleImageCache = new Map<string, HTMLImageElement>();
const meepleImageRequests = new Map<string, Promise<HTMLImageElement>>();
const meepleImageListeners = new Map<string, Set<(image: HTMLImageElement) => void>>();

const getMeepleImageKey = (color: string, variant: MeepleVariant) => (
  `${color}:${variant}`
);

const publishMeepleImage = (key: string, image: HTMLImageElement) => {
  for (const listener of meepleImageListeners.get(key) ?? []) {
    listener(image);
  }
};

const subscribeToMeepleImage = (key: string, listener: (image: HTMLImageElement) => void) => {
  const listeners = meepleImageListeners.get(key) ?? new Set();
  listeners.add(listener);
  meepleImageListeners.set(key, listeners);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) meepleImageListeners.delete(key);
  };
};

const loadMeepleImage = (color: string, variant: MeepleVariant) => {
  const key = getMeepleImageKey(color, variant);
  const cached = meepleImageCache.get(key);
  if (cached) return Promise.resolve(cached);

  const pending = meepleImageRequests.get(key);
  if (pending) return pending;

  const request = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load meeple image: ${key}`));
    image.src = buildMeepleSvgUrl(color, variant);
  });

  meepleImageRequests.set(key, request);
  void request.then(
    (image) => {
      meepleImageCache.set(key, image);
      publishMeepleImage(key, image);
      if (meepleImageRequests.get(key) === request) meepleImageRequests.delete(key);
    },
    () => {
      if (meepleImageRequests.get(key) === request) meepleImageRequests.delete(key);
    },
  );

  return request;
};

export const MeepleImagePreloader: React.FC<{ colors: string[] }> = ({ colors }) => {
  const colorKey = [...new Set(colors)].sort().join('|');

  React.useEffect(() => {
    for (const color of colorKey.split('|').filter(Boolean)) {
      void loadMeepleImage(color, 'standing').catch(() => undefined);
      void loadMeepleImage(color, 'lying').catch(() => undefined);
    }
  }, [colorKey]);

  return null;
};

interface MeepleImageState {
  key: string;
  image: HTMLImageElement | null;
  hasError: boolean;
}

function useMeepleImage(color: string, variant: MeepleVariant): Pick<MeepleImageState, 'image' | 'hasError'> {
  const key = getMeepleImageKey(color, variant);
  const [imageState, setImageState] = React.useState<MeepleImageState>(() => ({
    key,
    image: meepleImageCache.get(key) ?? null,
    hasError: false,
  }));

  React.useEffect(() => {
    let cancelled = false;
    let retryTimeout: number | undefined;

    const acceptImage = (image: HTMLImageElement) => {
      if (!cancelled) setImageState({ key, image, hasError: false });
    };
    const unsubscribe = subscribeToMeepleImage(key, acceptImage);

    const load = (attempt: number) => {
      void loadMeepleImage(color, variant).then(acceptImage).catch(() => {
        if (cancelled) return;

        setImageState({ key, image: null, hasError: true });
        if (attempt < 2) {
          retryTimeout = window.setTimeout(() => load(attempt + 1), 250 * (attempt + 1));
        }
      });
    };

    load(0);

    return () => {
      cancelled = true;
      unsubscribe();
      if (retryTimeout !== undefined) window.clearTimeout(retryTimeout);
    };
  }, [color, key, variant]);

  if (imageState.key !== key) return { image: null, hasError: false };
  return imageState;
}
