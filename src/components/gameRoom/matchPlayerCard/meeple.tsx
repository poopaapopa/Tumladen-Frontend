import React from 'react';
import { Image as KonvaImage, Path as KonvaPath } from 'react-konva';

const PATH_DATA = "M256 54.99c-27 0-46.418 14.287-57.633 32.23-10.03 16.047-14.203 34.66-15.017 50.962-30.608 15.135-64.515 30.394-91.815 45.994-14.32 8.183-26.805 16.414-36.203 25.26C45.934 218.28 39 228.24 39 239.99c0 5 2.44 9.075 5.19 12.065 2.754 2.99 6.054 5.312 9.812 7.48 7.515 4.336 16.99 7.95 27.412 11.076 15.483 4.646 32.823 8.1 47.9 9.577-14.996 25.84-34.953 49.574-52.447 72.315C56.65 378.785 39 403.99 39 431.99c0 4-.044 7.123.31 10.26.355 3.137 1.256 7.053 4.41 10.156 3.155 3.104 7.017 3.938 10.163 4.28 3.146.345 6.315.304 10.38.304h111.542c8.097 0 14.026.492 20.125-3.43 6.1-3.92 8.324-9.275 12.67-17.275l.088-.16.08-.166s9.723-19.77 21.324-39.388c5.8-9.808 12.097-19.576 17.574-26.498 2.74-3.46 5.304-6.204 7.15-7.754.564-.472.82-.56 1.184-.76.363.2.62.288 1.184.76 1.846 1.55 4.41 4.294 7.15 7.754 5.477 6.922 11.774 16.69 17.574 26.498 11.6 19.618 21.324 39.387 21.324 39.387l.08.165.088.16c4.346 8 6.55 13.323 12.61 17.254 6.058 3.93 11.974 3.45 19.957 3.45H448c4 0 7.12.043 10.244-.304 3.123-.347 6.998-1.21 10.12-4.332 3.12-3.122 3.984-6.997 4.33-10.12.348-3.122.306-6.244.306-10.244 0-28-17.65-53.205-37.867-79.488-17.493-22.74-37.45-46.474-52.447-72.315 15.077-1.478 32.417-4.93 47.9-9.576 10.422-3.125 19.897-6.74 27.412-11.075 3.758-2.168 7.058-4.49 9.81-7.48 2.753-2.99 5.192-7.065 5.192-12.065 0-11.75-6.934-21.71-16.332-30.554-9.398-8.846-21.883-17.077-36.203-25.26-27.3-15.6-61.207-30.86-91.815-45.994-.814-16.3-4.988-34.915-15.017-50.96C302.418 69.276 283 54.99 256 54.99z";

type MeepleVariant = 'standing' | 'lying';

const VARIANT_CONFIG: Record<MeepleVariant, {
  viewBox: string;
  groupTransform?: string;
  layers: number;
  dx: number;
  dy: number;
}> = {
  lying: {
    viewBox: '-60 -20 650 590',
    layers: 8,
    dx: 5,
    dy: 7,
  },
  standing: {
    viewBox: '-150 -200 750 750',
    groupTransform: 'translate(256,512) skewX(12) translate(-256,-512)',
    layers: 18,
    dx: 5,
    dy: -10,
  },
};

interface MeepleProps {
  color: string;
  size?: number;
  className?: string;
  variant?: MeepleVariant;
}

export const Meeple3D: React.FC<MeepleProps> = ({ color, size = 40, className, variant = 'standing' }) => {
  const uid = React.useId().replace(/:/g, '');
  const shadowId = `shadow_${uid}`;
  const bevelId  = `bevel_${uid}`;
  const cfg = VARIANT_CONFIG[variant];

  const extrusionLayers = Array.from({ length: cfg.layers }, (_, i) => {
    const layer = cfg.layers - i;
    const brightness = 0.35 + (i / cfg.layers) * 0.38;
    return (
      <path
        key={layer}
        d={PATH_DATA}
        fill={color}
        style={{ filter: `brightness(${brightness})` }}
        transform={`translate(${layer * cfg.dx}, ${layer * cfg.dy})`}
      />
    );
  });

  const topFace = (
    <>
      <path d={PATH_DATA} fill={color} stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
      <path d={PATH_DATA} fill={`url(#${bevelId})`} pointerEvents="none" />
    </>
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox={cfg.viewBox}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="12" />
          <feOffset dx="0" dy="15" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.4" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={bevelId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.3" />
          <stop offset="50%" stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="black" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      <g filter={`url(#${shadowId})`}>
        {cfg.groupTransform ? (
          <g transform={cfg.groupTransform}>
            {extrusionLayers}
            {topFace}
          </g>
        ) : (
          <>
            {extrusionLayers}
            {topFace}
          </>
        )}
      </g>
    </svg>
  );
};

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
