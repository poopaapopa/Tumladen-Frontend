import React from 'react';
import { Group, Image } from 'react-konva';
import useImage from 'use-image';
import { TILE_IMAGES } from '../../api/tiles.config';

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

  return (
    <Group
      x={x * tileSize}
      y={y * tileSize}
      rotation={rotation}
      offsetX={tileSize / 2}
      offsetY={tileSize / 2}
      clipFunc={(ctx) => {
        const r = CORNER_RADIUS;
        const w = tileSize;
        const h = tileSize;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(w - r, 0);
        ctx.quadraticCurveTo(w, 0, w, r);
        ctx.lineTo(w, h - r);
        ctx.quadraticCurveTo(w, h, w - r, h);
        ctx.lineTo(r, h);
        ctx.quadraticCurveTo(0, h, 0, h - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
      }}
    >
      <Image
        image={image}
        width={tileSize}
        height={tileSize}
        x={0}
        y={0}
      />
    </Group>
  );
};