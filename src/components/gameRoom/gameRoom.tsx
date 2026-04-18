import { useNavigate, useParams } from 'react-router-dom';
import styles from './gameRoom.module.scss';
import sidebarstyles from '../mainPage/MainPage.module.scss'
import { useRoomSocket, type WebSocketMessage } from '../../api/ws';
import { useState, useCallback, useEffect } from 'react';
import { roomService, type RoomResponse } from '../../api/room';
import castleImage from '../../assets/castle.png';
import { User, Star, Crown} from "lucide-react";
import { useUserStore } from '../../store/useUserStore';
import clsx from 'clsx';
import Modal from '../modal/modal';
import gameExitImage from '../../assets/gameExit.png';
import GameBoard from "../gameBoard/gameBoard.tsx";
import { TILE_IMAGES } from "../../api/tiles.config.ts";
import { getPlayerColorBySeat } from "../../utils/playerColor.ts";

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
  phase: string;
  board: Tile[];
}

export interface Tile {
  tileId: string;
  x: number;
  y: number;
  rotation: number;
}

const GameRoom = () => {
  const { id: inviteCode } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.actor);

  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [match, setMatch] = useState<MatchStatePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

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
    }
  }, []);

  const { sendMessage } = useRoomSocket(room?.id, handleMessage);

  const handleLeftGame = () => {
    if (room?.id) {
      sendMessage('finish_room_match', {
        roomId: room.id
      });
      navigate('/');
    }
  };

  if (isLoading) return <div className={sidebarstyles.pageWrapper}>Загрузка...</div>;

  const currentTurnId = match?.gameState?.currentPlayerId;
  const isMyTurn = currentUser?.id === currentTurnId;
  const isOwner = currentUser?.id === room?.ownerActorId;
  const currentTileId = "1";
  const currentPlayer = match?.gameState?.players?.find(p => p.actorId === currentTurnId);
  const currentColor = getPlayerColorBySeat(currentPlayer?.seat);

  return (
    <main className={sidebarstyles.pageWrapper}>
      <div className={sidebarstyles.sidebar}>
        <div className={sidebarstyles.sidebar__title}>Игроки</div>
        <div className={sidebarstyles.sidebar__list}>
          {room?.participants?.map((participant) =>{
            const isRoomOwner = participant.actorId === room.ownerActorId;
            const isTurn = participant.actorId === currentTurnId;

            const matchStats = match?.gameState?.players?.find(
              (p) => p.actorId === participant.actorId
            );

            return (
              <div
                key={participant.actorId}
                className={clsx(
                  styles.playerCard,
                  currentTurnId && (isTurn ? styles.playerCard_active : styles.playerCard_dimmed)
                )}
              >
                <img src={castleImage} alt="Room" className={styles.playerCard__image} />
                <div className={styles.playerCard__body}>
                  <div className={styles.playerCard__nickname}>
                    {participant.displayName}
                    {isRoomOwner && <Crown size={16} style={{marginLeft: '8px', color: '#d4af37'}} />}
                  </div>

                  <div className={styles.playerCard__figurines}>
                    {Array.from({ length: matchStats?.meeplesLeft ?? 0 }).map((_, i) => (
                      <User key={i} size={20} strokeWidth={2.5} className={styles.playerCard__figurinesIcon} />
                    ))}
                  </div>

                  <div className={styles.playerCard__footer}>
                    <div className={styles.playerCard__capacity}>
                      <span className={styles.playerCard__count}>
                        <Star size={20} strokeWidth={2.5} className={styles.playerCard__figurinesIcon} />
                        {matchStats?.score ?? 0} очков
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={() => setIsExitModalOpen(true)} className={styles.leftGameButton}>
          Покинуть игру
        </button>
      </div>

      <div className={styles.boardContainer}>
        <GameBoard
          board={match?.gameState?.board || []}
        />
        {currentTileId && (
          <img
            src={TILE_IMAGES[currentTileId]}
            alt="Next tile"
            className={styles.nexTile}
            style={{
              ['--player-color' as string]: currentColor
            }}
          />
        )}

       {/* UI элементы поверх поля (например, текущий тайл в руке) */}
       {isMyTurn && (
         <div className={styles.turnOverlay}>
            <p>Выбери место на карте</p>
         </div>
       )}
    </div>

      <Modal isOpen={isExitModalOpen} onClose={() => setIsExitModalOpen(false)}>
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
              onClick={handleLeftGame}
            >
              Да, выйти
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
};

export default GameRoom;