import { useEffect, useState } from 'react';
import styles from './sidebar.module.scss';
import RoomCard from '../roomCard/roomCard';
import { roomApi } from '../../api/api';

interface Room {
  id: string;
  name: string;
  isPrivate: boolean;
  inviteCode: string;
  ownerActorId: string;
  status: 'waiting' | 'started' | 'finished';
  createdAt: string;
  updatedAt: string;
}

interface SidebarProps {
  onCreateClick: () => void;
}

const Sidebar = ({ onCreateClick }: SidebarProps) => {
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await roomApi.getPublicRooms();
        setRooms(data.rooms || []);
      } catch (e) {
        console.error("Ошибка загрузки комнат", e);
      }
    };

    fetchRooms();
    // const interval = setInterval(fetchRooms, 10000);
    // return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebar__title}>Комнаты</div>
      <div className={styles.sidebar__list}>
        {rooms.length > 0 ? (
          rooms.map((room) => (
            <RoomCard 
              key={room.id} 
              room={room}
            />
          ))
        ) : (
          <p style={{textAlign: 'center', color: '#555', marginTop: '20px'}}>Нет активных комнат</p>
        )}
      </div>

      <button className={styles.sidebar__createButton} onClick={onCreateClick}>
        Создать
      </button>
    </div>
  );
};

export default Sidebar;