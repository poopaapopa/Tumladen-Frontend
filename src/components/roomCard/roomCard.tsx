import styles from './roomCard.module.scss';
import castleImage from '../../assets/castle.png';
import { Users } from "lucide-react";
import type { RoomResponse } from "../../api/room.ts";

interface RoomCardProps {
  room: RoomResponse;
  onClick: () => void;
}

function RoomCard({ room, onClick }: RoomCardProps) {
  return (
    <div className={styles.roomCard} onClick={onClick}>
      <img src={castleImage} alt="Room" className={styles.roomCard__image} />
      <div className={styles.roomCard__body}>
        <div className={styles.roomCard__name}>{room.name}</div>
        <div className={styles.roomCard__settings}>
          {room.gameType}
        </div>
        <div className={styles.roomCard__footer}>
          <div className={styles.roomCard__status}>
            {room.status === 'waiting' ? 'Ожидание игроков' : 'В игре'}
          </div>
          <div className={styles.roomCard__capacity}>
            <span className={styles.roomCard__count}>
              {room.playersCount}/{room.maxPlayers}
            </span>
            <Users size={18} strokeWidth={2.5} className={styles.roomCard__icon} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoomCard