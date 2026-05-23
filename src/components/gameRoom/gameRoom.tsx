import { useCallback, useEffect, useRef, useState } from 'react';
import { preloadTileImages } from '@/utils/tiles.config';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './gameRoom.module.scss';
import sidebarstyles from '../mainPage/MainPage.module.scss';
import { useRoomSocket } from '@/api/ws';
import type { MatchFinishedPayload, WebSocketMessage } from '@/types/ws';
import {
  type MatchStatePayload,
  type PlacedMeeple,
  type PrivateState,
} from '@/types/match';
import type { RoomResponse } from '@/types/room';
import { roomService } from '@/api/room';
import { useUserStore } from '@/store/useUserStore';
import { getPlayerColorBySeat } from '@/utils/playerColor.ts';
import Modal from '../modal/modal';
import gameExitImage from '@/assets/gameExit.png';
import GameBoard, { type GameBoardHandle } from './gameBoard.tsx';
import { ConfirmModal } from '../confirmModal/confirmModal.tsx';
import { MatchResultModal } from '../matchResult/matchResult.tsx';
import { GameRoomSidebar } from './gameRoomSidebar.tsx';
import { CurrentTurnPanel } from '../turnPanel/currentTurnPanel.tsx';
import { GameActionLog } from '../latestActions/gameActionLog.tsx';
import { useMatchActionLog } from './hooks/useMatchActionLog.ts';
import { useTurnTimer } from './hooks/useTurnTimer.ts';
import {
  MeepleFlightLayer,
  FLIGHT_DURATION_MS,
  type MeepleFlight,
} from '../meepleFlight/meepleFlight.tsx';
import { getZoneOffset } from '@/utils/tileZones.ts';

export type { Tile, MatchStatePayload, PrivateState } from '../../types/match';

