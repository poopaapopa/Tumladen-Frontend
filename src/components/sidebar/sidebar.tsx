import styles from './sidebar.module.scss';
import castleImage from '../../assets/castle.png';
import { Users } from "lucide-react";

interface SidebarProps {
  onCreateClick: () => void;
}

const Sidebar = ({ onCreateClick }: SidebarProps) => {

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebar_name}>Комнаты</div>
      <div className={styles.sidebar_cards}>

        <div className={styles.sidebar_card}>
          <img src={castleImage} alt="##" className={styles.card_img} />
          <div className={styles.card_info}>
            <div className={styles.card_name}>Название карточки</div>
            <div className={styles.card_settings}>Описание настроек игры в комнате</div>
            <div className={styles.card_footer}>
              <div className={styles.card_waiting}>Ожидание игроков</div>
              <div className={styles.card_players_container}>
                <span className={styles.card_players_nums}>4/5</span>
                  {}
                <Users size={18} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>

      </div>

      <button className={styles.create_button} onClick={onCreateClick}>Создать</button>
    </div>
  )
}

export default Sidebar