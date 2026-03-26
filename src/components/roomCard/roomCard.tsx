import styles from './roomСard.module.scss';
import castleImage from '../../assets/castle.png';
import { Users } from "lucide-react";

const RoomCard = () => {

  return (
    <div className={styles['room-card']}>
      <img src={castleImage} alt="##" className={styles['room-card__image']} />
      <div className={styles['room-card__body']}>
        <div className={styles['room-card__name']}>Название карточки</div>
        <div className={styles['room-card__settings']}>Описание настроек игры в комнате</div>
        <div className={styles['room-card__footer']}>
          <div className={styles['room-card__status']}>Ожидание игроков</div>
          <div className={styles['room-card__capacity']}>
            <span className={styles['room-card__count']}>4/5</span>
              {}
            <Users size={18} strokeWidth={2.5} className={styles['room-card__icon']} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoomCard