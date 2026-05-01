import { useCallback, useEffect, useState } from 'react';
import type { LogEntry, MatchPlayer } from '../../../types/match';
import { getPlayerColorBySeat } from '../../../utils/playerColor.ts';

export const useMatchActionLog = (inviteCode?: string) => {
  const [actionLog, setActionLog] = useState<LogEntry[]>(() => {
    if (!inviteCode) {
      return [];
    }

    const saved = localStorage.getItem(`log_${inviteCode}`);
    if (!saved) {
      return [];
    }

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

  const addToLog = useCallback((text: string, actorId: string, players: MatchPlayer[], tileId?: string) => {
    const player = players.find((item) => item.actorId === actorId);
    const color = getPlayerColorBySeat(player?.seat);
    const nickname = player?.displayName || 'Неизвестный герой';

    const newEntry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      text,
      color,
      timestamp: new Date(),
      nickname,
      tileId,
    };

    setActionLog((prev) => {
      if (prev.length > 0 && prev[0].text === text && prev[0].nickname === nickname) {
        const diff = newEntry.timestamp.getTime() - prev[0].timestamp.getTime();
        if (diff < 1000) {
          return prev;
        }
      }

      return [newEntry, ...prev].slice(0, 50);
    });
  }, []);

  const clearLog = useCallback(() => {
    if (inviteCode) {
      localStorage.removeItem(`log_${inviteCode}`);
    }
    setActionLog([]);
  }, [inviteCode]);

  return {
    actionLog,
    addToLog,
    clearLog,
  };
};
