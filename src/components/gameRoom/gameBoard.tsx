import React, { useState, useMemo, useRef } from 'react';
import { Stage, Layer, Group, Circle } from 'react-konva';
import Konva from 'konva';
import { GameTile } from '../tile/tile';
import type { Tile } from "./gameRoom.tsx";
import { getPlayerColorBySeat } from "../../utils/playerColor.ts";
import { PendingTileSlot } from './pendingTileSlot';
import { KonvaMeeple } from '../matchPlayerCard/meeple.tsx';

interface Player {
  actorId: string;
  seat: number;
}

interface GameBoardProps {
  board: Tile[];
  validPlacements?: Array<{ x: number, y: number, rotations: number[] }>;
  onPlaceTile?: (x: number, y: number) => void;
  onRotateTile?: (x: number, y: number, rotations: number[]) => void;
  currentTileId?: string;
  pendingPlacement?: { x: number; y: number; rotation: number } | null;
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
  onRotateTile,
  currentTileId,
  pendingPlacement,
  phase,
  validMeeplePlacements = [],
  onPlaceMeeple,
  lastPlacedTile,
  placedMeeples = [],
  players = []
}) => {
  const centerX = (window.innerWidth - 450) / 2;
  const centerY = (window.innerHeight - 70) / 2;

  const [stage, setStage] = useState({ x: centerX, y: centerY, scale: 1 });
  const stageRef = useRef<any>(null);

  const setCursor = (cursor: string) => {
    if (stageRef.current) {
      stageRef.current.container().style.cursor = cursor;
    }
  };

  const tilesToRender = board.length === 0
    ? [{ tileId: '0', x: 0, y: 0, rotation: 0 }]
    : board;

  const MIN_SCALE = 0.3;
  const MAX_SCALE = 3.5;
  const TILE_SIZE = 150;
  const TILE_STEP = 152;

  const getZoneOffset = (zoneId: string) => {
    const offset = 40;
    if (zoneId.includes('top'))    return { x: 0,       y: -offset };
    if (zoneId.includes('bottom')) return { x: 0,       y:  offset };
    if (zoneId.includes('left'))   return { x: -offset, y: 0       };
    if (zoneId.includes('right'))  return { x:  offset, y: 0       };
    return { x: 0, y: 0 };
  };

  const playerColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    players.forEach(p => { map[p.actorId] = getPlayerColorBySeat(p.seat); });
    return map;
  }, [players]);

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const s = e.target.getStage();
    if (!s) return;
    const oldScale = s.scaleX();
    const pointer = s.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - s.x()) / oldScale,
      y: (pointer.y - s.y()) / oldScale,
    };

    const scaleBy = 1.1;
    let newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
    if (newScale === oldScale) return;

    setStage({
      scale: newScale,
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  return (
    <Stage
      ref={stageRef}
      width={window.innerWidth - 450}
      height={window.innerHeight - 70}
      draggable
      x={stage.x}
      y={stage.y}
      scaleX={stage.scale}
      scaleY={stage.scale}
      onWheel={handleWheel}
      onDragStart={() => setCursor('grabbing')}
      onDragEnd={() => setCursor('default')}
      style={{ background: '#F5F5DC', cursor: 'default' }}
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
              tileStep={TILE_STEP}
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
              <KonvaMeeple
                key={`m-${index}`}
                x={tile.x * TILE_STEP + offset.x}
                y={tile.y * TILE_STEP + offset.y}
                color={color}
                variant="standing" 
                size={60}
              />
            );
          })}
        </Group>

        {/* 3. СЛОТЫ ДЛЯ МИПЛОВ */}
        {phase === 'place_meeple' && lastPlacedTile && (
          <Group x={lastPlacedTile.x * TILE_STEP} y={lastPlacedTile.y * TILE_STEP}>
            {validMeeplePlacements.map((slot, i) => {
              const offset = getZoneOffset(slot.zoneId);
              return (
                <Circle
                  key={`slot-${i}`}
                  x={offset.x}
                  y={offset.y}
                  radius={10}
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
          {validPlacements.map((pos, i) => {
            const isPending = pendingPlacement?.x === pos.x && pendingPlacement?.y === pos.y;
            const displayRotation = isPending ? pendingPlacement!.rotation : pos.rotations[0];
            return (
              <PendingTileSlot
                key={`v-${i}`}
                pos={pos}
                isPending={isPending}
                displayRotation={displayRotation}
                currentTileId={currentTileId}
                TILE_SIZE={TILE_SIZE}
                TILE_STEP={TILE_STEP}
                onPlaceTile={onPlaceTile}
                onRotateTile={onRotateTile}
                setCursor={setCursor}
              />
            );
          })}
        </Group>
      </Layer>
    </Stage>
  );
};

export default GameBoard;
