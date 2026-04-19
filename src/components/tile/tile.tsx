import React from 'react';
import { Group, Image, Rect } from 'react-konva';
import useImage from 'use-image';
import { TILE_IMAGES } from '../../utils/tiles.config';

interface GameTileProps {
  tileId: string;
  x: number;
  y: number;
  rotation: number;
  tileSize: number;
}

export const GameTile: React.FC<GameTileProps> = ({ tileId, x, y, rotation, tileSize }) => {
  const [image] = useImage(TILE_IMAGES[tileId]);
  const CORNER_RADIUS = 10;
  const BEVEL_SIZE = 4;

  return (
    <Group
      x={x * tileSize}
      y={y * tileSize}
      rotation={rotation}
      offsetX={tileSize / 2}
      offsetY={tileSize / 2}
    >
      <Rect
        width={tileSize}
        height={tileSize}
        cornerRadius={CORNER_RADIUS}
        fill="black"
        opacity={0.25}
        shadowBlur={15}
        shadowOffset={{ x: 8, y: 8 }}
        listening={false}
      />

      <Rect
        x={-1}
        y={-1}
        width={tileSize + 2}
        height={tileSize + 2}
        fill="#2c2c2c"
        cornerRadius={CORNER_RADIUS}
        listening={false}
      />

      <Group
        clipFunc={(ctx) => {
          const r = CORNER_RADIUS;
          const w = tileSize;
          const h = tileSize;
          ctx.beginPath();
          ctx.moveTo(r, 0); ctx.lineTo(w - r, 0); ctx.quadraticCurveTo(w, 0, w, r);
          ctx.lineTo(w, h - r); ctx.quadraticCurveTo(w, h, w - r, h);
          ctx.lineTo(r, h); ctx.quadraticCurveTo(0, h, 0, h - r);
          ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
          ctx.closePath();
        }}
      >
        <Image
          image={image}
          width={tileSize}
          height={tileSize}
        />

        <Rect
          width={tileSize}
          height={tileSize}
          stroke="black"
          strokeWidth={BEVEL_SIZE * 2}
          opacity={0.2}
          cornerRadius={CORNER_RADIUS}
          listening={false}
        />

        <Rect
          width={tileSize}
          height={tileSize}
          strokeLinearGradientStartPoint={{ x: 0, y: 0 }}
          strokeLinearGradientEndPoint={{ x: tileSize, y: tileSize }}
          strokeLinearGradientColorStops={[
            0, 'rgba(255, 255, 255, 0.6)',
            0.5, 'rgba(255, 255, 255, 0)',
            1, 'rgba(0, 0, 0, 0.4)'
          ]}
          strokeWidth={BEVEL_SIZE}
          cornerRadius={CORNER_RADIUS}
          listening={false}
        />
      </Group>

      <Rect
        width={tileSize}
        height={tileSize}
        cornerRadius={CORNER_RADIUS}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: tileSize, y: tileSize }}
        fillLinearGradientColorStops={[
          0, 'rgba(255, 255, 255, 0.05)',
          0.4, 'rgba(255, 255, 255, 0)',
          1, 'rgba(0, 0, 0, 0.05)'
        ]}
        listening={false}
      />
    </Group>
  );
};