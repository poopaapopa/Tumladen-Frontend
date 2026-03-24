import styles from './sidebar.module.scss';
import castleImage from '../../assets/castle.png';
import { Users } from "lucide-react";

interface SidebarProps {
  onCreateClick: () => void;
}

const Sidebar = ({ onCreateClick }: SidebarProps) => {

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebar__title}>Комнаты</div>
      <div className={styles.sidebar__list}>
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
      </div>

      <button className={styles.sidebar__createButton} onClick={onCreateClick}>Создать</button>
    </div>
  )
}

export default Sidebar