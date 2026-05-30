import { forwardRef, useImperativeHandle, useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Group } from 'react-konva';
import Konva from 'konva';

export interface GameBoardHandle {
  getStage: () => Konva.Stage | null;
  getTileStep: () => number;
}
import { GameTile } from './tile.tsx';
import type { Tile } from "./gameRoom.tsx";
import { getPlayerColorBySeat } from "@/utils/playerColor.ts";
import { PendingTileSlot } from './pendingTileSlot';
import { KonvaMeeple } from './matchPlayerCard/meeple.tsx';
import { MeepleSlot } from './meepleSlot.tsx';
import { getZoneOffset } from '@/utils/tileZones.ts';

interface Player {
  actorId: string;
  seat: number;
}

interface GameBoardProps {
  /** Width of the board container in pixels */
  width: number;
  /** Height of the board container in pixels */
  height: number;
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
  lastPlacedByPlayer?: Record<string, { x: number; y: number; color: string }>;
  placedMeeples?: Array<{ tileInstanceId: string, zoneId: string, actorId: string, seat?: number, featureType: string }>;
  players?: Player[];
}

/** Distance between two touch points */
function getTouchDistance(t1: Touch, t2: Touch): number {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Midpoint between two touch points */
function getTouchCenter(t1: Touch, t2: Touch): { x: number; y: number } {
  return {
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2,
  };
}

const GameBoard = forwardRef<GameBoardHandle, GameBoardProps>(({
  width,
  height,
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
  lastPlacedByPlayer = {},
  placedMeeples = [],
  players = [],
}, ref) => {
  const stageWidth = width || 800;
  const stageHeight = height || 600;

  const [stage, setStage] = useState({ x: stageWidth / 2, y: stageHeight / 2, scale: 1 });
  const stageRef = useRef<Konva.Stage | null>(null);
  const initializedRef = useRef(false);

  // Re-center when dimensions become available for the first time
  useEffect(() => {
    if (width > 0 && height > 0 && !initializedRef.current) {
      initializedRef.current = true;
      setStage((prev) => ({ ...prev, x: width / 2, y: height / 2 }));
    }
  }, [width, height]);

  useImperativeHandle(ref, () => ({
    getStage: () => stageRef.current,
    getTileStep: () => TILE_STEP,
  }), []);

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

  // --- Pinch-to-zoom support ---
  const lastPinchDistRef = useRef<number | null>(null);
  const lastPinchCenterRef = useRef<{ x: number; y: number } | null>(null);
  const isPinchingRef = useRef(false);

  const handleTouchMove = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    const touches = e.evt.touches;
    if (touches.length < 2) {
      lastPinchDistRef.current = null;
      lastPinchCenterRef.current = null;
      isPinchingRef.current = false;
      return;
    }

    e.evt.preventDefault();
    isPinchingRef.current = true;

    // Disable drag during pinch
    const s = stageRef.current;
    if (s) s.draggable(false);

    const dist = getTouchDistance(touches[0], touches[1]);
    const center = getTouchCenter(touches[0], touches[1]);

    if (lastPinchDistRef.current != null && lastPinchCenterRef.current != null) {
      const oldScale = stage.scale;
      const scaleFactor = dist / lastPinchDistRef.current;
      let newScale = oldScale * scaleFactor;
      newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));

      // Get the container rect to convert page coords to stage-local coords
      const containerRect = s?.container().getBoundingClientRect();
      const cx = center.x - (containerRect?.left ?? 0);
      const cy = center.y - (containerRect?.top ?? 0);

      const mousePointTo = {
        x: (cx - stage.x) / oldScale,
        y: (cy - stage.y) / oldScale,
      };

      setStage({
        scale: newScale,
        x: cx - mousePointTo.x * newScale,
        y: cy - mousePointTo.y * newScale,
      });
    }

    lastPinchDistRef.current = dist;
    lastPinchCenterRef.current = center;
  }, [stage.scale, stage.x, stage.y]);

  const handleTouchEnd = useCallback(() => {
    lastPinchDistRef.current = null;
    lastPinchCenterRef.current = null;
    if (isPinchingRef.current) {
      isPinchingRef.current = false;
      // Re-enable drag after pinch ends
      const s = stageRef.current;
      if (s) s.draggable(true);
    }
  }, []);

  return (
    <Stage
      ref={stageRef}
      width={stageWidth}
      height={stageHeight}
      draggable
      x={stage.x}
      y={stage.y}
      scaleX={stage.scale}
      scaleY={stage.scale}
      onWheel={handleWheel}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDragStart={() => setCursor('grabbing')}
      onDragEnd={() => setCursor('default')}
      style={{ background: '#F5F5DC', cursor: 'default', touchAction: 'none' }}
    >
      <Layer>
        {/* 1. КВАДРАТЫ */}
        <Group>
          {tilesToRender.map((tile, index) => {
            const highlight = Object.values(lastPlacedByPlayer).find(
              (info) => info.x === tile.x && info.y === tile.y
            );
            return (
              <GameTile
                key={`tile-${index}-${tile.x}-${tile.y}`}
                tileId={tile.tileId}
                x={tile.x}
                y={tile.y}
                rotation={tile.rotation}
                tileSize={TILE_SIZE}
                tileStep={TILE_STEP}
                highlightColor={highlight?.color}
              />
            );
          })}
        </Group>

        {/* 2. СЛОТЫ ДЛЯ ПОДДАННЫХ */}
        {phase === 'place_meeple' && lastPlacedTile && (
          <Group x={lastPlacedTile.x * TILE_STEP} y={lastPlacedTile.y * TILE_STEP}>
            {validMeeplePlacements.map((slot, i) => {
              const offset = getZoneOffset(lastPlacedTile.tileId, slot.zoneId, lastPlacedTile.rotation);
              return (
                <MeepleSlot
                  key={`slot-${i}`}
                  x={offset.x}
                  y={offset.y}
                  color={'black'}
                  onClick={() => onPlaceMeeple?.(slot.zoneId)}
                  onMouseEnter={() => setCursor('pointer')}
                  onMouseLeave={() => setCursor('default')}
                />
              );
            })}
          </Group>
        )}

        {/* 3. ПОДСВЕТКА ДЛЯ НОВЫХ КВАДРАТОВ */}
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

        {/* 4. УСТАНОВЛЕННЫЕ ПОДДАННЫЕ: последними, чтобы лежали поверх квадратов и подсветок */}
        <Group listening={false}>
          {placedMeeples.map((meeple, index) => {
            const tile = board.find(t => 'instanceId' in t && t.instanceId === meeple.tileInstanceId);
            if (!tile) return null;
            const offset = getZoneOffset(tile.tileId, meeple.zoneId, tile.rotation);
            const color = meeple.seat !== undefined
              ? getPlayerColorBySeat(meeple.seat)
              : (playerColorMap[meeple.actorId] || '#989898');
            return (
              <KonvaMeeple
                key={`m-${index}`}
                x={tile.x * TILE_STEP + offset.x}
                y={tile.y * TILE_STEP + offset.y}
                color={color}
                variant={meeple.featureType === 'field' ? 'lying' : 'standing'}
                size={55}
              />
            );
          })}
        </Group>
      </Layer>
    </Stage>
  );
});

GameBoard.displayName = 'GameBoard';

export default GameBoard;
