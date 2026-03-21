import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './roomPage.module.scss';
import modalStyles from '../sidebar/sidebar.module.scss'


interface RoomData {
  id: string;
  name: string;
  isPrivate: boolean;
  inviteCode: string;
  ownerActorId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const MOCK_DATA: Record<string, RoomData> = {
  "a3576b17-3779-4d84-8055-225ddc1de475": {
    id: "a3576b17-3779-4d84-8055-225ddc1de475",
    name: "Test Room",
    isPrivate: false,
    inviteCode: "EEB565CF",
    ownerActorId: "8aaed2bd-0365-4b30-81f4-11e0d70e257c",
    status: "waiting",
    createdAt: "2026-03-21T13:16:54Z",
    updatedAt: "2026-03-21T13:16:54Z"
  }
};

const RoomPage = () => {
  const { room_id } = useParams<{ room_id: string }>();
  
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const goToMain = () => {
    navigate('/');
  };

  useEffect(() => {
    const fetchRoomData = () => {
      setLoading(true);
      setError(null);

      setTimeout(() => {
        if (room_id && MOCK_DATA[room_id]) {
          setRoom(MOCK_DATA[room_id]);
          setLoading(false);
        } else {
          setError("Комната с таким ID не найдена в моках");
          setLoading(false);
        }
      }, 800);
    };

    fetchRoomData();
  }, [room_id]);

  if (loading) return <div className={styles.loader}>Загрузка...</div>;
  if (error) return <div className={styles.error}>Ошибка: {error}</div>;
  if (!room) return <div>Комната не найдена</div>;

  return (
    <div className={styles.roomPage}>
      <h1>Комната: {room.name}</h1>
      
      <div className={styles.info_card}>
        <p><strong>Статус:</strong> <span className={styles.status}>{room.status}</span></p>
        <p><strong>Код приглашения:</strong> {room.inviteCode}</p>
        <p><strong>Доступность:</strong> {room.isPrivate ? 'Приватная' : 'Общая'}</p>
        <p><strong>Дата создания:</strong> {new Date(room.createdAt).toLocaleString()}</p>
        <div className={modalStyles.modal_buttons}>
          <button className={modalStyles.btn_cancel} onClick={goToMain}>Назад</button>
          <button className={modalStyles.btn_confirm} >Присоединиться</button>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;