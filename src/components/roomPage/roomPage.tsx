import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Clock, Star, Ban } from 'lucide-react';
import styles from './roomPage.module.scss';
import castleImg from '../../assets/zamok-karkasson.jpg';
import { roomApi } from '../../api/api';

// 1. Описываем типы данных из API
interface Player {
  id: string;
  displayName: string;
  isOwner: boolean;
}

interface RoomData {
  id: string;
  name: string;
  gameTitle?: string;
  maxPlayers: number;
  timer: number;
  players: Player[];
  status: string;
}

const RoomPage = () => {
  const { id } = useParams<{ id: string }>(); // Получаем ID из /room/:id
  const navigate = useNavigate();
  
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchRoom = async () => {
      try {
        setIsLoading(true);
        console.log(id)
        const data = await roomApi.getRoomById(id);
        
        setRoomData({
          ...data,
          gameTitle: data.gameTitle || "CARCASSONNE",
          maxPlayers: data.maxPlayers || 4,
          timer: data.timer || 120,
          players: data.players || [] // Если бэк не шлет список, будет пустой массив
        });
      } catch (e) {
        console.error("Ошибка при загрузке комнаты:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoom();
    
    // const interval = setInterval(fetchRoom, 3000);
    // return () => clearInterval(interval);
  }, [id]);

  if (isLoading) return <div className={styles['room-page']}>Загрузка...</div>;
  if (!roomData) return <div className={styles['room-page']}>Комната не найдена</div>;

  return (
    <div className={styles['room-page']}>
      <aside className={styles['room-page__sidebar']}>
        <div className={styles['room-page__config-box']}>
          {roomData.name}
        </div>
        
        <div className={styles['room-page__config-row']}>
          <div className={styles['room-page__config-box--small']}>
            {roomData.maxPlayers} <Users size={20} />
          </div>
          <div className={styles['room-page__config-box--small']}>
            {roomData.timer} с. <Clock size={20} />
          </div>
        </div>

        <button className={styles['room-page__btn--start']}>
          Начать игру
        </button>
      </aside>

      <main className={styles['room-page__main']}>
        <div className={styles['room-page__image-container']}>
          <img src={castleImg} alt="Game Art" className={styles['room-page__image']} />
          <div className={styles['room-page__image-overlay']} />
        </div>
        <h1 className={styles['room-page__game-title']}>{roomData.gameTitle}</h1>
        <button className={styles['room-page__rules-btn']}>Правила игры</button>
      </main>

      <section className={styles['room-page__players']}>
        <h3 className={styles['room-page__players-title']}>
          Игроки ({roomData.players.length}/{roomData.maxPlayers}):
        </h3>

        <div className={styles['room-page__player-list']}>
          {Array.from({ length: roomData.maxPlayers }).map((_, idx) => {
            const player = roomData.players[idx];
            return (
              <div key={idx} className={styles['room-page__player-slot']}>
                <span className={styles['room-page__player-num']}>{idx + 1}</span>
                <span className={styles['room-page__player-name']}>
                  {player?.displayName || "Ожидание..."}
                </span>
                {player && (
                  player.isOwner ? <Star size={20} fill="currentColor" /> : <Ban size={20} />
                )}
              </div>
            );
          })}
        </div>

        <div className={styles['room-page__actions']}>
          <button className={styles['room-page__btn--invite']}>Пригласить</button>
          <button 
            className={styles['room-page__btn--exit']} 
            onClick={() => navigate('/')}
          >
            Выйти
          </button>
        </div>
      </section>
    </div>
  );
};

export default RoomPage;