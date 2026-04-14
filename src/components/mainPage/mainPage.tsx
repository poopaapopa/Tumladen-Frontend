import styles from './MainPage.module.scss';
import GameCard from "../gameCard/gameCard.tsx";
import RoomCard from "../roomCard/roomCard.tsx";
import RoomCardSkeleton from '../roomCard/roomCardSkeleton'
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type RoomResponse, roomService } from "../../api/room.ts";
import { useUserStore } from "../../store/useUserStore.ts";
import sadElfImg from '../../assets/sad-elf.png';

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

  useEffect(() => {
    if (isAuthenticated && isSelecting && pendingGameId) {
      handleGameAction(pendingGameId);
      setPendingGameId(null);
    }
  }, [isAuthenticated, isSelecting, pendingGameId]);
  
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

    try {
       const newRoom = await roomService.createRoom(`Комната «${actor?.displayName}»`);
       console.log(newRoom);
       setIsSelecting(false);
       navigate(`/room/${newRoom.inviteCode}`);
    } catch {
       alert("Ошибка");
    }
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

  const games: Game[] = [
    { id: 1, title: 'Легенда', description: 'Классическая битва за территории с эльфийской магией.', minPlayers: 2, maxPlayers: 5 },
    { id: 2, title: 'Долина', description: 'Усложненные правила строительства в горах.', minPlayers: 3, maxPlayers: 6 },
    { id: 3, title: 'Холм', description: 'Быстрая партия для двоих игроков.', minPlayers: 2, maxPlayers: 2 },
    { id: 4, title: 'Холм', description: 'Быстрая партия для двоих игроков.', minPlayers: 2, maxPlayers: 2 },
    { id: 5, title: 'Холм', description: 'Быстрая партия для двоих игроков.', minPlayers: 2, maxPlayers: 2 },
  ];

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
          <div className={styles.selectionModal}>
            <p>Выберите игру для создания комнаты</p>
            <button onClick={() => setIsSelecting(false)} className={styles.cancelBtn}>
              Отмена
            </button>
          </div>
        )}

        <h2 className={styles.mainPage__title}>Игры</h2>

        <div className={styles.mainPage__grid}>
          {games.map((game) => (
            <GameCard {...game} key={ game.id } isHighlight={isSelecting} onJoin={() => handleGameAction(game.id)}/>
          ))}
        </div>
      </div>
    </main>
  );
}

export default MainPage