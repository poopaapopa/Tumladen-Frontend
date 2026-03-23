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

      </div>

      <button className={styles['sidebar__create-button']} onClick={onCreateClick}>Создать</button>
    </div>
  )
}

export default Sidebar