import { useCallback, useEffect, useState } from 'react';
import type { LogEntry, MatchPlayer, MatchStatePayload, PlacedMeeple } from '@/types/match';
import { getPlayerColorBySeat } from '@/utils/playerColor.ts';
import { pluralizePoints } from '@/utils/pluralize.ts';

type MatchAction =
  | { kind: 'tile_placed'; actorId: string; tileId?: string }
  | { kind: 'meeple_placed'; actorId: string; featureType: string; tileId?: string }
  | { kind: 'score_gained'; actorId: string; delta: number };

const FEATURE_TYPE_LABELS: Record<string, string> = {
  city: 'в город',
  road: 'на дорогу',
  monastery: 'в монастырь',
  field: 'на поле',
};

const describeFeature = (featureType: string): string =>
  FEATURE_TYPE_LABELS[featureType] ?? `на ${featureType}`;

const buildText = (action: MatchAction): string => {
  switch (action.kind) {
    case 'tile_placed':
      return 'поставил квадрат';
    case 'meeple_placed':
      return `поставил подданного ${describeFeature(action.featureType)}`;
    case 'score_gained':
      return `получил ${action.delta} ${pluralizePoints(action.delta)}`;
  }
};

const findNewMeeple = (
  prev: PlacedMeeple[],
  next: PlacedMeeple[],
): PlacedMeeple | undefined => {
  if (next.length <= prev.length) return undefined;
  const prevKeys = new Set(prev.map((m) => `${m.tileInstanceId}:${m.zoneId}:${m.actorId}`));
  return next.find((m) => !prevKeys.has(`${m.tileInstanceId}:${m.zoneId}:${m.actorId}`));
};

export const useMatchActionLog = (inviteCode?: string) => {
  const [actionLog, setActionLog] = useState<LogEntry[]>(() => {
    if (!inviteCode) return [];

    const saved = localStorage.getItem(`log_${inviteCode}`);
    if (!saved) return [];

    try {
      const parsed = JSON.parse(saved);
      return parsed.map((entry: LogEntry) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      }));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (inviteCode && actionLog.length > 0) {
      localStorage.setItem(`log_${inviteCode}`, JSON.stringify(actionLog));
    }
  }, [actionLog, inviteCode]);

  const pushEntry = useCallback((action: MatchAction, players: MatchPlayer[]) => {
    const player = players.find((item) => item.actorId === action.actorId);
    const color = getPlayerColorBySeat(player?.seat);
    const nickname = player?.displayName || 'Неизвестный герой';
    const text = buildText(action);

    const newEntry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      text,
      color,
      timestamp: new Date(),
      nickname,
      tileId: 'tileId' in action ? action.tileId : undefined,
    };

    setActionLog((prev) => {
      if (prev.length > 0 && prev[0].text === text && prev[0].nickname === nickname) {
        const diff = newEntry.timestamp.getTime() - prev[0].timestamp.getTime();
        if (diff < 1000) return prev;
      }
      return [newEntry, ...prev].slice(0, 50);
    });
  }, []);

  const recordMatchUpdate = useCallback(
    (prev: MatchStatePayload | null, next: MatchStatePayload) => {
      if (!prev) return;

      const prevGs = prev.gameState;
      const nextGs = next.gameState;
      const players = prevGs.players;

      // Standard phase-change detection: current player placed a tile
      const phaseChangedToMeeple = prevGs.phase === 'place_tile' && nextGs.phase === 'place_meeple';
      if (phaseChangedToMeeple) {
        pushEntry(
          {
            kind: 'tile_placed',
            actorId: prevGs.currentPlayerId,
            tileId: prevGs.currentTurn?.drawnTile?.tileId,
          },
          players,
        );
      }

      // Detect consolidated bot turns via board diff + turn number jump.
      // When the server processes bot turns instantly, turnNumber jumps and
      // intermediate tile placements aren't captured by the phase-change above.
      const turnDelta = nextGs.turnNumber - prevGs.turnNumber;
      if (turnDelta > 1) {
        const numPlayers = players.length;
        const prevPlayerSeat = players.find((p) => p.actorId === prevGs.currentPlayerId)?.seat ?? 0;
        // Build seat→actorId lookup
        const playerBySeat = new Map(players.map((p) => [p.seat, p.actorId]));

        // Previous player's tile was already logged (either by phase-change above or in a prior update),
        // so we start from the next player in seat order.
        const startOffset = 1;

        // Diff the board to find new tiles
        const prevTileKeys = new Set(
          (prevGs.board?.tiles ?? []).map((t) => `${t.x}:${t.y}`)
        );
        const newBoardTiles = (nextGs.board?.tiles ?? []).filter(
          (t) => !prevTileKeys.has(`${t.x}:${t.y}`)
        );
        // Exclude the tile already attributed to the current turn's placedTile
        const currentPlacedTile = nextGs.currentTurn?.placedTile;
        const unattributedTiles = newBoardTiles.filter(
          (t) => !(currentPlacedTile && t.x === currentPlacedTile.x && t.y === currentPlacedTile.y)
        );

        // Only log intermediate turns if new tiles actually appeared on the board
        if (unattributedTiles.length > 0) {
          // Walk through intermediate turns and log tile placements with tileId
          const intermediateCount = Math.min(turnDelta - startOffset, unattributedTiles.length);
          for (let i = 0; i < intermediateCount; i++) {
            const seat = (prevPlayerSeat + startOffset + i) % numPlayers;
            const actorId = playerBySeat.get(seat);
            const tile = unattributedTiles[i];
            if (actorId) {
              pushEntry(
                { kind: 'tile_placed', actorId, tileId: tile?.tileId },
                players,
              );
            }
          }
        }
      }

      // Detect all new meeples (not just one) for consolidated bot turns
      const prevMeepleKeys = new Set(
        prevGs.meeples.map((m) => `${m.tileInstanceId}:${m.zoneId}:${m.actorId}`)
      );
      const newMeeples = nextGs.meeples.filter(
        (m) => !prevMeepleKeys.has(`${m.tileInstanceId}:${m.zoneId}:${m.actorId}`)
      );
      for (const meeple of newMeeples) {
        pushEntry(
          {
            kind: 'meeple_placed',
            actorId: meeple.actorId,
            featureType: meeple.featureType,
          },
          players,
        );
      }

      // Дельты очков по каждому игроку — фиксируем закрытие фич/финальный скоринг
      const prevScoreById = new Map(prevGs.players.map((p) => [p.actorId, p.score]));
      for (const np of nextGs.players) {
        const prevScore = prevScoreById.get(np.actorId) ?? np.score;
        const delta = np.score - prevScore;
        if (delta > 0) {
          pushEntry(
            { kind: 'score_gained', actorId: np.actorId, delta },
            nextGs.players,
          );
        }
      }
    },
    [pushEntry],
  );

  const clearLog = useCallback(() => {
    if (inviteCode) {
      localStorage.removeItem(`log_${inviteCode}`);
    }
    setActionLog([]);
  }, [inviteCode]);

  return {
    actionLog,
    recordMatchUpdate,
    clearLog,
  };
};
