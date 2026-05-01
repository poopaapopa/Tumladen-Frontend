import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './gameRoom.module.scss';
import sidebarstyles from '../mainPage/MainPage.module.scss'
import { useRoomSocket, type WebSocketMessage } from '../../api/ws';
import { useState, useCallback, useEffect, useRef } from 'react';
import { roomService, type RoomResponse } from '../../api/room';
import { useUserStore } from '../../store/useUserStore';
import Modal from '../modal/modal';
import gameExitImage from '../../assets/gameExit.png';
import iconImg from '../../assets/icon.png';
import GameBoard from "./gameBoard.tsx";
import { TILE_IMAGES } from "../../utils/tiles.config.ts";
import { getPlayerColorBySeat } from "../../utils/playerColor.ts";
import { MatchPlayerCard } from "../matchPlayerCard/matchPlayerCard.tsx";
import { ConfirmModal } from '../confirmKick/confirmKick.tsx';
import { AlarmClock } from 'lucide-react';

export interface PrivateState {
  isYourTurn: boolean;
  phase: string;
  validPlacements: Array<{ x: number, y: number, rotations: number[] }>;
  validMeeplePlacements: Array<{ zoneId: string, featureType: string }>;
}

interface MatchPlayer {
  actorId: string;
  displayName: string;
  score: number;
  meeplesLeft: number;
  seat: number;
}

export interface MatchStatePayload {
  id: string;
  roomId: string;
  status: string;
  gameType: string;
  isYourTurn: boolean;
  gameState: GameState;
}

interface GameState {
  currentPlayerId: string;
  players: MatchPlayer[];
  turnNumber: number;
  phase: 'place_tile' | 'place_meeple' | string;
  board: {
    tiles: Tile[];
  };
  meeples: Array<{ tileInstanceId: string, zoneId: string, actorId: string, seat?: number, featureType: string }>;
  currentTurn?: {
    drawnTile: {
      tileId: string;
      imageUrl: string;
    } | null;
    placedTile?: Tile;
    turnEndsAt?: string;
  };
  deck?: {
    remainingCount: number;
  };
  settings?: {
    turnTimeSeconds: number;
  };
}

export interface Tile {
  tileId: string;
  x: number;
  y: number;
  rotation: number;
  instanceId?: string;
}

