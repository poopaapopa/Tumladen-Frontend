import styles from './roomCard.module.scss';
import castleImage from '../../assets/castle.png';
import { Users } from "lucide-react";

function RoomCard() {
  return (
    <div className={styles.roomCard}>
      <img src={castleImage} alt="##" className={styles.roomCard__image} />
      <div className={styles.roomCard__body}>
        <div className={styles.roomCard__name}>Название карточки</div>
        <div className={styles.roomCard__settings}>Описание настроек игры в комнате</div>
        <div className={styles.roomCard__footer}>
          <div className={styles.roomCard__status}>Ожидание игроков</div>
          <div className={styles.roomCard__capacity}>
            <span className={styles.roomCard__count}>4/5</span>
              {}
            <Users size={18} strokeWidth={2.5} className={styles.roomCard__icon} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoomCard