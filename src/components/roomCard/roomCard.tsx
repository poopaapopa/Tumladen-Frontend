import styles from './roomСard.module.scss';
import castleImage from '../../assets/castle.png';
import { Users } from "lucide-react";

// Определяем, что ждем объект комнаты
interface RoomCardProps {
  room: {
    id: string;
    name: string;
    status: string;
    code: string;
  }
}

const RoomCard = ({ room }: RoomCardProps) => {
  const statusTranslations: Record<string, string> = {
    'waiting': 'Ожидание игроков',
    'started': 'В игре',
    'finished': 'Завершена'
  };

  return (
    <div className={styles['room-card']}>
      <img src={castleImage} alt="##" className={styles['room-card__image']} />
      <div className={styles['room-card__body']}>
        <div className={styles['room-card__name']}>{room.name}</div>
        <div className={styles['room-card__settings']}>Описание настроек игры в комнате</div>
        <div className={styles['room-card__footer']}>
          <div className={styles['room-card__status']}>
            {statusTranslations[room.status] || room.status}
          </div>
          <div className={styles['room-card__capacity']}>
            {/* Пока в API нет поля "количество игроков", оставим заглушку или 0 */}
            <span className={styles['room-card__count']}>?</span>
            <Users size={18} strokeWidth={2.5} className={styles['room-card__icon']} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;