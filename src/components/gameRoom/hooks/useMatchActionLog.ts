import { useCallback, useEffect, useState } from 'react';
import type { LogEntry, MatchPlayer, MatchStatePayload, PlacedMeeple } from '@/types/match';
import { getPlayerColorBySeat } from '@/utils/playerColor.ts';

type MatchAction =
  | { kind: 'tile_placed'; actorId: string; tileId?: string }
  | { kind: 'meeple_placed'; actorId: string; featureType: string; tileId?: string };

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
      return 'поставил тайл';
    case 'meeple_placed':
      return `поставил мипла ${describeFeature(action.featureType)}`;
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
      tileId: action.tileId,
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

      if (prevGs.phase === 'place_tile' && nextGs.phase === 'place_meeple') {
        pushEntry(
          {
            kind: 'tile_placed',
            actorId: prevGs.currentPlayerId,
            tileId: prevGs.currentTurn?.drawnTile?.tileId,
          },
          players,
        );
      }

      const newMeeple = findNewMeeple(prevGs.meeples, nextGs.meeples);
      if (newMeeple) {
        pushEntry(
          {
            kind: 'meeple_placed',
            actorId: newMeeple.actorId,
            featureType: newMeeple.featureType,
          },
          players,
        );
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
