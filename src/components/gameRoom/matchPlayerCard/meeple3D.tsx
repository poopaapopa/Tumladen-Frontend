import React from 'react';
import {
  MEEPLE_PATH_DATA,
  MEEPLE_VARIANT_CONFIG,
  type MeepleVariant,
} from './meepleGeometry';

interface MeepleProps {
  color: string;
  size?: number;
  className?: string;
  variant?: MeepleVariant;
}

export const Meeple3D: React.FC<MeepleProps> = ({
  color,
  size = 40,
  className,
  variant = 'standing',
}) => {
  const uid = React.useId().replace(/:/g, '');
  const shadowId = `shadow_${uid}`;
  const bevelId = `bevel_${uid}`;
  const cfg = MEEPLE_VARIANT_CONFIG[variant];

  const extrusionLayers = Array.from({ length: cfg.layers }, (_, i) => {
    const layer = cfg.layers - i;
    const brightness = 0.35 + (i / cfg.layers) * 0.38;
    return (
      <path
        key={layer}
        d={MEEPLE_PATH_DATA}
        fill={color}
        style={{ filter: `brightness(${brightness})` }}
        transform={`translate(${layer * cfg.dx}, ${layer * cfg.dy})`}
      />
    );
  });

  const topFace = (
    <>
      <path d={MEEPLE_PATH_DATA} fill={color} stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
      <path d={MEEPLE_PATH_DATA} fill={`url(#${bevelId})`} pointerEvents="none" />
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
