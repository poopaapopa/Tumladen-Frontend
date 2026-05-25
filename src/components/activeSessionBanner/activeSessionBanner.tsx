import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DoorOpen, Swords, X } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { GAME_TYPE_LABELS } from '@/types/user';
import styles from './activeSessionBanner.module.scss';

function ActiveSessionBanner() {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const currentRoom = useUserStore((s) => s.actor?.currentRoom);

  if (!currentRoom || dismissed || currentRoom.status === 'finished') {
    return null;
  }

  const isOnRoomPage =
    pathname.startsWith('/room/') && !pathname.startsWith('/room/game/');
  const isOnGamePage = pathname.startsWith('/room/game/');

  if (isOnRoomPage || isOnGamePage) {
    return null;
  }

  const isPlaying = currentRoom.status === 'playing';
  const gameLabel =
    GAME_TYPE_LABELS[currentRoom.gameType] ?? currentRoom.gameType;

  const handleReturn = () => {
    if (isPlaying) {
      navigate(`/room/game/${currentRoom.inviteCode}`);
    } else {
      navigate(`/room/${currentRoom.inviteCode}`);
    }
  };

  return (
    <div className={styles.pill} role="status">
      <button
        type="button"
        className={styles.pill__closeBtn}
        onClick={() => setDismissed(true)}
        aria-label="Закрыть уведомление"
      >
        <X size={14} />
      </button>

      <div className={styles.pill__icon}>
        {isPlaying ? <Swords size={22} /> : <DoorOpen size={22} />}
      </div>

      <div className={styles.pill__body}>
        <span className={styles.pill__label}>
          {isPlaying ? 'Активная игра' : 'Вы в комнате'}
        </span>
        <span className={styles.pill__roomName}>
          {isPlaying ? gameLabel : currentRoom.name}
        </span>
      </div>

      <button
        type="button"
        className={styles.pill__returnBtn}
        onClick={handleReturn}
      >
        {isPlaying ? 'Вернуться' : 'Вернуться'}
      </button>
    </div>
  );
}

export default ActiveSessionBanner;
