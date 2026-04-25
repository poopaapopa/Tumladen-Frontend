import React, { useState, useMemo  } from 'react';
import { Stage, Layer, Group, Rect, Circle } from 'react-konva';
import Konva from 'konva';
import { GameTile } from '../tile/tile';
import type { Tile } from "./gameRoom.tsx";
import { getPlayerColorBySeat } from "../../utils/playerColor.ts";

interface Player {
  actorId: string;
  seat: number;
}

interface GameBoardProps {
  board: Tile[];
  validPlacements?: Array<{ x: number, y: number, rotations: number[] }>;
  onPlaceTile?: (x: number, y: number) => void;
  currentTileId?: string;

  phase?: string;
  validMeeplePlacements?: Array<{ zoneId: string, featureType: string }>;
  onPlaceMeeple?: (zoneId: string) => void;
  lastPlacedTile?: Tile | null;
  placedMeeples?: Array<{ tileInstanceId: string, zoneId: string, actorId: string, seat?: number }>;
  currentPlayerColor?: string;
  players?: Player[];
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  board = [],
  validPlacements = [], 
  onPlaceTile, 
  currentTileId,
  phase,
  validMeeplePlacements = [],
  onPlaceMeeple,
  lastPlacedTile,
  placedMeeples = [],
  players = []
}) => {
  const centerX = (window.innerWidth - 450) / 2;
  const centerY = (window.innerHeight - 70) / 2;

  const [stage, setStage] = useState({
    x: centerX,
    y: centerY,
    scale: 1
  });

  const tilesToRender = board.length === 0
    ? [{ tileId: '0', x: 0, y: 0, rotation: 0 }]
    : board;

  const MIN_SCALE = 0.3;
  const MAX_SCALE = 3.5;
  const TILE_SIZE = 150;

  const getZoneOffset = (zoneId: string) => {
    const offset = 40;
    if (zoneId.includes('top')) return { x: 0, y: -offset };
    if (zoneId.includes('bottom')) return { x: 0, y: offset };
    if (zoneId.includes('left')) return { x: -offset, y: 0 };
    if (zoneId.includes('right')) return { x: offset, y: 0 };
    return { x: 0, y: 0 };
  };

  const playerColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    players.forEach(p => {
      map[p.actorId] = getPlayerColorBySeat(p.seat);
    });
    return map;
  }, [players]);

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
        {/* 1. ТАЙЛЫ */}
        <Group>
          {tilesToRender.map((tile, index) => (
            <GameTile
              key={`tile-${index}-${tile.x}-${tile.y}`}
              tileId={tile.tileId}
              x={tile.x}
              y={tile.y}
              rotation={tile.rotation}
              tileSize={TILE_SIZE}
            />
          ))}
        </Group>

        {/* 2. УСТАНОВЛЕННЫЕ МИПЛЫ */}
        <Group>
          {placedMeeples.map((meeple, index) => {
            const tile = board.find(t => 'instanceId' in t && t.instanceId === meeple.tileInstanceId);
            if (!tile) return null;
            const offset = getZoneOffset(meeple.zoneId);

            const color = meeple.seat !== undefined 
              ? getPlayerColorBySeat(meeple.seat) 
              : (playerColorMap[meeple.actorId] || '#989898');
            return (
              <Circle
                key={`m-${index}`}
                x={tile.x * TILE_SIZE + offset.x}
                y={tile.y * TILE_SIZE + offset.y}
                radius={10}
                fill={color}
                stroke="white"
                strokeWidth={2}
                cursor="pointer"
              />
            );
          })}
        </Group>

        {/* 3. СЛОТЫ ДЛЯ МИПЛОВ */}
        {phase === 'place_meeple' && lastPlacedTile && (
          <Group x={lastPlacedTile.x * TILE_SIZE} y={lastPlacedTile.y * TILE_SIZE}>
            {validMeeplePlacements.map((slot, i) => {
              const offset = getZoneOffset(slot.zoneId);
              return (
                <Circle
                  key={`slot-${i}`}
                  x={offset.x}
                  y={offset.y}
                  radius={16}
                  fill="rgba(255, 255, 255, 0.4)"
                  stroke="white"
                  strokeWidth={2}
                  dash={[5, 5]}
                  onClick={() => onPlaceMeeple?.(slot.zoneId)}
                  onTap={() => onPlaceMeeple?.(slot.zoneId)}
                  cursor="pointer"
                />
              );
            })}
          </Group>
        )}

        {/* 4. ПОДСВЕТКА ДЛЯ НОВЫХ ТАЙЛОВ */}
        <Group>
          {validPlacements.map((pos, i) => (
            <Group 
              key={`v-${i}`}
              x={pos.x * TILE_SIZE}
              y={pos.y * TILE_SIZE}
              onClick={() => onPlaceTile?.(pos.x, pos.y)}
              onTap={() => onPlaceTile?.(pos.x, pos.y)}
            >
              {currentTileId && (
                <GameTile
                  tileId={currentTileId}
                  x={0}
                  y={0}
                  rotation={pos.rotations[0]} 
                  tileSize={TILE_SIZE}
                  opacity={0.4}
                />
              )}
              <Rect
                width={TILE_SIZE}
                height={TILE_SIZE}
                offsetX={TILE_SIZE / 2}
                offsetY={TILE_SIZE / 2}
                stroke="#27AE60"
                strokeWidth={5}
                dash={[10, 10]}
                cornerRadius={10}
                fill="rgba(39, 174, 96, 0.1)"
              />
            </Group>
          ))}
        </Group>
      </Layer>
    </Stage>
  );
};

export default GameBoard;