import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './gameRoom.module.scss';
import sidebarstyles from '../mainPage/MainPage.module.scss'
import { useRoomSocket, type WebSocketMessage } from '../../api/ws';
import { useState, useCallback, useEffect } from 'react';
import { roomService, type RoomResponse } from '../../api/room';
import { useUserStore } from '../../store/useUserStore';
import Modal from '../modal/modal';
import gameExitImage from '../../assets/gameExit.png';
import iconImg from '../../assets/icon.png';
import GameBoard from "./gameBoard.tsx";
import { TILE_IMAGES } from "../../utils/tiles.config.ts";
import { getPlayerColorBySeat } from "../../utils/playerColor.ts";
import { MatchPlayerCard } from "../matchPlayerCard/matchPlayerCard.tsx";
import { clsx } from 'clsx';

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
  meeples: Array<{ tileInstanceId: string, zoneId: string, actorId: string, seat?: number }>;
  currentTurn?: {
    drawnTile: {
      tileId: string;
      imageUrl: string;
    } | null;
    placedTile?: Tile;
  };
  deck?: {
    remainingCount: number;
  };
}

export interface Tile {
  tileId: string;
  x: number;
  y: number;
  rotation: number;
  instanceId?: string;
}

const GameRoom = () => {
  const { id: inviteCode } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.actor);

  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [match, setMatch] = useState<MatchStatePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isRoomDeleted, setIsRoomDeleted] = useState(false);
  const [privateState, setPrivateState] = useState<PrivateState | null>(null);
  const [isTilePicked, setIsTilePicked] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);

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
      setMatch(data.payload as MatchStatePayload);
      setIsTilePicked(false); 
      setCurrentRotation(0);
    }

    if (data.type === 'match_private_state') {
      setPrivateState(data.payload as PrivateState);
    }

    if (data.type === 'match_finished') {
      setIsRoomDeleted(true);
    }
  }, []);

  const { sendMessage } = useRoomSocket(room?.id, handleMessage);

  const handlePickTile = () => {
    if (privateState?.isYourTurn && privateState.phase === 'place_tile') {
      setIsTilePicked(!isTilePicked);
    }
  };

  const handlePlaceTile = (x: number, y: number) => {
    if (!room?.id) return;
    
    // Находим доступные ротации для этой точки
    const placement = privateState?.validPlacements.find(p => p.x === x && p.y === y);
    if (!placement) return;

    // Для простоты берем первую доступную ротацию (или текущую, если она валидна)
    const rotation = placement.rotations.includes(currentRotation) 
      ? currentRotation 
      : placement.rotations[0];

    sendMessage('match_action', {
      roomId: room.id,
      action: 'place_tile',
      payload: {
        roomId: room.id,
        x,
        y,
        rotation
      }
    });
    setIsTilePicked(false);
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
    if (room?.id) {
      sendMessage('leave_match', {
        roomId: room.id
      });
      navigate(`/room/${room.id}`);
    }
  };


  if (isLoading) return <div className={sidebarstyles.pageWrapper}>Загрузка...</div>;

  const ownerId = room?.ownerActorId;
  const isOwner = currentUser?.id === ownerId;
  const players = match?.gameState?.players || [];
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.actorId === currentUser?.id) return -1;
    if (b.actorId === currentUser?.id) return 1;
    return 0;
  });
  const gameState = match?.gameState;
  const currentTurnId = gameState?.currentPlayerId;
  const phase = gameState?.phase;
  const drawnTile = gameState?.currentTurn?.drawnTile;
  const remainingTiles = gameState?.deck?.remainingCount;
  const currentTileId = drawnTile?.tileId || "1"; 

  const currentPlayer = players.find(p => p.actorId === currentTurnId);
  const currentColor = getPlayerColorBySeat(currentPlayer?.seat);

  // Находим координаты только что поставленного тайла (из gameState.currentTurn)
  const lastPlacedTile = gameState?.currentTurn?.placedTile;

  // Функция для понятного текста действия
  const getActionText = (phase: string | undefined) => {
    if (phase === 'place_meeple') return 'ставит мипла';
    return 'ставит тайл';
  };

  return (
    <main className={sidebarstyles.pageWrapper}>
      <div className={sidebarstyles.sidebar}>
        <div className={sidebarstyles.sidebar__title}>Игроки</div>
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
        <GameBoard board={gameState?.board?.tiles || []}
          validPlacements={isTilePicked ? privateState?.validPlacements : []}
          onPlaceTile={handlePlaceTile}
          currentTileId={currentTileId}
          phase={phase}
          validMeeplePlacements={privateState?.validMeeplePlacements || []}
          onPlaceMeeple={handlePlaceMeeple}
          lastPlacedTile={lastPlacedTile}
          currentPlayerColor={currentColor} 
          players={players} 
          placedMeeples={gameState?.meeples || []}
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

            <img
              src={TILE_IMAGES[currentTileId]}
              className={clsx(styles.nexTile__image, isTilePicked && styles.nexTile__image_active)}
              onClick={handlePickTile}
              style={{ cursor: privateState?.isYourTurn ? 'pointer' : 'default' }}
            />

            

            <div className={styles.nexTile__count}>
              <img
                src={iconImg}
                alt="Осталось тайлов"
                className={styles.nexTile__countIcon}
              />
              <span className={styles.nexTile__countText}>
                {remainingTiles}
              </span>
            </div>
            {phase === 'place_meeple' && privateState?.isYourTurn && (
              <button className={styles.skipButton} onClick={handleSkipMeeple}>
                Не ставить мипла
              </button>
            )}
          </div>
          
        )}
    </div>

      <Modal isOpen={isExitModalOpen} onClose={() => {setIsExitModalOpen(false); navigate('/')}}>
        <div className={styles.confirmModal}>
        <img src={gameExitImage} alt="gameExitImage" className={styles.confirmModal__image} />
          <h2 className={styles.confirmModal__title}>
            {isOwner
              ? "Вы точно хотите завершить матч для всех игроков?"
              : "Вы точно хотите покинуть игру?"}
          </h2>
          <div className={styles.confirmModal__actions}>
            <button 
              className={styles.confirmModal__btnCancel} 
              onClick={() => setIsExitModalOpen(false)}
            >
              Остаться
            </button>
            <button 
              className={styles.confirmModal__btnConfirm} 
              onClick={() => {handleLeftGame(); navigate('/')}}
            >
              Да, выйти
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isRoomDeleted} onClose={() => navigate('/')}>
        <div className={styles.confirmModal}>
          <h2 className={styles.confirmModal__title}>Комната исчезла</h2>
          <img src={gameExitImage} alt="Игра завершена" className={styles.confirmModal__image} />
          <p className={styles.confirmModal__text}>
            Один из воинов решил покинуть игру. 
            Поэтому весь текущий сеанс был приостановлен.
          </p>
          <div className={styles.confirmModal__layout}>
            <button
              className={styles.confirmModal__btnConfirm}
              onClick={() => navigate('/')}
            >
              Вернуться в долину
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
};

export default GameRoom;