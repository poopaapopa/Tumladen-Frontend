import React, { useState } from 'react';
import { Group, Path, Rect } from 'react-konva';
import { GameTile } from './tile';
import { useIsMobile } from '@/hooks/useIsMobile';

const PLACEMENT_OUTLINE_COLOR = "#27AE60";
const PLACEMENT_FILL_COLOR = "rgba(39, 174, 96, 0.1)";
const PENDING_OUTLINE_COLOR = "#2f2f2f";

const ROTATE_CW_ICON_PATHS = [
  'M21 2v6h-6',
  'M3 12a9 9 0 0 1 15-6.7L21 8',
  'M3 22v-6h6',
  'M21 12a9 9 0 0 1-15 6.7L3 16',
];

interface PendingTileSlotProps {
  pos: { x: number; y: number; rotations: number[] };
  isPending: boolean;
  displayRotation: number;
  currentTileId?: string;
  TILE_SIZE: number;
  TILE_STEP: number;
  onPlaceTile?: (x: number, y: number) => void;
  onRotateTile?: (x: number, y: number, rotations: number[]) => void;
  setCursor: (cursor: string) => void;
}

export const PendingTileSlot: React.FC<PendingTileSlotProps> = ({
  pos, isPending, displayRotation, currentTileId, TILE_SIZE, TILE_STEP, onPlaceTile, onRotateTile, setCursor
}) => {
  const [hovered, setHovered] = useState(false);
  const isMobile = useIsMobile();

  const handleClick = () => {
    if (isPending) {
      onRotateTile?.(pos.x, pos.y, pos.rotations);
    } else {
      onPlaceTile?.(pos.x, pos.y);
    }
  };

  return (
    <Group
      x={pos.x * TILE_STEP}
      y={pos.y * TILE_STEP}
      onClick={handleClick}
      onTap={handleClick}
      onMouseEnter={() => { setCursor('pointer'); setHovered(true); }}
      onMouseLeave={() => { setCursor('default'); setHovered(false); }}
    >
      {/* Невидимая hit-область: дочерние GameTile/оверлеи имеют listening={false}
          (тайлы кэшируются в битмап), поэтому слоту нужен собственный приёмник
          событий для hover/click/tap размещения квадрата. */}
      <Rect
        width={TILE_SIZE}
        height={TILE_SIZE}
        offsetX={TILE_SIZE / 2}
        offsetY={TILE_SIZE / 2}
        cornerRadius={10}
        fill="transparent"
      />
      {currentTileId && (
        <GameTile
          tileId={currentTileId}
          x={0}
          y={0}
          rotation={displayRotation}
          tileSize={TILE_SIZE}
          opacity={isPending ? 1 : 0.4}
          highlightColor={isPending ? PENDING_OUTLINE_COLOR : PLACEMENT_OUTLINE_COLOR}
          highlightDashed={!isPending}
          highlightFill={isPending ? undefined : PLACEMENT_FILL_COLOR}
        />
      )}
      {isPending && (isMobile || hovered) && (
        <>
          <Rect
            width={TILE_SIZE}
            height={TILE_SIZE}
            offsetX={TILE_SIZE / 2}
            offsetY={TILE_SIZE / 2}
            cornerRadius={10}
            fill="rgba(0, 0, 0, 0.35)"
            listening={false}
          />
          <Group
            x={0}
            y={0}
            offsetX={12}
            offsetY={12}
            scaleX={TILE_SIZE / 36}
            scaleY={TILE_SIZE / 36}
            rotation={90}
            listening={false}
          >
            {ROTATE_CW_ICON_PATHS.map((data) => (
              <Path
                key={data}
                data={data}
                stroke="rgba(255, 255, 255, 0.75)"
                strokeWidth={2}
                lineCap="round"
                lineJoin="round"
              />
            ))}
          </Group>
        </>
      )}
    </Group>
  );
};
