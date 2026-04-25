import React, { useState } from 'react';
import { Stage, Layer, Group } from 'react-konva';
import Konva from 'konva';
import { GameTile } from '../tile/tile';
import type { Tile } from "./gameRoom.tsx";

interface GameBoardProps {
  board: Tile[];
}

const GameBoard: React.FC<GameBoardProps> = ({ board }) => {
  const centerX = (window.innerWidth - 450) / 2;
  const centerY = (window.innerHeight - 70) / 2;

  const [stage, setStage] = useState({
    x: centerX,
    y: centerY,
    scale: 1
  });

  const tiles = board.length === 0
    ? [{ tileId: '0', x: 0, y: 0, rotation: 90 }]
    : board;

  const MIN_SCALE = 0.3;
  const MAX_SCALE = 3.5;
  const TILE_SIZE = 150;

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const scaleBy = 1.1;
    let newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    if (newScale < MIN_SCALE) newScale = MIN_SCALE;
    if (newScale > MAX_SCALE) newScale = MAX_SCALE;

    if (newScale === oldScale) return;

    setStage({
      scale: newScale,
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  return (
    <Stage
      width={window.innerWidth - 450}
      height={window.innerHeight - 70}
      draggable
      x={stage.x}
      y={stage.y}
      scaleX={stage.scale}
      scaleY={stage.scale}
      onWheel={handleWheel}
      style={{ background: '#F5F5DC', cursor: 'grab' }}
    >
      <Layer>
        <Group>
          {tiles.map((tile, index) => (
            <GameTile
              key={`${tile.x}-${tile.y}-${index}`}
              tileId={tile.tileId}
              x={tile.x}
              y={tile.y}
              rotation={tile.rotation}
              tileSize={TILE_SIZE}
            />
          ))}
        </Group>
      </Layer>
    </Stage>
  );
};

export default GameBoard;