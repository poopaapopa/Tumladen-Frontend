import React, { useEffect, useRef } from 'react';
import { Group, Image, Rect } from 'react-konva';
import type Konva from 'konva';
import useImage from 'use-image';
import { TILE_IMAGES } from '../../utils/tiles.config';

interface GameTileProps {
  tileId: string;
  x: number;
  y: number;
  rotation: number;
  tileSize: number;
  tileStep?: number;
  opacity?: number;
  highlightColor?: string;
  highlightDashed?: boolean;
  highlightFill?: string;
}

const GameTileComponent: React.FC<GameTileProps> = ({
  tileId, x, y, rotation, tileSize, tileStep, opacity = 1, highlightColor, highlightDashed, highlightFill
}) => {
  const step = tileStep ?? tileSize;
  const [image] = useImage(TILE_IMAGES[tileId]);
  const CORNER_RADIUS = 10;
  const BEVEL_SIZE = 4;

  const groupRef = useRef<Konva.Group | null>(null);

  // Растеризуем тяжёлое содержимое тайла (тень, клиппинг, градиенты) один раз
  // в offscreen-битмап. При drag/zoom Konva только blit'ит готовый битмап вместо
  // повторного пересчёта shadowBlur/clipFunc/градиентов на каждый кадр.
  useEffect(() => {
    const node = groupRef.current;
    if (!node) return;
    if (!image) return;

    // Запас под тень (shadowBlur=15 + shadowOffset 8) и обводки, чтобы не обрезалось.
    const PAD = 30;
    node.cache({
      x: -PAD,
      y: -PAD,
      width: tileSize + PAD * 2,
      height: tileSize + PAD * 2,
      // Кэш и так растеризуется в текущем pixelRatio слоя; ограничиваем сверху.
      pixelRatio: Math.min(
        typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
        2,
      ),
    });
    node.getLayer()?.batchDraw();

    return () => {
      node.clearCache();
    };
  }, [image, tileSize, rotation, highlightColor, highlightDashed, highlightFill, opacity]);

  return (
    <Group
      ref={groupRef}
      x={x * step}
      y={y * step}
      offsetX={tileSize / 2}
      offsetY={tileSize / 2}
      opacity={opacity}
      listening={false}
      perfectDrawEnabled={false}
      shadowForStrokeEnabled={false}
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
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
      />

      <Rect
        x={-1}
        y={-1}
        width={tileSize + 2}
        height={tileSize + 2}
        fill="#2c2c2c"
        cornerRadius={CORNER_RADIUS}
        listening={false}
        perfectDrawEnabled={false}
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
          x={tileSize / 2}
          y={tileSize / 2}
          rotation={rotation}
          offsetX={tileSize / 2}
          offsetY={tileSize / 2}
          width={tileSize}
          height={tileSize}
          listening={false}
          perfectDrawEnabled={false}
        />

        <Rect
          width={tileSize}
          height={tileSize}
          stroke="black"
          strokeWidth={BEVEL_SIZE * 2}
          opacity={0.2}
          cornerRadius={CORNER_RADIUS}
          listening={false}
          perfectDrawEnabled={false}
          shadowForStrokeEnabled={false}
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
          perfectDrawEnabled={false}
          shadowForStrokeEnabled={false}
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
        perfectDrawEnabled={false}
      />

      {highlightColor && (
        <Rect
          width={tileSize}
          height={tileSize}
          stroke={highlightColor}
          strokeWidth={4}
          dash={highlightDashed ? [10, 10] : undefined}
          fill={highlightFill}
          cornerRadius={CORNER_RADIUS}
          listening={false}
          perfectDrawEnabled={false}
          shadowForStrokeEnabled={false}
        />
      )}
    </Group>
  );
};

export const GameTile = React.memo(GameTileComponent);
GameTile.displayName = 'GameTile';
