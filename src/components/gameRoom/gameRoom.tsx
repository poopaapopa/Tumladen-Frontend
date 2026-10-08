import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Hourglass, WifiOff } from 'lucide-react';
import {
  preloadTileImages,
  scheduleGameTilePreload,
} from '@/utils/tiles.config';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './gameRoom.module.scss';
import sidebarstyles from '../mainPage/MainPage.module.scss';
import { useContainerSize } from '@/hooks/useContainerSize';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useRoomSocket } from '@/api/ws';
import type { MatchFinishedPayload, WebSocketMessage } from '@/types/ws';
import {
  type FeatureScoredEvent,
  type MatchEvent,
  type MatchStatePayload,
  type MeepleType,
  type PlacedMeeple,
  type PrivateState,
  type SidebarPlayer,
} from '@/types/match';
import type { RoomResponse } from '@/types/room';
import { roomService } from '@/api/room';
import { useUserStore } from '@/store/useUserStore';
import { getPlayerColorBySeat } from '@/utils/playerColor.ts';
import Modal from '../modal/modal';
import gameExitImage from '@/assets/gameExit.png';
import GameBoard, { type GameBoardHandle } from './gameBoard.tsx';
import { ConfirmModal } from '../confirmModal/confirmModal.tsx';
import { MatchResultModal } from './matchResult/matchResult.tsx';
import { GameRoomSidebar } from './gameRoomSidebar.tsx';
import { CurrentTurnPanel } from './turnPanel/currentTurnPanel.tsx';
import {
  FinalScoringPanel,
} from './finalScoringPanel';
import { GameActionLog } from './latestActions/gameActionLog.tsx';
import { useTurnTimer } from './hooks/useTurnTimer.ts';
import {
  MeepleFlightLayer,
  FLIGHT_DURATION_MS,
  type MeepleFlight,
} from './meepleFlight/meepleFlight.tsx';
import { getZoneOffset } from '@/utils/tileZones.ts';
import {
  getScoreEventDisplayMs,
  getScoreEventMeepleReturnDelayMs,
} from './scoreEventTiming.ts';
import { GameLoadingScreen, type GameLoadingStage } from './gameLoadingScreen/gameLoadingScreen.tsx';
import {
  useReliableMatchActions,
  type ReliableMatchActionsController,
} from './hooks/useReliableMatchActions.ts';

export type { Tile, MatchStatePayload, PrivateState } from '@/types/match';

const isFeatureScoredEvent = (event: MatchEvent): event is FeatureScoredEvent =>
  event.type === 'feature_scored';

const CRITICAL_ASSET_WAIT_TIMEOUT_MS = 12_000;
const LEAVE_MATCH_FALLBACK_TIMEOUT_MS = 4_000;

const getAvailableMeepleType = (
  preferredType: MeepleType,
  regularMeeplesLeft: number,
  bigMeeplesLeft: number,
): MeepleType => {
  if (preferredType === 'regular' && regularMeeplesLeft <= 0 && bigMeeplesLeft > 0) {
    return 'big';
  }
  if (preferredType === 'big' && bigMeeplesLeft <= 0 && regularMeeplesLeft > 0) {
    return 'regular';
  }
  return preferredType;
};

const getInitialMatchTileIds = (match: MatchStatePayload): string[] => {
  const tileIds = new Set(
    match.gameState.board.tiles.map((tile) => tile.tileId),
  );
  tileIds.add('start_tile');

  const drawnTileId = match.gameState.currentTurn?.drawnTile?.tileId;
  if (drawnTileId) tileIds.add(drawnTileId);

  return [...tileIds];
};

const finishedPayloadFromMatchState = (
  match: MatchStatePayload,
): MatchFinishedPayload | null => {
  if (
    match.status !== 'finished'
    || (!match.result && !match.terminationReason)
  ) return null;

  return {
    matchId: match.id,
    roomId: match.roomId,
    winners: match.result?.winners ?? [],
    finalScores: match.result?.finalScores ?? [],
    terminationReason: match.terminationReason ?? 'normal_completion',
    terminatedByActorId: match.terminatedByActorId,
    terminatedAt: match.terminatedAt,
  };
};

interface PendingMeepleCounts {
  regular: number;
  big: number;
}

interface LaunchMeepleFlightOptions {
  trackInventory?: boolean;
  onComplete?: () => void;
}

type MobileInfoPanel = 'actions' | null;

const GameRoom = () => {
  const { id: inviteCode } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.actor);
  const isMobile = useIsMobile();

  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [match, setMatch] = useState<MatchStatePayload | null>(null);
  const matchRef = useRef<MatchStatePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialTileIds, setInitialTileIds] = useState<string[] | null>(null);
  const [areInitialAssetsReady, setAreInitialAssetsReady] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isRoomDeleted, setIsRoomDeleted] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchFinishedPayload | null>(null);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [mobileInfoPanel, setMobileInfoPanel] = useState<MobileInfoPanel>(null);
  const [showConnectionBanner, setShowConnectionBanner] = useState(false);
  const [pendingMatchResult, setPendingMatchResult] = useState<MatchFinishedPayload | null>(null);
  const [privateState, setPrivateState] = useState<PrivateState | null>(null);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [pendingPlacement, setPendingPlacement] = useState<{ x: number; y: number; rotation: number } | null>(null);
  const [selectedMeepleType, setSelectedMeepleType] = useState<MeepleType>('regular');
  const bufferedPrivateStateRef = useRef<PrivateState | null>(null);
  const reliableMatchActionsRef = useRef<ReliableMatchActionsController | null>(null);
  const handledFinishedMatchIdRef = useRef<string | null>(null);
  const [scoreEventQueue, setScoreEventQueue] = useState<FeatureScoredEvent[]>([]);
  const scoreEventQueueRef = useRef<FeatureScoredEvent[]>([]);
  const [finalScoreEvents, setFinalScoreEvents] = useState<FeatureScoredEvent[]>([]);
  const [departedScoreEventIds, setDepartedScoreEventIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [arrivedScoreEventIds, setArrivedScoreEventIds] = useState<Set<string>>(
    () => new Set(),
  );
  const seenScoreEventIdsRef = useRef<Set<string>>(new Set());
  const launchedScoreFlightEventIdsRef = useRef<Set<string>>(new Set());
  const scoreAnimationDeadlineRef = useRef(0);
  const matchResultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveMatchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLeavingMatchRef = useRef(false);
  const skipFinalScoringRef = useRef(false);
  const { timeLeft, setTurnDeadline } = useTurnTimer(match?.status === 'active');

  // Measure board container for responsive Stage sizing
  const { width: boardWidth, height: boardHeight, ref: boardContainerRef } = useContainerSize();

  // Анимация возврата подданых
  const boardHandleRef = useRef<GameBoardHandle | null>(null);
  const playerCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [flights, setFlights] = useState<MeepleFlight[]>([]);
  const [pendingMeeples, setPendingMeeples] = useState<
    Record<string, PendingMeepleCounts>
  >({});
  const flightTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const registerPlayerCardRef = useCallback(
    (actorId: string, el: HTMLDivElement | null) => {
      if (el) playerCardRefs.current.set(actorId, el);
      else playerCardRefs.current.delete(actorId);
    },
    [],
  );

  const launchMeepleFlights = useCallback((
    removed: PlacedMeeple[],
    boardTiles: { tileId: string; x: number; y: number; rotation: number; instanceId?: string }[],
    options: LaunchMeepleFlightOptions = {},
  ) => {
    const { trackInventory = true, onComplete } = options;
    if (isMobile || removed.length === 0) {
      onComplete?.();
      return;
    }

    const stage = boardHandleRef.current?.getStage();
    const tileStep = boardHandleRef.current?.getTileStep() ?? 152;
    if (!stage) {
      onComplete?.();
      return;
    }

    const containerRect = stage.container().getBoundingClientRect();
    const sx = stage.x();
    const sy = stage.y();
    const scale = stage.scaleX();

    const newFlights: MeepleFlight[] = [];
    const pendingDelta: Record<string, PendingMeepleCounts> = {};

    removed.forEach((m, idx) => {
      const tile = boardTiles.find((t) => t.instanceId && t.instanceId === m.tileInstanceId);
      if (!tile) return;
      const offset = getZoneOffset(tile.tileId, m.zoneId, tile.rotation);
      const localX = tile.x * tileStep + offset.x;
      const localY = tile.y * tileStep + offset.y;
      const startX = containerRect.left + sx + localX * scale;
      const startY = containerRect.top + sy + localY * scale;

      const cardEl = playerCardRefs.current.get(m.actorId);
      if (!cardEl) return;
      const cardRect = cardEl.getBoundingClientRect();
      const endX = cardRect.left + cardRect.width / 2;
      const endY = cardRect.top + cardRect.height / 2;

      const color = m.seat !== undefined
        ? getPlayerColorBySeat(m.seat)
        : '#989898';

      newFlights.push({
        id: `${m.tileInstanceId}-${m.zoneId}-${m.actorId}-${Date.now()}-${idx}`,
        startX,
        startY,
        endX,
        endY,
        color,
        variant: m.featureType === 'field' ? 'lying' : 'standing',
      });
      const meepleType = m.meepleType === 'big' ? 'big' : 'regular';
      const actorDelta = pendingDelta[m.actorId] ?? { regular: 0, big: 0 };
      actorDelta[meepleType] += 1;
      pendingDelta[m.actorId] = actorDelta;
    });

    if (newFlights.length === 0) {
      onComplete?.();
      return;
    }

    setFlights((prev) => [...prev, ...newFlights]);
    if (trackInventory) {
      setPendingMeeples((prev) => {
        const next = { ...prev };
        for (const [aid, delta] of Object.entries(pendingDelta)) {
          const current = next[aid] ?? { regular: 0, big: 0 };
          next[aid] = {
            regular: current.regular + delta.regular,
            big: current.big + delta.big,
          };
        }
        return next;
      });
    }

    const ids = newFlights.map((f) => f.id);
    const timeout = setTimeout(() => {
      setFlights((prev) => prev.filter((f) => !ids.includes(f.id)));
      if (trackInventory) {
        setPendingMeeples((prev) => {
          const next = { ...prev };
          for (const [aid, delta] of Object.entries(pendingDelta)) {
            const current = next[aid] ?? { regular: 0, big: 0 };
            const remaining = {
              regular: Math.max(0, current.regular - delta.regular),
              big: Math.max(0, current.big - delta.big),
            };
            if (remaining.regular === 0 && remaining.big === 0) {
              delete next[aid];
            } else {
              next[aid] = remaining;
            }
          }
          return next;
        });
      }
      onComplete?.();
      flightTimeoutsRef.current.delete(timeout);
    }, FLIGHT_DURATION_MS);
    flightTimeoutsRef.current.add(timeout);
  }, [isMobile]);

  const clearFlights = useCallback(() => {
    flightTimeoutsRef.current.forEach((t) => clearTimeout(t));
    flightTimeoutsRef.current.clear();
    setFlights([]);
    setPendingMeeples({});
  }, []);

  const enqueueScoreEvents = useCallback((events: MatchEvent[] | undefined) => {
    const unseen = (events ?? [])
      .filter(isFeatureScoredEvent)
      .filter((event) => {
        if (seenScoreEventIdsRef.current.has(event.id)) return false;
        seenScoreEventIdsRef.current.add(event.id);
        return true;
      });
    if (unseen.length === 0) return;

    const nextQueue = [...scoreEventQueueRef.current, ...unseen];
    scoreEventQueueRef.current = nextQueue;
    setScoreEventQueue(nextQueue);
    scoreAnimationDeadlineRef.current = Math.max(
      Date.now(),
      scoreAnimationDeadlineRef.current,
    ) + unseen.reduce(
      (total, event) => total + getScoreEventDisplayMs(event),
      0,
    );
  }, []);

  const stopScorePlayback = useCallback(() => {
    scoreEventQueueRef.current = [];
    setScoreEventQueue([]);
    setDepartedScoreEventIds(new Set());
    setArrivedScoreEventIds(new Set());
    launchedScoreFlightEventIdsRef.current.clear();
    scoreAnimationDeadlineRef.current = 0;
    if (matchResultTimeoutRef.current) {
      clearTimeout(matchResultTimeoutRef.current);
      matchResultTimeoutRef.current = null;
    }
  }, []);

  const clearScoreEvents = useCallback(() => {
    stopScorePlayback();
    setFinalScoreEvents([]);
    seenScoreEventIdsRef.current.clear();
    skipFinalScoringRef.current = false;
    setPendingMatchResult(null);
    setIsCelebrationOpen(false);
    setMobileInfoPanel(null);
  }, [stopScorePlayback]);

  const showMatchResult = useCallback((payload: MatchFinishedPayload) => {
    stopScorePlayback();
    clearFlights();
    skipFinalScoringRef.current = false;
    setPendingMatchResult(null);
    setMatchResult(payload);
    setIsCelebrationOpen(true);
    setMobileInfoPanel(null);
  }, [clearFlights, stopScorePlayback]);

  const handleFinishedMatch = useCallback((payload: MatchFinishedPayload) => {
    if (handledFinishedMatchIdRef.current === payload.matchId) return;
    handledFinishedMatchIdRef.current = payload.matchId;

    reliableMatchActionsRef.current?.discard();

    if (payload.terminationReason === 'normal_completion') {
      if (skipFinalScoringRef.current) {
        showMatchResult(payload);
      } else {
        setPendingMatchResult(payload);
      }
      return;
    }

    clearFlights();
    clearScoreEvents();
    setIsRoomDeleted(true);
  }, [clearFlights, clearScoreEvents, showMatchResult]);

  const resetMatchScopedUI = useCallback(() => {
    reliableMatchActionsRef.current?.discard();
    handledFinishedMatchIdRef.current = null;
    bufferedPrivateStateRef.current = null;
    clearFlights();
    clearScoreEvents();
    setMatchResult(null);
    setIsRoomDeleted(false);
    setInitialTileIds(null);
    setAreInitialAssetsReady(false);
    setPrivateState(null);
    setCurrentRotation(0);
    setPendingPlacement(null);
    setSelectedMeepleType('regular');
  }, [clearFlights, clearScoreEvents]);

  const handleSkipFinalScoring = useCallback(() => {
    skipFinalScoringRef.current = true;
    stopScorePlayback();
    clearFlights();
    if (pendingMatchResult) {
      showMatchResult(pendingMatchResult);
    }
  }, [clearFlights, pendingMatchResult, showMatchResult, stopScorePlayback]);

  const activeScoreEvent = scoreEventQueue[0];

  useEffect(() => {
    if (!activeScoreEvent) return;
    const timeout = setTimeout(() => {
      const nextQueue = scoreEventQueueRef.current[0]?.id === activeScoreEvent.id
        ? scoreEventQueueRef.current.slice(1)
        : scoreEventQueueRef.current.filter(
            (event) => event.id !== activeScoreEvent.id,
          );
      scoreEventQueueRef.current = nextQueue;
      setScoreEventQueue(nextQueue);
    }, getScoreEventDisplayMs(activeScoreEvent));
    return () => clearTimeout(timeout);
  }, [activeScoreEvent]);

  useEffect(() => {
    const returnedMeeples = activeScoreEvent?.payload.returnedMeeples ?? [];
    if (!activeScoreEvent || launchedScoreFlightEventIdsRef.current.has(activeScoreEvent.id)) {
      return;
    }
    if (returnedMeeples.length === 0) {
      launchedScoreFlightEventIdsRef.current.add(activeScoreEvent.id);
      return;
    }

    let frame: number | null = null;
    let returnDelayTimeout: ReturnType<typeof setTimeout> | null = null;
    const launchReturnedMeeples = () => {
      frame = requestAnimationFrame(() => {
        if (launchedScoreFlightEventIdsRef.current.has(activeScoreEvent.id)) return;

        const currentMatch = matchRef.current;
        if (!currentMatch) return;
        launchedScoreFlightEventIdsRef.current.add(activeScoreEvent.id);

        const seatById = new Map(
          currentMatch.gameState.players.map((player) => [player.actorId, player.seat]),
        );
        const enriched = returnedMeeples.map((meeple) => ({
          ...meeple,
          seat: meeple.seat ?? seatById.get(meeple.actorId),
        }));

        // Убираем ghost и создаём полёт в одном render — фигура не исчезает между ними.
        setDepartedScoreEventIds((previous) => {
          const next = new Set(previous);
          next.add(activeScoreEvent.id);
          return next;
        });
        launchMeepleFlights(enriched, currentMatch.gameState.board.tiles, {
          trackInventory: false,
          onComplete: () => {
            setArrivedScoreEventIds((previous) => {
              const next = new Set(previous);
              next.add(activeScoreEvent.id);
              return next;
            });
          },
        });
      });
    };
    const returnDelayMs = getScoreEventMeepleReturnDelayMs(activeScoreEvent);
    if (returnDelayMs > 0) {
      returnDelayTimeout = setTimeout(launchReturnedMeeples, returnDelayMs);
    } else {
      launchReturnedMeeples();
    }

    return () => {
      if (returnDelayTimeout) clearTimeout(returnDelayTimeout);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [activeScoreEvent, launchMeepleFlights]);

  useEffect(() => {
    if (!pendingMatchResult || scoreEventQueue.length > 0 || flights.length > 0) {
      return;
    }

    const payload = pendingMatchResult;
    const showResult = () => {
      matchResultTimeoutRef.current = null;
      showMatchResult(payload);
    };
    const delay = Math.max(0, scoreAnimationDeadlineRef.current - Date.now());
    if (delay === 0) {
      showResult();
      return;
    }

    const timeout = setTimeout(showResult, delay);
    matchResultTimeoutRef.current = timeout;
    return () => {
      clearTimeout(timeout);
      if (matchResultTimeoutRef.current === timeout) {
        matchResultTimeoutRef.current = null;
      }
    };
  }, [flights.length, pendingMatchResult, scoreEventQueue.length, showMatchResult]);

  useEffect(() => () => {
    flightTimeoutsRef.current.forEach((t) => clearTimeout(t));
    flightTimeoutsRef.current.clear();
    if (matchResultTimeoutRef.current) {
      clearTimeout(matchResultTimeoutRef.current);
    }
    if (leaveMatchTimeoutRef.current) {
      clearTimeout(leaveMatchTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (!initialTileIds) return;

    const controller = new AbortController();
    let isActive = true;
    let isReleased = false;
    setAreInitialAssetsReady(false);

    const releaseGame = () => {
      if (!isActive || isReleased) return;
      isReleased = true;
      setAreInitialAssetsReady(true);
    };

    // A stalled image must never keep the player on the loading screen forever.
    // Pending images continue warming the browser cache after the game is shown.
    const waitTimeout = window.setTimeout(
      releaseGame,
      CRITICAL_ASSET_WAIT_TIMEOUT_MS,
    );

    void preloadTileImages(initialTileIds, {
      concurrency: 4,
      signal: controller.signal,
    }).then(() => {
      if (controller.signal.aborted) return;
      window.clearTimeout(waitTimeout);
      releaseGame();
    });

    return () => {
      isActive = false;
      controller.abort();
      window.clearTimeout(waitTimeout);
    };
  }, [initialTileIds]);

  const expansionPreloadKey = Array.isArray(room?.settings?.expansions)
    ? [...room.settings.expansions].sort().join(',')
    : '';

  useEffect(() => {
    if (!areInitialAssetsReady || room?.gameType !== 'carcassonne') return;
    const expansions = expansionPreloadKey ? expansionPreloadKey.split(',') : [];
    return scheduleGameTilePreload(expansions);
  }, [areInitialAssetsReady, room?.gameType, expansionPreloadKey]);

  const fetchInitialData = useCallback(async () => {
    if (!inviteCode) return;
    try {
      const data = await roomService.getRoomById(inviteCode);
      if (data.room.status !== 'playing') {
        navigate(`/room/${data.room.inviteCode ?? inviteCode}`, { replace: true });
        return;
      }
      setRoom(data.room);
    } catch (err) {
      console.error('Ошибка:', err);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [inviteCode, navigate]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const completeLeaveNavigation = useCallback(() => {
    if (!isLeavingMatchRef.current) return;

    isLeavingMatchRef.current = false;
    if (leaveMatchTimeoutRef.current) {
      clearTimeout(leaveMatchTimeoutRef.current);
      leaveMatchTimeoutRef.current = null;
    }
    navigate(inviteCode ? `/room/${inviteCode}` : '/', { replace: true });
  }, [inviteCode, navigate]);

  const applyPrivateMatchState = useCallback((privatePayload: PrivateState) => {
    setPrivateState(privatePayload);

    if (
      privatePayload.phase === 'place_meeple'
      && privatePayload.isYourTurn
      && privatePayload.validMeeplePlacements.length === 0
    ) {
      const currentMatch = matchRef.current;
      if (currentMatch?.roomId) {
        reliableMatchActionsRef.current?.enqueue(currentMatch, {
          action: 'skip_meeple',
          payload: { roomId: currentMatch.roomId },
        });
      }
    }
  }, []);

  const handleMessage = useCallback((data: WebSocketMessage) => {
    if (data.type === 'match_action_result') {
      reliableMatchActionsRef.current?.handleResult(data.payload);
      return;
    }

    if (
      data.type === 'match_finished'
      && data.payload?.matchId
      && matchRef.current
      && data.payload.matchId !== matchRef.current.id
    ) {
      return;
    }

    if (data.type === 'match_finished' && isLeavingMatchRef.current) {
      const payload = data.payload;
      if (
        payload?.terminationReason === 'player_left' &&
        payload.terminatedByActorId === currentUser?.id
      ) {
        completeLeaveNavigation();
        return;
      }
    }

    if (data.type === 'match_state') {
      let newMatch = data.payload;
      let prevMatch = matchRef.current;

      if (prevMatch && newMatch.id !== prevMatch.id) {
        const previousCreatedAt = Date.parse(prevMatch.createdAt);
        const nextCreatedAt = Date.parse(newMatch.createdAt);
        if (
          (Number.isFinite(previousCreatedAt)
            && Number.isFinite(nextCreatedAt)
            && (
              nextCreatedAt < previousCreatedAt
              || (nextCreatedAt === previousCreatedAt && newMatch.status !== 'active')
            ))
          || (!Number.isFinite(nextCreatedAt) && newMatch.status !== 'active')
        ) {
          return;
        }
        resetMatchScopedUI();
        prevMatch = null;
      }
      if (
        prevMatch?.id === newMatch.id
        && newMatch.gameState.version < prevMatch.gameState.version
      ) {
        return;
      }
      if (
        (newMatch.recentActions === undefined || newMatch.recentActions === null)
        && prevMatch?.id === newMatch.id
      ) {
        newMatch = {
          ...newMatch,
          recentActions: prevMatch.recentActions,
        };
      }

      reliableMatchActionsRef.current?.reconcile(newMatch);

      setInitialTileIds((currentTileIds) => (
        currentTileIds ?? getInitialMatchTileIds(newMatch)
      ));
      const scoreEvents = (newMatch.events ?? []).filter(isFeatureScoredEvent);
      const isTurnChanged =
        prevMatch?.gameState?.turnNumber !== newMatch.gameState?.turnNumber;
      const isPhaseChanged =
        prevMatch?.gameState?.phase !== newMatch.gameState?.phase;
      const eventReturnedMeepleKeys = new Set(
        scoreEvents
          .flatMap((event) => event.payload.returnedMeeples ?? [])
          .map((meeple) => `${meeple.tileInstanceId}:${meeple.zoneId}:${meeple.actorId}`),
      );

      enqueueScoreEvents(newMatch.events);

      if (newMatch.status === 'finished' && scoreEventQueueRef.current.length > 0) {
        setFinalScoreEvents((previous) => {
          const next = [...previous];
          const knownIds = new Set(previous.map((event) => event.id));
          scoreEventQueueRef.current.forEach((event) => {
            if (knownIds.has(event.id)) return;
            knownIds.add(event.id);
            next.push(event);
          });
          return next;
        });
      }
      // Диффим подданных — какие исчезли с доски (вернулись игроку)
      if (prevMatch) {
        const prevMeeples = prevMatch.gameState?.meeples ?? [];
        const nextMeeples = newMatch.gameState?.meeples ?? [];
        const nextKeys = new Set(
          nextMeeples.map((m) => `${m.tileInstanceId}:${m.zoneId}:${m.actorId}`),
        );
        const removed = prevMeeples.filter(
          (m) => !nextKeys.has(`${m.tileInstanceId}:${m.zoneId}:${m.actorId}`),
        );
        const removedWithoutScoreEvent = removed.filter(
          (meeple) => !eventReturnedMeepleKeys.has(
            `${meeple.tileInstanceId}:${meeple.zoneId}:${meeple.actorId}`,
          ),
        );
        if (removedWithoutScoreEvent.length > 0) {
          // Подданные завершённых дорог/городов запускаются вместе с их событием
          // из последовательной очереди. Здесь остаются монастыри и fallback для
          // событий от старой версии backend без returnedMeeples.
          const boardTiles = prevMatch.gameState?.board?.tiles ?? [];
          const seatById = new Map(
            prevMatch.gameState.players.map((p) => [p.actorId, p.seat]),
          );
          const enriched = removedWithoutScoreEvent.map((m) => ({
            ...m,
            seat: m.seat ?? seatById.get(m.actorId),
          }));
          launchMeepleFlights(enriched, boardTiles);
        }
      }

      setTurnDeadline(
        newMatch.gameState?.currentTurn?.turnEndsAt,
        newMatch.serverTime,
      );
      setMatch(newMatch);
      matchRef.current = newMatch;

      if (isTurnChanged || isPhaseChanged) {
        // Public and private match state arrive in separate messages. Never
        // render a new tile/phase using placement hints from the previous one.
        setPrivateState(null);
      }

      const bufferedPrivateState = bufferedPrivateStateRef.current;
      if (bufferedPrivateState) {
        if (
          bufferedPrivateState.matchId === newMatch.id
          && bufferedPrivateState.version === newMatch.gameState.version
          && bufferedPrivateState.turnNumber === newMatch.gameState.turnNumber
        ) {
          bufferedPrivateStateRef.current = null;
          applyPrivateMatchState(bufferedPrivateState);
        } else if (
          bufferedPrivateState.matchId !== newMatch.id
          || bufferedPrivateState.version <= newMatch.gameState.version
        ) {
          bufferedPrivateStateRef.current = null;
        }
      }

      if (isTurnChanged) {
        setCurrentRotation(0);
        setPendingPlacement(null);
        const nextPlayer = newMatch.gameState.players.find(
          (player) => player.actorId === newMatch.gameState.currentPlayerId,
        );
        setSelectedMeepleType(getAvailableMeepleType(
          'regular',
          nextPlayer?.meeplesLeft ?? 0,
          nextPlayer?.bigMeeplesLeft ?? 0,
        ));
      }

      if (!isLeavingMatchRef.current) {
        const finishedPayload = finishedPayloadFromMatchState(newMatch);
        if (finishedPayload) handleFinishedMatch(finishedPayload);
      }
    }

    if (data.type === 'match_private_state') {
      const privatePayload = data.payload;
      const currentMatch = matchRef.current;
      if (!currentMatch || privatePayload.matchId !== currentMatch.id) return;

      if (privatePayload.version > currentMatch.gameState.version) {
        bufferedPrivateStateRef.current = privatePayload;
        return;
      }
      if (
        privatePayload.version < currentMatch.gameState.version
        || privatePayload.turnNumber !== currentMatch.gameState.turnNumber
        || privatePayload.phase !== currentMatch.gameState.phase
      ) return;

      applyPrivateMatchState(privatePayload);
    }

    if (data.type === 'match_finished') {
      const payload = data.payload;
      if (payload) handleFinishedMatch(payload);
    }

    if (data.type === 'error') {
      if (isLeavingMatchRef.current) {
        isLeavingMatchRef.current = false;
        if (leaveMatchTimeoutRef.current) {
          clearTimeout(leaveMatchTimeoutRef.current);
          leaveMatchTimeoutRef.current = null;
        }
        setIsExitModalOpen(true);
      }
    }
  }, [enqueueScoreEvents, setTurnDeadline, launchMeepleFlights, completeLeaveNavigation, currentUser?.id, applyPrivateMatchState, handleFinishedMatch, resetMatchScopedUI]);

  const { sendMessage, connectionStatus, reconnect } = useRoomSocket(
    room?.id,
    handleMessage,
    undefined,
  );

  const reliableMatchActions = useReliableMatchActions({
    roomId: room?.id,
    actorId: currentUser?.id,
    match,
    connectionStatus,
    sendMessage,
  });
  reliableMatchActionsRef.current = reliableMatchActions;

  const hasConnectionProblem = connectionStatus === 'reconnecting'
    || connectionStatus === 'disconnected';

  useEffect(() => {
    if (!hasConnectionProblem) {
      setShowConnectionBanner(false);
      return;
    }

    const timeout = window.setTimeout(() => setShowConnectionBanner(true), 500);
    return () => window.clearTimeout(timeout);
  }, [hasConnectionProblem]);

  const handlePlaceTile = (x: number, y: number) => {
    if (!room?.id) return;

    const placement = privateState?.validPlacements.find((p) => p.x === x && p.y === y);
    if (!placement) return;

    const rotation = placement.rotations.includes(currentRotation)
      ? currentRotation
      : placement.rotations[0];

    setPendingPlacement({ x, y, rotation });
  };

  const handleRotateTile = (x: number, y: number, rotations: number[]) => {
    if (!pendingPlacement) return;
    const currentIdx = rotations.indexOf(pendingPlacement.rotation);
    const nextRotation = rotations[(currentIdx + 1) % rotations.length];
    setPendingPlacement({ x, y, rotation: nextRotation });
  };

  const handleConfirmPlaceTile = () => {
    const currentMatch = matchRef.current;
    const tileId = currentMatch?.gameState.currentTurn?.drawnTile?.tileId;
    if (!room?.id || !pendingPlacement || !currentMatch || !tileId) return;

    const queued = reliableMatchActions.enqueue(currentMatch, {
      action: 'place_tile',
      payload: {
        roomId: room.id,
        x: pendingPlacement.x,
        y: pendingPlacement.y,
        rotation: pendingPlacement.rotation,
      },
      optimistic: {
        kind: 'tile',
        tileId,
      },
    });
    if (queued) setPendingPlacement(null);
  };

  const handlePlaceMeeple = (zoneId: string) => {
    const currentMatch = matchRef.current;
    const placedTile = currentMatch?.gameState.currentTurn?.placedTile;
    const currentPlayer = currentMatch?.gameState.players.find(
      (player) => player.actorId === currentUser?.id,
    );
    const placement = privateState?.validMeeplePlacements.find(
      (candidate) => candidate.zoneId === zoneId,
    );
    if (
      !room?.id
      || !currentMatch
      || !currentUser?.id
      || !placedTile?.instanceId
      || !placement
    ) return;

    const meepleType = getAvailableMeepleType(
      selectedMeepleType,
      currentPlayer?.meeplesLeft ?? 0,
      currentPlayer?.bigMeeplesLeft ?? 0,
    );

    reliableMatchActions.enqueue(currentMatch, {
      action: 'place_meeple',
      payload: {
        roomId: room.id,
        zoneId,
        meepleType,
      },
      optimistic: {
        kind: 'meeple',
        actorId: currentUser.id,
        tileInstanceId: placedTile.instanceId,
        featureType: placement.featureType,
        seat: currentMatch.gameState.players.find(
          (player) => player.actorId === currentUser.id,
        )?.seat,
      },
    });
  };

  const handleSkipMeeple = () => {
    const currentMatch = matchRef.current;
    if (!room?.id || !currentMatch) return;
    reliableMatchActions.enqueue(currentMatch, {
      action: 'skip_meeple',
      payload: { roomId: room.id },
    });
  };

  const handleLeftGame = () => {
    if (!room?.inviteCode || isLeavingMatchRef.current) return;

    const wasSent = sendMessage('leave_match', {
      roomId: room.id,
    });
    if (!wasSent) return;

    reliableMatchActions.discard();
    isLeavingMatchRef.current = true;
    setIsExitModalOpen(false);
    leaveMatchTimeoutRef.current = setTimeout(
      completeLeaveNavigation,
      LEAVE_MATCH_FALLBACK_TIMEOUT_MS,
    );
  };

  const handleReturnToRoom = () => {
    navigate(room?.inviteCode ? `/room/${room.inviteCode}` : '/');
  };

  const gameState = match?.gameState;
  const currentTurnId = gameState?.currentPlayerId;
  const phase = gameState?.phase;

  if (isLoading || !match || !areInitialAssetsReady) {
    let loadingStage: GameLoadingStage = 'room';

    if (!isLoading && !match) {
      loadingStage = 'match';
    } else if (match && !areInitialAssetsReady) {
      loadingStage = 'assets';
    }

    return (
      <GameLoadingScreen
        stage={loadingStage}
        connectionStatus={connectionStatus}
        onRetry={loadingStage === 'room'
          ? fetchInitialData
          : loadingStage === 'match'
            ? reconnect
            : undefined}
        onBack={() => navigate(`/room/${room?.inviteCode ?? inviteCode ?? ''}`)}
      />
    );
  }

  const ownerId = room?.ownerActorId;
  const pendingMatchAction = reliableMatchActions.pendingAction;
  const optimisticAction = pendingMatchAction
    && pendingMatchAction.expectedMatchId === match.id
    && pendingMatchAction.expectedStateVersion === match.gameState.version
      ? pendingMatchAction
      : null;
  const hasPendingMatchAction = pendingMatchAction !== null;

  // Merge GamePlayer (score, meeplesLeft) with MatchPlayer (avatarUrl, actorType, botDifficulty)
  const gamePlayers = match?.gameState?.players || [];
  const matchPlayers = match?.players || [];
  const matchPlayerByActor = new Map(matchPlayers.map((p) => [p.actorId, p]));
  const visibleReturnedMeeples = scoreEventQueue.flatMap((event) => (
    departedScoreEventIds.has(event.id) ? [] : (event.payload.returnedMeeples ?? [])
  ));
  const unavailableReturnedMeeples = scoreEventQueue.flatMap((event) => (
    arrivedScoreEventIds.has(event.id) ? [] : (event.payload.returnedMeeples ?? [])
  ));
  const unavailableMeeplesByActor: Record<string, PendingMeepleCounts> = {};
  for (const [actorId, pending] of Object.entries(pendingMeeples)) {
    unavailableMeeplesByActor[actorId] = { ...pending };
  }
  const countedUnavailableMeeples = new Set<string>();
  for (const meeple of unavailableReturnedMeeples) {
    const key = `${meeple.tileInstanceId}:${meeple.zoneId}:${meeple.actorId}`;
    if (countedUnavailableMeeples.has(key)) continue;
    countedUnavailableMeeples.add(key);
    const counts = unavailableMeeplesByActor[meeple.actorId]
      ?? { regular: 0, big: 0 };
    if (meeple.meepleType === 'big') counts.big += 1;
    else counts.regular += 1;
    unavailableMeeplesByActor[meeple.actorId] = counts;
  }
  if (optimisticAction?.action === 'place_meeple') {
    const actorId = optimisticAction.optimistic.actorId;
    const counts = unavailableMeeplesByActor[actorId]
      ?? { regular: 0, big: 0 };
    if (optimisticAction.payload.meepleType === 'big') counts.big += 1;
    else counts.regular += 1;
    unavailableMeeplesByActor[actorId] = counts;
  }
  const queuedAwardsByActor = new Map<string, number>();
  for (const event of scoreEventQueue.slice(1)) {
    for (const award of event.payload.awards) {
      queuedAwardsByActor.set(
        award.actorId,
        (queuedAwardsByActor.get(award.actorId) ?? 0) + award.points,
      );
    }
  }
  const unsettledAwardsByActor = new Map<string, number>();
  for (const event of scoreEventQueue) {
    for (const award of event.payload.awards) {
      unsettledAwardsByActor.set(
        award.actorId,
        (unsettledAwardsByActor.get(award.actorId) ?? 0) + award.points,
      );
    }
  }
  const players: SidebarPlayer[] = gamePlayers.map((gp) => {
    const mp = matchPlayerByActor.get(gp.actorId);
    return {
      ...gp,
      score: Math.max(0, gp.score - (queuedAwardsByActor.get(gp.actorId) ?? 0)),
      avatarUrl: mp?.avatarUrl,
      actorType: mp?.actorType,
      botDifficulty: mp?.botDifficulty,
    };
  });
  const displayedRankingScoresByActor = Object.fromEntries(
    players.map((player) => [player.actorId, player.score]),
  );
  const rankingOrderScoresByActor = Object.fromEntries(
    gamePlayers.map((player) => [
      player.actorId,
      Math.max(0, player.score - (unsettledAwardsByActor.get(player.actorId) ?? 0)),
    ]),
  );
  const drawnTile = gameState?.currentTurn?.drawnTile;
  const remainingTiles = gameState?.deck?.remainingCount;
  const boardTilesCount = gameState?.board?.tiles?.length ?? 0;
  const totalTiles =
    remainingTiles !== undefined ? boardTilesCount + remainingTiles - 1 : undefined;
  const deckPercent =
    remainingTiles !== undefined && totalTiles && totalTiles > 0
      ? Math.max(0, Math.min(100, (remainingTiles / totalTiles) * 100))
      : undefined;
  const currentTileId = drawnTile?.tileId;
  const displayedBoard = [...(gameState?.board?.tiles ?? [])];
  if (
    optimisticAction?.action === 'place_tile'
    && !displayedBoard.some(
      (tile) => tile.x === optimisticAction.payload.x && tile.y === optimisticAction.payload.y,
    )
  ) {
    displayedBoard.push({
      instanceId: `optimistic:${optimisticAction.actionId}`,
      tileId: optimisticAction.optimistic.tileId,
      x: optimisticAction.payload.x,
      y: optimisticAction.payload.y,
      rotation: optimisticAction.payload.rotation,
    });
  }

  const currentPlayer = players.find((player) => player.actorId === currentTurnId);
  const currentColor = getPlayerColorBySeat(currentPlayer?.seat);
  const isYourTurn = Boolean(privateState?.isYourTurn);
  const isCurrentPlayerBot = currentPlayer?.actorType === 'bot' || (currentTurnId?.startsWith('bot:') ?? false);
  const activeFinalScoreIndex = activeScoreEvent
    ? finalScoreEvents.findIndex((event) => event.id === activeScoreEvent.id)
    : -1;
  const visibleFinalScoreIndex = activeFinalScoreIndex >= 0
    ? activeFinalScoreIndex
    : finalScoreEvents.length - 1;
  const isFinalScoringPlayback = activeFinalScoreIndex >= 0;
  const isPostGameResults = matchResult !== null;
  const isPlaying = match?.status === 'active'
    && !isFinalScoringPlayback
    && !isPostGameResults;
  const isRankingMode = finalScoreEvents.length > 0 || isPostGameResults;
  const finalRankingScores = matchResult
    ? Object.fromEntries(
        matchResult.finalScores.map((entry) => [entry.actorId, entry.score]),
      )
    : undefined;
  const sidebarRankingScores = finalRankingScores
    ?? displayedRankingScoresByActor;
  const sidebarRankingOrderScores = finalRankingScores
    ?? rankingOrderScoresByActor;

  const lastPlacedTile = gameState?.currentTurn?.placedTile;
  const displayedMeeples = [...(gameState?.meeples ?? [])];
  const displayedMeepleKeys = new Set(
    displayedMeeples.map(
      (meeple) => `${meeple.tileInstanceId}:${meeple.zoneId}:${meeple.actorId}`,
    ),
  );
  for (const meeple of visibleReturnedMeeples) {
    const key = `${meeple.tileInstanceId}:${meeple.zoneId}:${meeple.actorId}`;
    if (displayedMeepleKeys.has(key)) continue;
    displayedMeepleKeys.add(key);
    displayedMeeples.push(meeple);
  }
  if (optimisticAction?.action === 'place_meeple') {
    const optimisticMeeple: PlacedMeeple = {
      tileInstanceId: optimisticAction.optimistic.tileInstanceId,
      zoneId: optimisticAction.payload.zoneId,
      actorId: optimisticAction.optimistic.actorId,
      seat: optimisticAction.optimistic.seat,
      featureType: optimisticAction.optimistic.featureType,
      meepleType: optimisticAction.payload.meepleType,
    };
    const key = `${optimisticMeeple.tileInstanceId}:${optimisticMeeple.zoneId}:${optimisticMeeple.actorId}`;
    if (!displayedMeepleKeys.has(key)) displayedMeeples.push(optimisticMeeple);
  }

  const scoringPanelPlayers = players.map((player) => ({
    actorId: player.actorId,
    displayName: player.displayName,
    color: getPlayerColorBySeat(player.seat),
  }));
  return (
    <main className={sidebarstyles.pageWrapper}>
      <GameRoomSidebar
        players={players}
        currentUserId={currentUser?.id}
        ownerId={ownerId}
        currentTurnId={currentTurnId}
        onLeaveClick={() => {
          if (isPostGameResults) {
            handleReturnToRoom();
            return;
          }
          setIsExitModalOpen(true);
        }}
        pendingMeeples={unavailableMeeplesByActor}
        registerPlayerCardRef={registerPlayerCardRef}
        isMeeplePlacementPhase={isPlaying && phase === 'place_meeple' && isYourTurn && !hasPendingMatchAction}
        selectedMeepleType={selectedMeepleType}
        onSelectMeepleType={setSelectedMeepleType}
        mode={isRankingMode ? 'ranking' : 'playing'}
        rankingScores={sidebarRankingScores}
        rankingOrderScores={sidebarRankingOrderScores}
        leaveButtonText={isPostGameResults ? 'Вернуться в комнату' : 'Покинуть игру'}
      />

      <div className={styles.boardContainer} ref={boardContainerRef}>
        <GameBoard
          ref={boardHandleRef}
          width={boardWidth}
          height={boardHeight}
          board={displayedBoard}
          validPlacements={
            isPlaying && !hasPendingMatchAction
              ? (privateState?.validPlacements || [])
              : []
          }
          onPlaceTile={handlePlaceTile}
          onRotateTile={handleRotateTile}
          currentTileId={isPlaying ? currentTileId : undefined}
          phase={isPlaying ? phase : undefined}
          validMeeplePlacements={
            isPlaying && !hasPendingMatchAction
              ? (privateState?.validMeeplePlacements || [])
              : []
          }
          onPlaceMeeple={handlePlaceMeeple}
          lastPlacedTile={lastPlacedTile}
          players={players}
          placedMeeples={displayedMeeples}
          pendingPlacement={isPlaying && !hasPendingMatchAction ? pendingPlacement : null}
          scoreEvent={activeScoreEvent}
        />

        {isPlaying && (
          <>
            <CurrentTurnPanel
              currentPlayerName={currentPlayer?.displayName || 'Ожидание...'}
              phase={phase}
              currentTileId={currentTileId}
              remainingTiles={remainingTiles}
              deckPercent={deckPercent}
              currentColor={currentColor}
              timeLeft={timeLeft}
              turnDuration={gameState?.settings?.turnTimeSeconds}
              isBot={isCurrentPlayerBot}
            />

            {!isYourTurn && currentPlayer && (
              <div className={styles.waitingBadge}>
                {isCurrentPlayerBot ? (
                  <Bot size={18} className={styles.waitingBadge__hourglass} aria-hidden="true" />
                ) : (
                  <Hourglass size={18} className={styles.waitingBadge__hourglass} aria-hidden="true" />
                )}
                <span className={styles.waitingBadge__text}>
                  {isCurrentPlayerBot
                    ? `Бот ${currentPlayer.displayName} думает...`
                    : `Ожидайте хода ${currentPlayer.displayName}`
                  }
                </span>
              </div>
            )}
          </>
        )}

        {finalScoreEvents.length > 0 && (
          <FinalScoringPanel
            events={finalScoreEvents}
            players={scoringPanelPlayers}
            currentEventIndex={visibleFinalScoreIndex}
          />
        )}

        {match.status === 'active' && showConnectionBanner && (
          <div
            className={styles.connectionBanner}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <WifiOff size={19} aria-hidden="true" />
            <span>Соединение потеряно. Восстанавливаем…</span>
          </div>
        )}

        {match?.status === 'active' && phase === 'place_meeple' && privateState?.isYourTurn && !hasPendingMatchAction && (
          <button
            className={`${styles.skipButton} ${showConnectionBanner ? styles.skipButton_connectionOffset : ''}`}
            onClick={handleSkipMeeple}
          >
            Не ставить подданного
          </button>
        )}

        {match?.status === 'active' && phase === 'place_tile' && privateState?.isYourTurn && pendingPlacement !== null && !hasPendingMatchAction && (
          <button
            className={`${styles.skipButton} ${showConnectionBanner ? styles.skipButton_connectionOffset : ''}`}
            onClick={handleConfirmPlaceTile}
          >
            Присоединить квадрат
          </button>
        )}

        {matchResult === null && finalScoreEvents.length > 0 && scoreEventQueue.length > 0 && (
          <button
            type="button"
            className={`${styles.skipButton} ${styles.finalScoringSkipButton} ${showConnectionBanner ? styles.skipButton_connectionOffset : ''}`}
            onClick={handleSkipFinalScoring}
          >
            Пропустить подсчёт
          </button>
        )}

        {(match.recentActions?.length ?? 0) > 0 && (
          <GameActionLog
            activities={match.recentActions ?? []}
            players={match.players}
            mobileOpen={mobileInfoPanel === 'actions'}
            onMobileOpenChange={(open) => setMobileInfoPanel(open ? 'actions' : null)}
            elevateMobilePanel={finalScoreEvents.length > 0}
          />
        )}
      </div>

      <MeepleFlightLayer flights={flights} />

      <Modal isOpen={isExitModalOpen} onClose={() => setIsExitModalOpen(false)}>
        <ConfirmModal
          title="Вы действительно хотите покинуть игру?"
          text="Игра будет завершена досрочно, а этот бесчестный поступок отразится на вашей репутации в сообществе"
          onCancel={() => setIsExitModalOpen(false)}
          onConfirm={() => handleLeftGame()}
          onConfirmText="Да, выйти"
          onCancelText="Остаться"
          image={gameExitImage}
        />
      </Modal>

      <Modal isOpen={isRoomDeleted} onClose={() => navigate('/')}>
        <ConfirmModal
          title="Игра была завершена досрочно"
          text="К превеликому сожалению, один из нас решил с позором покинуть игру.
            В сообществе пойдёт молва о его трусливом дезертирстве."
          onConfirm={() => navigate(room?.inviteCode ? `/room/${room.inviteCode}` : '/')}
          onConfirmText="Вернуться в комнату"
          image={gameExitImage}
        />
      </Modal>

      <Modal
        isOpen={matchResult !== null && isCelebrationOpen}
        onClose={() => setIsCelebrationOpen(false)}
      >
        {matchResult && (
          <MatchResultModal
            result={matchResult}
            players={players}
            currentUserId={currentUser?.id}
            onConfirm={() => setIsCelebrationOpen(false)}
            onReturnToRoom={handleReturnToRoom}
          />
        )}
      </Modal>
    </main>
  );
};

export default GameRoom;
