import styles from './sidebar.module.scss';
import RoomCard from '../roomCard/roomCard';

interface SidebarProps {
  onCreateClick: () => void;
}

const Sidebar = ({ onCreateClick }: SidebarProps) => {

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebar__title}>Комнаты</div>
      <div className={styles.sidebar__list}>
        <RoomCard/>
      </div>

      <button className={styles['sidebar__create-button']} onClick={onCreateClick}>Создать</button>
    </div>
  )
}

export default Sidebar