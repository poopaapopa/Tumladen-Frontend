import { useCallback, useEffect, useRef, useState } from 'react';
import type { RoomSocketStatus } from '@/api/ws';
import type {
  MatchStatePayload,
  MeepleType,
  Phase,
} from '@/types/match';
import type { MatchActionResultPayload } from '@/types/ws';

const STORAGE_VERSION = 1;
const RETRY_INTERVAL_MS = 1_500;

type SendMessage = (
  type: string,
  payload: Record<string, unknown>,
) => boolean;

interface PendingMatchActionBase {
  storageVersion: typeof STORAGE_VERSION;
  actionId: string;
  roomId: string;
  expectedMatchId: string;
  expectedTurnNumber: number;
  expectedPhase: Phase;
  expectedStateVersion: number;
  createdAt: number;
  deliveryStatus: 'queued' | 'accepted';
  acknowledgedStateVersion?: number;
}

export type PendingMatchAction = PendingMatchActionBase & (
  | {
      action: 'place_tile';
      payload: {
        roomId: string;
        x: number;
        y: number;
        rotation: number;
      };
      optimistic: {
        kind: 'tile';
        tileId: string;
      };
    }
  | {
      action: 'place_meeple';
      payload: {
        roomId: string;
        zoneId: string;
        meepleType: MeepleType;
      };
      optimistic: {
        kind: 'meeple';
        actorId: string;
        tileInstanceId: string;
        featureType: string;
        seat?: number;
      };
    }
  | {
      action: 'skip_meeple';
      payload: {
        roomId: string;
      };
      optimistic?: undefined;
    }
);

export type NewMatchAction =
  | Pick<Extract<PendingMatchAction, { action: 'place_tile' }>, 'action' | 'payload' | 'optimistic'>
  | Pick<Extract<PendingMatchAction, { action: 'place_meeple' }>, 'action' | 'payload' | 'optimistic'>
  | Pick<Extract<PendingMatchAction, { action: 'skip_meeple' }>, 'action' | 'payload'>;

export interface ReliableMatchActionsController {
  enqueue: (match: MatchStatePayload, action: NewMatchAction) => PendingMatchAction | null;
  handleResult: (result: MatchActionResultPayload) => void;
  reconcile: (match: MatchStatePayload) => void;
  discard: () => void;
}

interface UseReliableMatchActionsOptions {
  roomId?: string;
  actorId?: string;
  match: MatchStatePayload | null;
  connectionStatus: RoomSocketStatus;
  sendMessage: SendMessage;
}

const createActionId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const isStoredPendingAction = (value: unknown): value is PendingMatchAction => {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<PendingMatchAction>;
  const hasValidBase = candidate.storageVersion === STORAGE_VERSION
    && typeof candidate.actionId === 'string'
    && typeof candidate.roomId === 'string'
    && typeof candidate.expectedMatchId === 'string'
    && typeof candidate.expectedTurnNumber === 'number'
    && typeof candidate.expectedStateVersion === 'number'
    && typeof candidate.createdAt === 'number'
    && (candidate.expectedPhase === 'place_tile' || candidate.expectedPhase === 'place_meeple')
    && (candidate.deliveryStatus === 'queued' || candidate.deliveryStatus === 'accepted')
    && Boolean(candidate.payload && typeof candidate.payload === 'object');
  if (!hasValidBase) return false;

  const payload = candidate.payload as Record<string, unknown>;
  if (payload.roomId !== candidate.roomId) return false;

  if (candidate.action === 'place_tile') {
    const optimistic = candidate.optimistic as Record<string, unknown> | undefined;
    return typeof payload.x === 'number'
      && typeof payload.y === 'number'
      && typeof payload.rotation === 'number'
      && optimistic?.kind === 'tile'
      && typeof optimistic.tileId === 'string';
  }

  if (candidate.action === 'place_meeple') {
    const optimistic = candidate.optimistic as Record<string, unknown> | undefined;
    return typeof payload.zoneId === 'string'
      && (payload.meepleType === 'regular' || payload.meepleType === 'big')
      && optimistic?.kind === 'meeple'
      && typeof optimistic.actorId === 'string'
      && typeof optimistic.tileInstanceId === 'string'
      && typeof optimistic.featureType === 'string';
  }

  return candidate.action === 'skip_meeple';
};

const sendPendingAction = (
  action: PendingMatchAction,
  sendMessage: SendMessage,
): boolean => sendMessage('match_action', {
  actionId: action.actionId,
  roomId: action.roomId,
  action: action.action,
  expectedMatchId: action.expectedMatchId,
  expectedTurnNumber: action.expectedTurnNumber,
  expectedPhase: action.expectedPhase,
  expectedStateVersion: action.expectedStateVersion,
  payload: action.payload,
});

