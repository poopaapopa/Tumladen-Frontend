import styles from './MainPage.module.scss';
import GameCard from "../gameCard/gameCard.tsx";
import RoomCard from "../roomCard/roomCard.tsx";
import RoomCardSkeleton from '../roomCard/roomCardSkeleton'
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomService } from "@/api/room.ts";
import type { RoomResponse } from '@/types/room.ts';
import { useUserStore } from "@/store/useUserStore.ts";
import sadElfImg from '@/assets/sad-elf.png';
import { AlertTriangle, X } from 'lucide-react';

interface MainPageProps {
  isSelecting: boolean;
  setIsSelecting: (val: boolean) => void;
  onPlayClick: () => void;
}

interface Game {
  id: number,
  title: string,
  description: string,
  imageUrl?: string,
  minPlayers: number,
  maxPlayers: number,
}

function MainPage({ isSelecting, setIsSelecting, onPlayClick }: MainPageProps) {
  const navigate = useNavigate();

  const { isAuthenticated, actor } = useUserStore();

  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  const [pendingGameId, setPendingGameId] = useState<number | null>(null);
  const [creatingGameId, setCreatingGameId] = useState<number | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [lastFailedGameId, setLastFailedGameId] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthenticated && isSelecting && pendingGameId) {
      handleGameAction(pendingGameId);
      setPendingGameId(null);
    }
  }, [isAuthenticated, isSelecting, pendingGameId]);

  const createRoomForGame = async (gameId: number) => {
    if (creatingGameId !== null) return;

    setCreateError(null);
    setLastFailedGameId(null);
    setCreatingGameId(gameId);

    try {
      const newRoom = await roomService.createRoom(`Комната «${actor?.displayName}»`);
      setIsSelecting(false);
      navigate(`/room/${newRoom.inviteCode}`);
    } catch (err) {
      const message = err instanceof Error && err.message
        ? err.message
        : 'Не удалось создать комнату. Попробуйте ещё раз.';
      setCreateError(message);
      setLastFailedGameId(gameId);
    } finally {
      setCreatingGameId(null);
    }
  };

  const handleGameAction = async (gameId: number) => {
    if (!isSelecting) {
      onPlayClick();
      return;
    }

    if (!isAuthenticated) {
      setPendingGameId(gameId);
      onPlayClick();
      return;
    }

    await createRoomForGame(gameId);
  };

  const fetchRooms = async () => {
    try {
      const data = await roomService.getPublicRooms();
      setRooms(data.rooms);
    } catch (err) {
      console.error("Не удалось загрузить комнаты", err);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchRooms();

    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinRoom = (roomId: string) => {
    navigate(`/room/${roomId}`);
  };

  const handleCancelSelection = () => {
    setIsSelecting(false);
    setCreateError(null);
    setLastFailedGameId(null);
    setPendingGameId(null);
  };

  const games: Game[] = [
    { id: 1, title: 'Легенда', description: 'Классическая битва за территории с эльфийской магией.', minPlayers: 2, maxPlayers: 5 },
    { id: 2, title: 'Долина', description: 'Усложненные правила строительства в горах.', minPlayers: 3, maxPlayers: 6 },
    { id: 3, title: 'Холм', description: 'Быстрая партия для двоих игроков.', minPlayers: 2, maxPlayers: 2 },
    { id: 4, title: 'Холм', description: 'Быстрая партия для двоих игроков.', minPlayers: 2, maxPlayers: 2 },
    { id: 5, title: 'Холм', description: 'Быстрая партия для двоих игроков.', minPlayers: 2, maxPlayers: 2 },
  ];

  const isCreating = creatingGameId !== null;

  return (
    <main className={styles.pageWrapper}>
      <div className={styles.sidebar}>
        <div className={styles.sidebar__title}>Комнаты</div>
        <div className={styles.sidebar__list}>
          {isLoadingRooms ? (
            <>
              <RoomCardSkeleton />
              <RoomCardSkeleton />
              <RoomCardSkeleton />
              <RoomCardSkeleton />
              <RoomCardSkeleton />
            </>
          ) : rooms.length > 0 ? (
            rooms.map(room => (
              <RoomCard
                key={room.id}
                room={room}
                onClick={() => handleJoinRoom(room.inviteCode)}
              />
            ))
          ) : (
            <div className={styles.sidebar__statusContainer}>
              <img src={sadElfImg} alt="Одинокий эльф" className={styles.sidebar__emptyImg} />
              <div className={styles.sidebar__info}>В долине пока ни души...</div>
            </div>
          )}
        </div>

        <button className={styles.sidebar__createButton} onClick={() => setIsSelecting(true)}>Создать</button>
      </div>

      <div className={styles.mainPage}>
        {isSelecting && (
          <div className={styles.selectionModal} role="status" aria-live="polite">
            <p>
              {isCreating
                ? 'Создаём комнату…'
                : 'Выберите игру для создания комнаты'}
            </p>
            <button
              type="button"
              onClick={handleCancelSelection}
              disabled={isCreating}
              className={styles.cancelBtn}
              aria-label="Отменить создание комнаты"
            >
              Отмена
            </button>
          </div>
        )}

        {createError && (
          <div className={styles.errorBanner} role="alert">
            <AlertTriangle size={20} strokeWidth={2.5} />
            <span className={styles.errorBanner__text}>{createError}</span>
            {lastFailedGameId !== null && (
              <button
                type="button"
                className={styles.errorBanner__retry}
                onClick={() => createRoomForGame(lastFailedGameId)}
                disabled={isCreating}
              >
                Повторить
              </button>
            )}
            <button
              type="button"
              className={styles.errorBanner__close}
              onClick={() => { setCreateError(null); setLastFailedGameId(null); }}
              aria-label="Закрыть сообщение об ошибке"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        )}

        <h2 className={styles.mainPage__title}>Игры</h2>

        <div className={styles.mainPage__grid}>
          {games.map((game) => (
            <GameCard
              {...game}
              key={game.id}
              isHighlight={isSelecting}
              isLoading={creatingGameId === game.id}
              disabled={isCreating && creatingGameId !== game.id}
              onJoin={() => handleGameAction(game.id)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

export default MainPage