const GameRoom = () => {
  const { id: inviteCode } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.actor);

  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [match, setMatch] = useState<MatchStatePayload | null>(null);
  const matchRef = useRef<MatchStatePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isRoomDeleted, setIsRoomDeleted] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchFinishedPayload | null>(null);
  const [privateState, setPrivateState] = useState<PrivateState | null>(null);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [pendingPlacement, setPendingPlacement] = useState<{ x: number; y: number; rotation: number } | null>(null);
  // Карта последних поставленных тайлов по каждому игроку: actorId -> { x, y, color }
  const lastPlacedStorageKey = inviteCode ? `lastPlacedByPlayer:${inviteCode}` : null;
  const [lastPlacedByPlayer, setLastPlacedByPlayer] = useState<
    Record<string, { x: number; y: number; color: string }>
  >(() => {
    if (!lastPlacedStorageKey) return {};
    try {
      const raw = localStorage.getItem(lastPlacedStorageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (!lastPlacedStorageKey) return;
    try {
      localStorage.setItem(lastPlacedStorageKey, JSON.stringify(lastPlacedByPlayer));
    } catch {
      // ignore
    }
  }, [lastPlacedByPlayer, lastPlacedStorageKey]);

  const { actionLog, recordMatchUpdate, clearLog } = useMatchActionLog(inviteCode);
  const { timeLeft, setTurnDeadline } = useTurnTimer(match?.status === 'active');

  // Анимация возврата миплов
  const boardHandleRef = useRef<GameBoardHandle | null>(null);
  const playerCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [flights, setFlights] = useState<MeepleFlight[]>([]);
  const [pendingMeeples, setPendingMeeples] = useState<Record<string, number>>({});
  const flightTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const registerPlayerCardRef = useCallback(
    (actorId: string, el: HTMLDivElement | null) => {
      if (el) playerCardRefs.current.set(actorId, el);
      else playerCardRefs.current.delete(actorId);
    },
    [],
  );

  const launchMeepleFlights = useCallback((removed: PlacedMeeple[], boardTiles: { tileId: string; x: number; y: number; rotation: number; instanceId?: string }[]) => {
    const stage = boardHandleRef.current?.getStage();
    const tileStep = boardHandleRef.current?.getTileStep() ?? 152;
    if (!stage || removed.length === 0) return;

    const containerRect = stage.container().getBoundingClientRect();
    const sx = stage.x();
    const sy = stage.y();
    const scale = stage.scaleX();

    const newFlights: MeepleFlight[] = [];
    const pendingDelta: Record<string, number> = {};

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
      pendingDelta[m.actorId] = (pendingDelta[m.actorId] ?? 0) + 1;
    });

    if (newFlights.length === 0) return;

    setFlights((prev) => [...prev, ...newFlights]);
    setPendingMeeples((prev) => {
      const next = { ...prev };
      for (const [aid, n] of Object.entries(pendingDelta)) {
        next[aid] = (next[aid] ?? 0) + n;
      }
      return next;
    });

    const ids = newFlights.map((f) => f.id);
    const timeout = setTimeout(() => {
      setFlights((prev) => prev.filter((f) => !ids.includes(f.id)));
      setPendingMeeples((prev) => {
        const next = { ...prev };
        for (const [aid, n] of Object.entries(pendingDelta)) {
          next[aid] = Math.max(0, (next[aid] ?? 0) - n);
          if (next[aid] === 0) delete next[aid];
        }
        return next;
      });
      flightTimeoutsRef.current.delete(timeout);
    }, FLIGHT_DURATION_MS);
    flightTimeoutsRef.current.add(timeout);
  }, []);

  const clearFlights = useCallback(() => {
    flightTimeoutsRef.current.forEach((t) => clearTimeout(t));
    flightTimeoutsRef.current.clear();
    setFlights([]);
    setPendingMeeples({});
  }, []);

  useEffect(() => () => {
    flightTimeoutsRef.current.forEach((t) => clearTimeout(t));
    flightTimeoutsRef.current.clear();
  }, []);

  useEffect(() => {
    preloadTileImages();
  }, []);

  const fetchInitialData = useCallback(async () => {
    if (!inviteCode) return;
    try {
      const data = await roomService.getRoomById(inviteCode);
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

  const sendMessageRef = useRef<ReturnType<typeof useRoomSocket>['sendMessage'] | null>(null);

  const handleMessage = useCallback((data: WebSocketMessage) => {
    if (data.type === 'match_state') {
      const newMatch = data.payload;
      const prevMatch = matchRef.current;
      const isTurnChanged =
        prevMatch?.gameState?.turnNumber !== newMatch.gameState?.turnNumber;

      recordMatchUpdate(prevMatch, newMatch);

      // Диффим миплы — какие исчезли с доски (вернулись игроку)
      if (prevMatch) {
        const prevMeeples = prevMatch.gameState?.meeples ?? [];
        const nextMeeples = newMatch.gameState?.meeples ?? [];
        const nextKeys = new Set(
          nextMeeples.map((m) => `${m.tileInstanceId}:${m.zoneId}:${m.actorId}`),
        );
        const removed = prevMeeples.filter(
          (m) => !nextKeys.has(`${m.tileInstanceId}:${m.zoneId}:${m.actorId}`),
        );
        if (removed.length > 0) {
          // запускаем после применения нового состояния — нужен актуальный board для tile lookup
          // tiles на самом деле берём из prevMatch (тайл точно ещё там — у фичи только что сняли мипла)
          const boardTiles = prevMatch.gameState?.board?.tiles ?? [];
          // обогащаем seat из prevPlayers, если не задан
          const seatById = new Map(
            prevMatch.gameState.players.map((p) => [p.actorId, p.seat]),
          );
          const enriched = removed.map((m) => ({
            ...m,
            seat: m.seat ?? seatById.get(m.actorId),
          }));
          launchMeepleFlights(enriched, boardTiles);
        }
      }

      const newPlacedTile = newMatch.gameState?.currentTurn?.placedTile;
      const placerId = newMatch.gameState?.currentPlayerId;
      if (newPlacedTile && placerId) {
        const placer = newMatch.gameState?.players?.find(
          (p) => p.actorId === placerId
        );
        const color = getPlayerColorBySeat(placer?.seat);
        setLastPlacedByPlayer((prev) => {
          const existing = prev[placerId];
          if (
            existing &&
            existing.x === newPlacedTile.x &&
            existing.y === newPlacedTile.y &&
            existing.color === color
          ) {
            return prev;
          }
          return {
            ...prev,
            [placerId]: { x: newPlacedTile.x, y: newPlacedTile.y, color },
          };
        });
      }

      setTurnDeadline(newMatch.gameState?.currentTurn?.turnEndsAt);
      setMatch(newMatch);
      matchRef.current = newMatch;

      if (isTurnChanged) {
        setCurrentRotation(0);
        setPendingPlacement(null);
      }
    }

    if (data.type === 'match_private_state') {
      const privatePayload = data.payload;
      setPrivateState(privatePayload);

      if (
        privatePayload.phase === 'place_meeple' &&
        privatePayload.isYourTurn &&
        privatePayload.validMeeplePlacements.length === 0
      ) {
        const currentRoom = matchRef.current;
        if (currentRoom?.roomId) {
          sendMessageRef.current?.('match_action', {
            roomId: currentRoom.roomId,
            action: 'skip_meeple',
            payload: { roomId: currentRoom.roomId },
          });
        }
      }
    }

    if (data.type === 'match_finished') {
      clearLog();
      clearFlights();
      if (lastPlacedStorageKey) {
        try { localStorage.removeItem(lastPlacedStorageKey); } catch { /* ignore */ }
      }
      setLastPlacedByPlayer({});
      const payload = data.payload;
      if (payload && payload.terminationReason === 'normal_completion') {
        setMatchResult(payload);
      } else {
        setIsRoomDeleted(true);
      }
    }
  }, [recordMatchUpdate, clearLog, clearFlights, setTurnDeadline, lastPlacedStorageKey, launchMeepleFlights]);

  const { sendMessage } = useRoomSocket(room?.id, handleMessage);

  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

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
    if (!room?.id || !pendingPlacement) return;

    sendMessage('match_action', {
      roomId: room.id,
      action: 'place_tile',
      payload: {
        roomId: room.id,
        x: pendingPlacement.x,
        y: pendingPlacement.y,
        rotation: pendingPlacement.rotation,
      },
    });
  };

  const handlePlaceMeeple = (zoneId: string) => {
    if (!room?.id) return;
    sendMessage('match_action', {
      roomId: room.id,
      action: 'place_meeple',
      payload: {
        roomId: room.id,
        zoneId,
      },
    });
  };

  const handleSkipMeeple = () => {
    if (!room?.id) return;
    sendMessage('match_action', {
      roomId: room.id,
      action: 'skip_meeple',
      payload: { roomId: room.id },
    });
  };

  const handleLeftGame = () => {
    if (room?.inviteCode) {
      clearLog();
      sendMessage('leave_match', {
        roomId: room.id,
      });
      navigate(`/room/${room.inviteCode}`);
    }
  };

  const gameState = match?.gameState;
  const currentTurnId = gameState?.currentPlayerId;
  const phase = gameState?.phase;

  if (isLoading) return <div className={sidebarstyles.pageWrapper}>Загрузка...</div>;

  const ownerId = room?.ownerActorId;
  const players = match?.gameState?.players || [];
  const drawnTile = gameState?.currentTurn?.drawnTile;
  const remainingTiles = gameState?.deck?.remainingCount;
  const boardTilesCount = gameState?.board?.tiles?.length ?? 0;
  const totalTiles =
    remainingTiles !== undefined ? boardTilesCount + remainingTiles - 1 : undefined;
  const deckPercent =
    remainingTiles !== undefined && totalTiles && totalTiles > 0
      ? Math.max(0, Math.min(100, (remainingTiles / totalTiles) * 100))
      : undefined;
  const currentTileId = drawnTile?.tileId || '1';

  const currentPlayer = players.find((player) => player.actorId === currentTurnId);
  const currentColor = getPlayerColorBySeat(currentPlayer?.seat);

  const lastPlacedTile = gameState?.currentTurn?.placedTile;

  return (
    <main className={sidebarstyles.pageWrapper}>
      <GameRoomSidebar
        players={players}
        currentUserId={currentUser?.id}
        ownerId={ownerId}
        currentTurnId={currentTurnId}
        onLeaveClick={() => setIsExitModalOpen(true)}
        pendingMeeples={pendingMeeples}
        registerPlayerCardRef={registerPlayerCardRef}
      />

      <div className={styles.boardContainer}>
        <GameBoard
          ref={boardHandleRef}
          board={gameState?.board?.tiles || []}
          validPlacements={privateState?.validPlacements || []}
          onPlaceTile={handlePlaceTile}
          onRotateTile={handleRotateTile}
          currentTileId={currentTileId}
          phase={phase}
          validMeeplePlacements={privateState?.validMeeplePlacements || []}
          onPlaceMeeple={handlePlaceMeeple}
          lastPlacedTile={lastPlacedTile}
          lastPlacedByPlayer={lastPlacedByPlayer}
          players={players}
          placedMeeples={gameState?.meeples || []}
          pendingPlacement={pendingPlacement}
        />

        {matchResult === null && (
          <CurrentTurnPanel
            currentPlayerName={currentPlayer?.displayName || 'Ожидание...'}
            phase={phase}
            currentTileId={currentTileId}
            remainingTiles={remainingTiles}
            deckPercent={deckPercent}
            currentColor={currentColor}
            timeLeft={timeLeft}
            turnDuration={gameState?.settings?.turnTimeSeconds}
          />
        )}

        {phase === 'place_meeple' && privateState?.isYourTurn && (
          <button className={styles.skipButton} onClick={handleSkipMeeple}>
            Не ставить мипла
          </button>
        )}

        {phase === 'place_tile' && privateState?.isYourTurn && pendingPlacement !== null && (
          <button
            className={styles.skipButton}
            onClick={handleConfirmPlaceTile}
          >
            Поставить тайл
          </button>
        )}

        {actionLog.length !== 0 && (
          <GameActionLog entries={actionLog} />
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
          onConfirm={() => { room?.inviteCode ? navigate(`/room/${room.inviteCode}`) : navigate('/'); }}
          onConfirmText="Вернуться в комнату"
          image={gameExitImage}
        />
      </Modal>

      <Modal
        isOpen={matchResult !== null}
        onClose={() => {
          setMatchResult(null);
          room?.inviteCode ? navigate(`/room/${room.inviteCode}`) : navigate('/');
        }}
      >
        {matchResult && (
          <MatchResultModal
            result={matchResult}
            players={players}
            currentUserId={currentUser?.id}
            onConfirm={() => {
              setMatchResult(null);
              room?.inviteCode ? navigate(`/room/${room.inviteCode}`) : navigate('/');
            }}
          />
        )}
      </Modal>
    </main>
  );
};

export default GameRoom;
