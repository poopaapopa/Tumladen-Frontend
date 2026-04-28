import React, { useState } from 'react';
import { Group, Rect, Text } from 'react-konva';
import { GameTile } from '../tile/tile';

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
      {currentTileId && (
        <GameTile
          tileId={currentTileId}
          x={0}
          y={0}
          rotation={displayRotation}
          tileSize={TILE_SIZE}
          opacity={isPending ? 1 : 0.4}
        />
      )}
      <Rect
        width={TILE_SIZE}
        height={TILE_SIZE}
        offsetX={TILE_SIZE / 2}
        offsetY={TILE_SIZE / 2}
        stroke={isPending ? "#2f2f2f" : "#27AE60"}
        strokeWidth={4}
        dash={isPending ? [] : [10, 10]}
        cornerRadius={10}
        fill={isPending ? "" : "rgba(39, 174, 96, 0.1)"}
      />
      {isPending && hovered && (
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
          <Text
            text="↻"
            fontSize={TILE_SIZE * 1.25}
            fill="rgba(255, 255, 255, 0.75)"
            y={35}
            width={TILE_SIZE}
            height={TILE_SIZE}
            offsetX={TILE_SIZE / 2}
            offsetY={TILE_SIZE / 2}
            align="center"
            rotation={180}
            listening={false}
          />
        </>
      )}
    </Group>
  );
};
