import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Clock, Star, Crown, LogOut, Share2 } from 'lucide-react';
import styles from './roomPage.module.scss';
import castleImg from '../../assets/zamok.png';
import { roomService } from '../../api/room.ts'
import type { RoomResponse } from '../../api/room.ts'
import { useUserStore } from '../../store/useUserStore';

const RoomPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const currentUser = useUserStore((state) => state.actor);

  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoomData = async () => {
    if (!id) return;
    try {
      const data = await roomService.getRoomById(id);
      setRoom(data.room);
      setError(null);
    } catch (e) {
      setError("Не удалось войти в чертоги комнаты...");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomData();
  }, [id]);

  if (isLoading) return <div className={styles.loading}>Загрузка...</div>;
  if (error || !room) return <div className={styles.error}>{error || "Ошибка"}</div>;

  const isOwner = currentUser?.id === room.ownerActorId;

  return (
    <div className={styles.roomPage}>
      <aside className={styles.roomPage__sidebar}>
        <div className={styles.roomPage__header}>
           <h2 className={styles.roomPage__roomName}>{room.name}</h2>
           <span className={styles.roomPage__status}>{room.status}</span>
        </div>

        <div className={styles.roomPage__configGrid}>
          <div className={styles.roomPage__configBox}>
            <Users size={20} />
            <span>{room.maxPlayers}</span>
          </div>
          <div className={styles.roomPage__configBox}>
            <Clock size={20} />
            <span>120с</span>
          </div>
        </div>

        {isOwner ? (
          <button
            className={styles.roomPage__btnStart}
            disabled={!room.canStart}
          >
            Начать игру
          </button>
        ) : (
          <div className={styles.roomPage__waitMessage}>
            Ожидаем решения организатора...
          </div>
        )}
      </aside>

      <main className={styles.roomPage__main}>
        <div className={styles.roomPage__visual}>
          <img src={castleImg} alt="Game Art" className={styles.roomPage__image} />
          <div className={styles.roomPage__overlay} />
        </div>
        <h1 className={styles.roomPage__gameTitle}>{room.gameType}</h1>
        <div className={styles.roomPage__rules}>Правила игры...</div>
      </main>

      <section className={styles.roomPage__players}>
        <h3 className={styles.roomPage__playersTitle}>
          Участники:
        </h3>

        <div className={styles.roomPage__playerList}>
          {Array.from({ length: room.maxPlayers }).map((_, idx) => {
            const participant = room.participants?.[idx];
            const isThisParticipantOwner = participant?.actorId === room.ownerActorId;

            return (
              <div
                key={idx}
                className={`${styles.roomPage__playerSlot} ${participant ? styles.roomPage__playerSlot_occupied : ''}`}
              >
                <div className={styles.roomPage__playerInfo}>
                  <span className={styles.roomPage__slotNum}>{idx + 1}</span>
                  <span className={styles.roomPage__playerName}>
                    {participant?.displayName || "Ожидание..."}
                  </span>
                </div>

                {participant && (
                  <div className={styles.roomPage__playerBadge}>
                    {isThisParticipantOwner ? (
                      <Crown size={18} className={styles.icon_crown} />
                    ) : (
                      <Star size={18} className={styles.icon_star} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className={styles.roomPage__actions}>
          <button className={styles.roomPage__btnInvite}>
            <Share2 size={18} /> Пригласить
          </button>
          <button
            className={styles.roomPage__btnExit}
            onClick={() => navigate('/')}
          >
            <LogOut size={18} /> Покинуть
          </button>
        </div>
      </section>
    </div>
  );
};

export default RoomPage;