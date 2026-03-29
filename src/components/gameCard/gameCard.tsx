import styles from './GameCard.module.scss';
import { Users } from 'lucide-react';
import clsx from 'clsx';
import image from '../../assets/castle.png';
import { useNavigate } from 'react-router-dom';
import { roomApi } from '../../api/api';

interface GameCardProps {
  title: string;
  description: string;
  imageUrl?: string;
  maxPlayers: number;
  minPlayers: number;
  isHighlight?: boolean;
  onJoin: () => void;
}


function GameCard({ title, description, imageUrl, minPlayers, maxPlayers, isHighlight, onJoin }: GameCardProps) {

  const navigate = useNavigate();

  const handlePlayClick = async () => {
    try {
      // let token = roomApi.getToken();

      // if (!token) {
      //   const name = prompt("Введите ваше имя для входа:", "Игрок");
      //   if (!name) return;

      //   const session = await roomApi.createGuestSession(name);
      //   token = session.token;
      //   console.log("Сессия создана, токен получен");
      // }
      onJoin()
      // 2. Создаем комнату
      const roomData = await roomApi.createRoom(`${title} Room`);
      console.log("Комната создана:", roomData);

      // 3. Переходим в созданную комнату
      if (roomData.inviteCode) {
        navigate(`/room/${roomData.inviteCode}`);
      }
    } catch (e) {
      console.error("Ошибка во время флоу создания комнаты:", e);
    }
  };
  return (
    <div className={clsx(
      styles.gameCard,
      isHighlight && styles.gameCard_highlighted
    )}>
    <svg className={styles.gameCard__borderSvg}>
      <rect
        className={clsx(styles.gameCard__borderRect, styles.gameCard__borderRect_forward)}
        rx="10" width="100%" height="100%" pathLength="100"
      />
      <rect
        className={clsx(styles.gameCard__borderRect, styles.gameCard__borderRect_backward)}
        rx="10" width="100%" height="100%" pathLength="100"
      />
    </svg>

      <div className={styles.gameCard__imageWrapper}>
        <img src={imageUrl ? imageUrl : image} alt={title} className={styles.gameCard__image} />
        <div className={styles.gameCard__overlay}></div>
      </div>

      <div className={styles.gameCard__content}>
        <h3 className={styles.gameCard__title}>{title}</h3>
        <p className={styles.gameCard__description}>{description}</p>

        <div className={styles.gameCard__footer}>
          <button className={styles.gameCard__playBtn} onClick={handlePlayClick}>
            Играть
          </button>

          <div className={styles.gameCard__stats}>
            { minPlayers === maxPlayers ? <span>{maxPlayers}</span> : <span>{minPlayers}-{maxPlayers}</span> }
            <Users size={18} strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameCard