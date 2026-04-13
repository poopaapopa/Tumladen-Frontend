import { useNavigate, useParams } from 'react-router-dom';
import styles from './gameRoom.module.scss';
import sidebarstyles from '../mainPage/MainPage.module.scss'
import { useRoomSocket } from '../../api/ws';
import { useState, useCallback, useEffect } from 'react';
import { roomService, type RoomResponse } from '../../api/room';
import castleImage from '../../assets/castle.png';
import { User, Star, Crown} from "lucide-react";
import { useUserStore } from '../../store/useUserStore';
import clsx from 'clsx';
import { type MatchStatePayload, type WsPayload, type WsErrorPayload} from '../../api/room';
import Modal from '../modal/modal';
import gameExitImage from '../../assets/gameExit.png';

type CombinedRoomState = RoomResponse & Partial<MatchStatePayload>;

const GameRoom = () => {
  const { id: inviteCode } = useParams<{ id: string }>(); 
  const [roomUuid, setRoomUuid] = useState<string | null>(null); 
  const [roomState, setRoomState] = useState<CombinedRoomState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.actor);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  const fetchInitialData = useCallback(async () => {
    if (!inviteCode) return;
    try {
      const data = await roomService.getRoomById(inviteCode);
      setRoomUuid(data.room.id); 
      setRoomState(data.room);
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

  const handleMessage = useCallback((type: string, payload: WsPayload) => {
    if (type === 'error') {
      const error = payload as WsErrorPayload;
      console.error("WS Error:", error.message);
      return;
    }

    setRoomState((prev) => {
      if (!prev) return payload as CombinedRoomState;
      return {
        ...prev,
        ...payload,
      } as CombinedRoomState;
    });

    // if (payload.status === 'finished' || payload.status === 'waiting' && type === 'room_state') {
    //    navigate(`/room/${inviteCode}`); 
    // }
  }, []);

  const { sendMessage } = useRoomSocket(roomUuid || undefined, handleMessage);

  const handleAdvanceTurn = () => {
    if (roomState?.id) {
      sendMessage('match_action', {
        roomId: roomUuid,
        action: "advance_turn",
        payload: {}
      });
    }
  };


  const handleLeftGame = () => {
    if (roomState?.id) {
      sendMessage('finish_room_match', {
        roomId: roomUuid
      });
      navigate('/');
    }
  };


  if (isLoading) {
    return <div className={sidebarstyles.pageWrapper}>Загрузка...</div>;
  }

  const currentTurnId = roomState?.gameState?.currentPlayerId || roomState?.currentTurnActorId;
  
  const isMyTurn = roomState?.isYourTurn ?? (currentUser?.id === currentTurnId);
  const isOwner = currentUser?.id === roomState?.ownerActorId;

  return (
    <main className={sidebarstyles.pageWrapper}>
      <div className={sidebarstyles.sidebar}>
        <div className={sidebarstyles.sidebar__title}>Игроки</div>
        <div className={sidebarstyles.sidebar__list}>
          {roomState?.participants?.map((participant) =>{
            const isOwner = participant.actorId === roomState.ownerActorId;
            const isTurn = participant.actorId === currentTurnId;

            const matchPlayerData = roomState?.gameState?.players?.find(
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
                    {isOwner && <Crown size={16} style={{marginLeft: '8px', color: '#d4af37'}} />}
                  </div>

                  <div className={styles.playerCard__figurines}>
                    {Array.from({ length: matchPlayerData?.meeplesLeft ?? 0 }).map((_, i) => (
                      <User key={i} size={20} strokeWidth={2.5} className={styles.playerCard__figurinesIcon} />
                    ))}
                  </div>

                  <div className={styles.playerCard__footer}>
                    <div className={styles.playerCard__capacity}>
                      <span className={styles.playerCard__count}>
                        <Star size={20} strokeWidth={2.5} className={styles.playerCard__figurinesIcon} />
                        {matchPlayerData?.score ?? 0} очков
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );            
          })}
        </div>

        <button onClick={handleAdvanceTurn} disabled={!isMyTurn} className={styles.advanceTurnButton}>
          {isMyTurn ? 'ВАШ ХОД' : 'ОЖИДАНИЕ ХОДА'}
        </button>

        <button onClick={() => setIsExitModalOpen(true)} className={styles.leftGameButton}>
          Покинуть игру
        </button>
      </div>

      <div className={sidebarstyles.mainPage}>
        <h1 className={styles.title}>Игра началась</h1>
        {isMyTurn && <h2 className={styles.turnIndicator}>Ваша очередь выкладывать тайл!</h2>}
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