interface LogEntry {
  id: string;
  text: string;
  color: string;
  timestamp: Date;
  nickname: string; 
  tileId?: string;
}

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
  const [privateState, setPrivateState] = useState<PrivateState | null>(null);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [pendingPlacement, setPendingPlacement] = useState<{ x: number; y: number; rotation: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const turnDeadlineRef = useRef<number | null>(null);

  const [actionLog, setActionLog] = useState<LogEntry[]>(() => {
    const saved = localStorage.getItem(`log_${inviteCode}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((entry: LogEntry) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    if (inviteCode && actionLog.length > 0) {
      localStorage.setItem(`log_${inviteCode}`, JSON.stringify(actionLog));
    }
  }, [actionLog, inviteCode]);

  const addToLog = useCallback((text: string, actorId: string, players: MatchPlayer[], tileId?: string) => {
    const player = players.find(p => p.actorId === actorId);
    const color = getPlayerColorBySeat(player?.seat);
    const nickname = player?.displayName || "Неизвестный герой";
    
    const newEntry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      text,
      color,
      timestamp: new Date(),
      nickname,
      tileId
    };

    setActionLog(prev => {
      if (prev.length > 0 && prev[0].text === text && prev[0].nickname === nickname) {
        const diff = newEntry.timestamp.getTime() - prev[0].timestamp.getTime();
        if (diff < 1000) return prev;
      }

      return [newEntry, ...prev].slice(0, 50);
    });
  }, []);

  const fetchInitialData = useCallback(async () => {
    if (!inviteCode) return;
    try {
      const data = await roomService.getRoomById(inviteCode);
      setRoom(data.room);

    } catch (err) {
      console.error("Ошибка:", err);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [inviteCode, navigate]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleMessage = useCallback((data: WebSocketMessage) => {
    if (data.type === 'match_state') {
      const newMatch = data.payload as MatchStatePayload;
      const prevTurnNumber = matchRef.current?.gameState?.turnNumber;
      const newTurnNumber = newMatch.gameState?.turnNumber;
      const isTurnChanged = prevTurnNumber !== newTurnNumber;
      const prevMatch = matchRef.current;

      if (prevMatch) {
        const prevGs = prevMatch.gameState;
        const nextGs = newMatch.gameState;

        if (prevGs.phase === 'place_tile' && nextGs.phase === 'place_meeple') {
          const placedTileId = prevGs.currentTurn?.drawnTile?.tileId;
          addToLog("поставил тайл", prevGs.currentPlayerId, prevGs.players, placedTileId);
        }

        if (nextGs.meeples.length > prevGs.meeples.length) {
          addToLog("поставил мипла на тайл", prevGs.currentPlayerId, prevGs.players);
        }

        if (nextGs.turnNumber > prevGs.turnNumber) {
          if (nextGs.meeples.length === prevGs.meeples.length) {
              addToLog("решил не ставить мипла", prevGs.currentPlayerId, nextGs.players);
           }
        }
      }

      const turnEndsAtIso = newMatch.gameState?.currentTurn?.turnEndsAt;
      if (turnEndsAtIso) {
        const deadline = new Date(turnEndsAtIso).getTime();
        turnDeadlineRef.current = deadline;
        setTimeLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
      }

      setMatch(newMatch);
      matchRef.current = newMatch;

      if (isTurnChanged) {
        setCurrentRotation(0);
        setPendingPlacement(null);
      }
    }

    if (data.type === 'match_private_state') {
      const privatePayload = data.payload as PrivateState;
      setPrivateState(privatePayload);

      if (
        privatePayload.phase === 'place_meeple' &&
        privatePayload.isYourTurn &&
        privatePayload.validMeeplePlacements.length === 0
      ) {
        const currentRoom = matchRef.current;
        if (currentRoom?.roomId) {
          sendMessage('match_action', {
            roomId: currentRoom.roomId,
            action: 'skip_meeple',
            payload: { roomId: currentRoom.roomId }
          });
        }
      }
    }

    if (data.type === 'match_finished') {
      localStorage.removeItem(`log_${inviteCode}`);
      setIsRoomDeleted(true);
    }
  }, [addToLog, inviteCode]);

  const { sendMessage } = useRoomSocket(room?.id, handleMessage);

  const handlePlaceTile = (x: number, y: number) => {
    if (!room?.id) return;

    const placement = privateState?.validPlacements.find(p => p.x === x && p.y === y);
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
        rotation: pendingPlacement.rotation
      }
    });
  };

  const handlePlaceMeeple = (zoneId: string) => {
    if (!room?.id) return;
    sendMessage('match_action', {
      roomId: room.id,
      action: 'place_meeple',
      payload: {
        roomId: room.id,
        zoneId: zoneId
      }
    });
  };

  const handleSkipMeeple = () => {
    if (!room?.id) return;
    sendMessage('match_action', {
      roomId: room.id,
      action: 'skip_meeple',
      payload: { roomId: room.id }
    });
  };

  const handleLeftGame = () => {
    if (room?.inviteCode) {
      localStorage.removeItem(`log_${inviteCode}`);
      sendMessage('leave_match', {
        roomId: room.id
      });
      navigate(`/room/${room.inviteCode}`);
    }
  };

  const gameState = match?.gameState;
  const currentTurnId = gameState?.currentPlayerId;
  const phase = gameState?.phase;

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (match?.status !== 'active') return;

    const tick = () => {
      const deadline = turnDeadlineRef.current;
      if (deadline == null) {
        setTimeLeft(null);
        return;
      }
      setTimeLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    };

    tick();
    timerRef.current = setInterval(tick, 250);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [match?.status]);

  if (isLoading) return <div className={sidebarstyles.pageWrapper}>Загрузка...</div>;

  const ownerId = room?.ownerActorId;
  const players = match?.gameState?.players || [];
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.actorId === currentUser?.id) return -1;
    if (b.actorId === currentUser?.id) return 1;
    return 0;
  });
  
  const drawnTile = gameState?.currentTurn?.drawnTile;
  const remainingTiles = gameState?.deck?.remainingCount;
  const currentTileId = drawnTile?.tileId || "1";

  const currentPlayer = players.find(p => p.actorId === currentTurnId);
  const currentColor = getPlayerColorBySeat(currentPlayer?.seat);

  const lastPlacedTile = gameState?.currentTurn?.placedTile;

  const getActionText = (phase: string | undefined) => {
    if (phase === 'place_meeple') return 'ставит мипла на тайл:';
    return 'ставит тайл:';
  };

  return (
    <main className={sidebarstyles.pageWrapper}>
      <div className={sidebarstyles.sidebar}>
        <div className={sidebarstyles.sidebar__gameInfo}>
          <div className={sidebarstyles.sidebar__title}>Игроки</div>
          {timeLeft !== null && (
            <div className={sidebarstyles.sidebar__timer}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              <AlarmClock className={sidebarstyles.sidebar__timerIcon} />
            </div>
          )}
        </div>

        <div className={styles.playersList}>
          {sortedPlayers.map((player, index) => (
            <React.Fragment key={player.actorId}>
              <MatchPlayerCard
                displayName={player.displayName}
                isRoomOwner={player.actorId === ownerId}
                isTurn={player.actorId === currentTurnId}
                score={player.score}
                meeplesLeft={player.meeplesLeft}
                seat={player.seat}
              />

              {index === 0 && (
                <div className={styles.playersList__divider} />
              )}
            </React.Fragment>
          ))}
        </div>

        <button onClick={() => setIsExitModalOpen(true)} className={styles.leftGameButton}>
          Покинуть игру
        </button>
      </div>

      <div className={styles.boardContainer}>
        <GameBoard
          board={gameState?.board?.tiles || []}
          validPlacements={privateState?.validPlacements || []}
          onPlaceTile={handlePlaceTile}
          onRotateTile={handleRotateTile}
          currentTileId={currentTileId}
          phase={phase}
          validMeeplePlacements={privateState?.validMeeplePlacements || []}
          onPlaceMeeple={handlePlaceMeeple}
          lastPlacedTile={lastPlacedTile}
          currentPlayerColor={currentColor}
          players={players}
          placedMeeples={gameState?.meeples || []}
          pendingPlacement={pendingPlacement}
        />
        {currentTileId && (
          <div
            className={styles.nexTile}
            style={{ '--player-color': currentColor } as React.CSSProperties}
          >
            <div className={styles.nexTile__status}>
              <span className={styles.nexTile__nickname}>
                {currentPlayer?.displayName || "Ожидание..."}
              </span>
              <span className={styles.nexTile__action}>
                {getActionText(phase)}
              </span>
            </div>

            <div className={styles.nexTile__tileWrapper}>
              <div className={styles.nexTile__tileOverlay} />
              <img src={TILE_IMAGES[currentTileId]} className={styles.nexTile__image} />
            </div>

            <div className={styles.nexTile__count}>
              <img
                src={iconImg}
                alt="Осталось тайлов"
                className={styles.nexTile__countIcon}
              />
              <span className={styles.nexTile__countSubtext}>
                осталось
              </span>
              <span className={styles.nexTile__countText}>
                {remainingTiles}
              </span>
              <span className={styles.nexTile__countSubtext}>
                тайлов
              </span>
            </div>
          </div>
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
        <div className={styles.latestActions}>
          <h4 className={styles.latestActions__title}>Последние действия:</h4>
          <div className={styles.latestActions__list}>
            {actionLog.map((entry) => (
              <div key={entry.id} className={styles.latestActions__item}>
                <span className={styles.latestActions__time}>
                  {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>

                <div className={styles.latestActions__content}>
                  <span 
                    className={styles.latestActions__nickname}
                    style={{ color: entry.color }}
                  >
                    {entry.nickname}
                  </span>
                  <span className={styles.latestActions__text}>
                    {entry.text}
                  </span>
                  {entry.tileId && (
                    <div className={styles.latestActions__image}>
                      <img src={TILE_IMAGES[entry.tileId]} alt="tile" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
        </div>
      </div>

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
          onConfirm={() => {room?.inviteCode ? navigate(`/room/${room.inviteCode}`) : navigate('/');}}
          onConfirmText="Вернуться в комнату"
          image={gameExitImage}
        />
      </Modal>
    </main>
  );
};

export default GameRoom;