import styles from './roomPage.module.scss';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, Star, Ban } from 'lucide-react';
import castleImg from '../../assets/zamok-karkasson.jpg';

const RoomPage = () => {
  // const { id } = useParams();
  const navigate = useNavigate();

  const roomData = {
    name: "Название комнаты",
    gameTitle: "CARCASSONNE",
    maxPlayers: 4,
    timer: 120,
    players: [
      { id: '1', displayName: 'Ecthelion', isOwner: true },
      { id: '2', displayName: 'Никнейм', isOwner: false },
    ]
  };

  return (
    <div className={styles['room-page']}>
      <aside className={styles['room-page__sidebar']}>
        <div className={styles['room-page__config-box']}>
          Комната {roomData.players[0].displayName}
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
                  {player?.displayName || ""}
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