export const useReliableMatchActions = ({
  roomId,
  actorId,
  match,
  connectionStatus,
  sendMessage,
}: UseReliableMatchActionsOptions) => {
  const storageKey = roomId && actorId
    ? `pendingMatchAction:${roomId}:${actorId}`
    : null;
  const [pendingAction, setPendingAction] = useState<PendingMatchAction | null>(null);
  const pendingActionRef = useRef<PendingMatchAction | null>(null);

  const replacePendingAction = useCallback((next: PendingMatchAction | null) => {
    pendingActionRef.current = next;
    setPendingAction(next);

    if (!storageKey) return;
    try {
      if (next) localStorage.setItem(storageKey, JSON.stringify(next));
      else localStorage.removeItem(storageKey);
    } catch {
      // The in-memory queue still protects the current session when storage is unavailable.
    }
  }, [storageKey]);

  const clearPendingAction = useCallback((actionId?: string) => {
    const current = pendingActionRef.current;
    if (actionId && current?.actionId !== actionId) return;
    replacePendingAction(null);
  }, [replacePendingAction]);

  useEffect(() => {
    pendingActionRef.current = null;
    let storedAction: PendingMatchAction | null = null;

    if (storageKey) {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const stored: unknown = JSON.parse(raw);
          if (isStoredPendingAction(stored) && stored.roomId === roomId) {
            storedAction = stored;
          } else {
            localStorage.removeItem(storageKey);
          }
        }
      } catch {
        try {
          localStorage.removeItem(storageKey);
        } catch {
          // Storage may be unavailable in hardened browser modes.
        }
      }
    }

    pendingActionRef.current = storedAction;
    const hydrationTimer = window.setTimeout(
      () => setPendingAction(pendingActionRef.current),
      0,
    );
    return () => window.clearTimeout(hydrationTimer);
  }, [roomId, storageKey]);

  const enqueue = useCallback((
    currentMatch: MatchStatePayload,
    action: NewMatchAction,
  ): PendingMatchAction | null => {
    if (!roomId || !actorId || pendingActionRef.current || currentMatch.roomId !== roomId) {
      return null;
    }

    const base: PendingMatchActionBase = {
      storageVersion: STORAGE_VERSION,
      actionId: createActionId(),
      roomId,
      expectedMatchId: currentMatch.id,
      expectedTurnNumber: currentMatch.gameState.turnNumber,
      expectedPhase: currentMatch.gameState.phase,
      expectedStateVersion: currentMatch.gameState.version,
      createdAt: Date.now(),
      deliveryStatus: 'queued',
    };
    const pending = { ...base, ...action } as PendingMatchAction;
    replacePendingAction(pending);
    return pending;
  }, [actorId, replacePendingAction, roomId]);

  const handleResult = useCallback((result: MatchActionResultPayload) => {
    const current = pendingActionRef.current;
    if (!current || current.actionId !== result.actionId) return;

    if (result.status === 'accepted') {
      if (
        current.deliveryStatus === 'accepted'
        && current.acknowledgedStateVersion === result.stateVersion
      ) return;

      replacePendingAction({
        ...current,
        deliveryStatus: 'accepted',
        acknowledgedStateVersion: result.stateVersion,
      });
      return;
    }

    // A rejected command is reconciled from authoritative state. The player never
    // has to retry it manually or dismiss an action-level error.
    clearPendingAction(result.actionId);
    sendMessage('join_room', { roomId: current.roomId });
  }, [clearPendingAction, replacePendingAction, sendMessage]);

  const reconcile = useCallback((nextMatch: MatchStatePayload) => {
    const current = pendingActionRef.current;
    if (!current) return;

    if (
      nextMatch.id !== current.expectedMatchId
      || nextMatch.roomId !== current.roomId
      || nextMatch.status !== 'active'
    ) {
      clearPendingAction(current.actionId);
      return;
    }

    if (
      current.acknowledgedStateVersion !== undefined
      && nextMatch.gameState.version >= current.acknowledgedStateVersion
    ) {
      clearPendingAction(current.actionId);
      return;
    }

    const turnAdvanced = nextMatch.gameState.turnNumber !== current.expectedTurnNumber;
    const stateAdvanced = nextMatch.gameState.version > current.expectedStateVersion;

    if (current.action === 'place_tile') {
      const tileWasPlaced = nextMatch.gameState.board.tiles.some((tile) => (
        tile.x === current.payload.x
        && tile.y === current.payload.y
        && tile.tileId === current.optimistic.tileId
        && tile.rotation === current.payload.rotation
      ));
      if (tileWasPlaced || turnAdvanced || (stateAdvanced && nextMatch.gameState.phase !== 'place_tile')) {
        clearPendingAction(current.actionId);
      }
      return;
    }

    if (current.action === 'place_meeple') {
      const meepleWasPlaced = nextMatch.gameState.meeples.some((meeple) => (
        meeple.actorId === current.optimistic.actorId
        && meeple.tileInstanceId === current.optimistic.tileInstanceId
        && meeple.zoneId === current.payload.zoneId
      ));
      if (meepleWasPlaced || turnAdvanced || (stateAdvanced && nextMatch.gameState.phase !== 'place_meeple')) {
        clearPendingAction(current.actionId);
      }
      return;
    }

    if (turnAdvanced || (stateAdvanced && nextMatch.gameState.phase !== 'place_meeple')) {
      clearPendingAction(current.actionId);
    }
  }, [clearPendingAction]);

  useEffect(() => {
    if (match) reconcile(match);
  }, [match, reconcile]);

  const sendableActionId = pendingAction
    && match
    && match.id === pendingAction.expectedMatchId
    && match.roomId === pendingAction.roomId
    && match.status === 'active'
    && match.gameState.version === pendingAction.expectedStateVersion
    && match.gameState.turnNumber === pendingAction.expectedTurnNumber
    && match.gameState.phase === pendingAction.expectedPhase
      ? pendingAction.actionId
      : null;

  useEffect(() => {
    if (
      connectionStatus !== 'connected'
      || !sendableActionId
    ) {
      return;
    }

    const sendCurrent = () => {
      const current = pendingActionRef.current;
      if (current) sendPendingAction(current, sendMessage);
    };

    sendCurrent();
    const retryTimer = window.setInterval(sendCurrent, RETRY_INTERVAL_MS);
    return () => window.clearInterval(retryTimer);
  }, [connectionStatus, sendableActionId, sendMessage]);

  return {
    pendingAction,
    enqueue,
    handleResult,
    reconcile,
    discard: clearPendingAction,
  };
};
