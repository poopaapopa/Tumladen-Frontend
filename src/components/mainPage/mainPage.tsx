import styles from './MainPage.module.scss';
import GameCard from "./gameCard/gameCard.tsx";
import RoomCard from "./roomCard/roomCard.tsx";
import RoomCardSkeleton from './roomCard/roomCardSkeleton'
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomService, UnauthorizedError } from "@/api/room.ts";
import type { RoomResponse } from '@/types/room.ts';
import { useUserStore } from "@/store/useUserStore.ts";
import sadElfImg from '@/assets/sad-elf.png';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import RangeSlider from '../rangeSlider/rangeSlider.tsx';

interface MainPageProps {
  onPlayClick: () => void;
}

type PendingAction = { type: 'create' | 'quick'; gameId: number };

interface Game {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  minPlayers: number;
  maxPlayers: number;
  duration: string;
  gameType: string;
}

const ALL_GAMES_FILTER = 'all';

const PLAYERS_MIN = 2;
const PLAYERS_MAX = 8;

// Дискретные точки на оси «время на ход». Последний слот (null) соответствует
// бесконечному ходу (turnTimeSeconds === 0 в данных комнаты).
const TURN_TIME_POINTS: ReadonlyArray<number | null> = [30, 60, 90, 120, 180, null];
const TURN_TIME_MIN_INDEX = 0;
const TURN_TIME_MAX_INDEX = TURN_TIME_POINTS.length - 1;

const formatTurnTime = (index: number) => {
  const point = TURN_TIME_POINTS[index];
  return point === null ? '∞' : `${point}с`;
};

function MainPage({ onPlayClick }: MainPageProps) {
  const navigate = useNavigate();

  const { isAuthenticated, actor } = useUserStore();

  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [busyGameId, setBusyGameId] = useState<number | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [lastFailedAction, setLastFailedAction] = useState<PendingAction | null>(null);

  const [gameFilter, setGameFilter] = useState<string>(ALL_GAMES_FILTER);
  const [playersRange, setPlayersRange] = useState<[number, number]>([PLAYERS_MIN, PLAYERS_MAX]);
  const [turnTimeRange, setTurnTimeRange] = useState<[number, number]>([
    TURN_TIME_MIN_INDEX,
    TURN_TIME_MAX_INDEX,
  ]);

  const games: Game[] = [
    {
      id: 1,
      title: 'Fortresses & Roads',
      description: 'Игроки выступают в роли средневековых феодалов, осваивающих земли вокруг одноименной французской крепости, по очереди выкладывая квадраты местности (города, дороги, монастыри) и размещая на них подданных для набора очков.',
      minPlayers: 2,
      maxPlayers: 5,
      duration: '20 мин',
      gameType: 'carcassonne',
    },
  ];

  const findGameById = (id: number) => games.find((g) => g.id === id);

  const createRoomForGame = async (gameId: number) => {
    if (busyGameId !== null) return;

    if (!isAuthenticated) {
      setPendingAction({ type: 'create', gameId });
      onPlayClick();
      return;
    }

    setCreateError(null);
    setLastFailedAction(null);
    setBusyGameId(gameId);

    try {
      const newRoom = await roomService.createRoom(`Комната «${actor?.displayName}»`);
      navigate(`/room/${newRoom.inviteCode}`);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        // токен протух между проверкой и запросом — повторим после повторной авторизации
        setPendingAction({ type: 'create', gameId });
        onPlayClick();
      } else {
        const message = err instanceof Error && err.message
          ? err.message
          : 'Не удалось создать комнату. Попробуйте ещё раз.';
        setCreateError(message);
        setLastFailedAction({ type: 'create', gameId });
      }
    } finally {
      setBusyGameId(null);
    }
  };

  const quickPlayForGame = async (gameId: number) => {
    if (busyGameId !== null) return;

    if (!isAuthenticated) {
      setPendingAction({ type: 'quick', gameId });
      onPlayClick();
      return;
    }

    const game = findGameById(gameId);
    const targetType = game?.gameType;
    const availableRoom = rooms.find(
      (r) =>
        r.status === 'waiting' &&
        r.playersCount < r.maxPlayers &&
        (!targetType || r.gameType === targetType),
    );

    if (availableRoom) {
      navigate(`/room/${availableRoom.inviteCode}`);
      return;
    }

    // нет подходящей комнаты — создаём новую
    await createRoomForGame(gameId);
  };

  const runAction = (action: PendingAction) => {
    if (action.type === 'create') {
      void createRoomForGame(action.gameId);
    } else {
      void quickPlayForGame(action.gameId);
    }
  };

  useEffect(() => {
    if (isAuthenticated && pendingAction) {
      const action = pendingAction;
      setPendingAction(null);
      runAction(action);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, pendingAction]);

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

  const filteredRooms = useMemo(() => {
    const [pMin, pMax] = playersRange;
    const [tMinIdx, tMaxIdx] = turnTimeRange;

    // Конечные пределы по числовым точкам в выбранном диапазоне (null-слот исключаем).
    const numericIndices: number[] = [];
    for (let i = tMinIdx; i <= tMaxIdx; i++) {
      if (TURN_TIME_POINTS[i] !== null) numericIndices.push(i);
    }
    const finiteMin = numericIndices.length > 0 ? (TURN_TIME_POINTS[numericIndices[0]] as number) : null;
    const finiteMax = numericIndices.length > 0
      ? (TURN_TIME_POINTS[numericIndices[numericIndices.length - 1]] as number)
      : null;

    // Бесконечный ход (turnTimeSeconds === 0) проходит, если в диапазон попал слот ∞.
    const allowUnlimited =
      TURN_TIME_POINTS[tMinIdx] === null || TURN_TIME_POINTS[tMaxIdx] === null;

    return rooms.filter((r) => {
      if (r.playersCount >= r.maxPlayers) return false;
      if (gameFilter !== ALL_GAMES_FILTER && r.gameType !== gameFilter) return false;
      if (r.maxPlayers < pMin || r.maxPlayers > pMax) return false;

      const turnTimeRaw = r.settings?.['turnTimeSeconds'];
      const turnTime = typeof turnTimeRaw === 'number' ? turnTimeRaw : null;
      if (turnTime === null) return true; // нет данных — не отсеиваем

      if (turnTime === 0) return allowUnlimited;
      if (finiteMin === null || finiteMax === null) return false;
      return turnTime >= finiteMin && turnTime <= finiteMax;
    });
  }, [rooms, gameFilter, playersRange, turnTimeRange]);

  const isBusy = busyGameId !== null;

  return (
    <main className={styles.pageWrapper}>
      <div className={styles.sidebar}>
        <div className={styles.sidebar__title}>Комнаты</div>

        <div className={styles.sidebar__filters} role="tablist" aria-label="Фильтр комнат по игре">
          <button
            type="button"
            role="tab"
            aria-selected={gameFilter === ALL_GAMES_FILTER}
            className={clsx(
              styles.sidebar__filterChip,
              gameFilter === ALL_GAMES_FILTER && styles.sidebar__filterChip_active,
            )}
            onClick={() => setGameFilter(ALL_GAMES_FILTER)}
          >
            Все
          </button>
          {games.map((game) => (
            <button
              key={game.gameType}
              type="button"
              role="tab"
              aria-selected={gameFilter === game.gameType}
              className={clsx(
                styles.sidebar__filterChip,
                gameFilter === game.gameType && styles.sidebar__filterChip_active,
              )}
              onClick={() => setGameFilter(game.gameType)}
            >
              {game.title}
            </button>
          ))}
        </div>

        <div className={styles.sidebar__rangeFilters}>
          <RangeSlider
            label="Игроков в комнате"
            min={PLAYERS_MIN}
            max={PLAYERS_MAX}
            step={1}
            value={playersRange}
            onChange={setPlayersRange}
          />
          <RangeSlider
            label="Время на ход"
            min={TURN_TIME_MIN_INDEX}
            max={TURN_TIME_MAX_INDEX}
            step={1}
            value={turnTimeRange}
            onChange={setTurnTimeRange}
            formatValue={formatTurnTime}
          />
        </div>

        <div className={styles.sidebar__list}>
          {isLoadingRooms ? (
            <>
              <RoomCardSkeleton />
              <RoomCardSkeleton />
              <RoomCardSkeleton />
              <RoomCardSkeleton />
              <RoomCardSkeleton />
            </>
          ) : filteredRooms.length > 0 ? (
            filteredRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onClick={() => handleJoinRoom(room.inviteCode)}
              />
            ))
          ) : (
            <div className={styles.sidebar__statusContainer}>
              <img src={sadElfImg} alt="Одинокий эльф" className={styles.sidebar__emptyImg} />
              <div className={styles.sidebar__info}>
                В долине пока ни души...
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.mainPage}>
        <h2 className={styles.mainPage__title}>Игры</h2>

        <div className={styles.mainPage__grid}>
          {games.map((game) => (
            <GameCard
              {...game}
              key={game.id}
              isLoading={busyGameId === game.id}
              disabled={isBusy && busyGameId !== game.id}
              onQuickPlay={() => quickPlayForGame(game.id)}
              onCreateRoom={() => createRoomForGame(game.id)}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {createError && (
          <motion.div
            key="create-error-toast"
            className={styles.errorToast}
            role="alert"
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
          >
            <AlertTriangle size={20} className={styles.errorToast__icon} strokeWidth={2.5} />
            <span className={styles.errorToast__text}>{createError}</span>
            {lastFailedAction !== null && (
              <button
                type="button"
                className={styles.errorToast__retry}
                onClick={() => runAction(lastFailedAction)}
                disabled={isBusy}
              >
                Повторить
              </button>
            )}
            <button
              type="button"
              className={styles.errorToast__close}
              onClick={() => { setCreateError(null); setLastFailedAction(null); }}
              aria-label="Закрыть сообщение об ошибке"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default MainPage
