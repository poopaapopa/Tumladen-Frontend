import { useCallback, useState } from 'react';
import { Users, Clock, Pencil, Check, X } from 'lucide-react';
import { type RoomResponse } from '../../api/room.ts';
import { EditableSelector } from '../editableSelector/editableSelector.tsx';
import styles from './roomSidebar.module.scss';
import { useRoomSocket } from '../../api/ws.ts';
import { useUserStore } from '../../store/useUserStore.ts';
import { useNavigate } from 'react-router-dom';

interface RoomSidebarProps {
  room: RoomResponse;
  isOwner: boolean;
  onSaveSetting: (key: string, newValue: number | string | boolean) => void;
}

export const RoomSidebar = ({ room, isOwner, onSaveSetting }: RoomSidebarProps) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const currentUser = useUserStore((state) => state.actor);
  const navigate = useNavigate();

  const currentSettings = (room?.settings as Record<string, number | string | boolean>) || {};

  const handleStartEdit = () => {
    setTempName(room.name);
    setIsEditingName(true);
  };

  const checkAvailableSlots = useCallback((roomData: RoomResponse) => {
    if (!currentUser) return false;

    const isAlreadyInRoom = roomData.participants?.some(p => p.actorId === currentUser.id);

    return !isAlreadyInRoom && roomData.playersCount >= roomData.maxPlayers;
  }, [currentUser]);

  const handleRoomUpdate = useCallback((type: string, payload: any) => {  
      if (type === 'room_state') {
        // Извлекаем объект комнаты (учитывая возможную вложенность)
        const updatedRoom = payload.room || payload;
        
        const isFull = checkAvailableSlots(updatedRoom);
        if (!isFull) {
          setRoom(updatedRoom);
        }
      }
    }, [currentUser, navigate, checkAvailableSlots]);

  const { sendMessage } = useRoomSocket(room?.id, handleRoomUpdate);
  
  const handleStartGame = () => {
    if (room?.id) {
      sendMessage('start_room', {
        roomId: room.id
      });
    }
  };

  const handleUpdateName = () => {
    const trimmed = tempName.trim();

    if (trimmed && trimmed !== room.name)
      onSaveSetting('name', trimmed);

    setIsEditingName(false);
  };

  const maxPlayersOptions = Array.from({ length: 5 }, (_, i) => {
    const val = i + 2;
    return {
      value: val,
      label: `${val}`,
      disabled: val < room.playersCount
    };
  });

  const timerOptions = [
    { value: 60, label: '60 с.' },
    { value: 90, label: '90 с.' },
    { value: 120, label: '120 с.' },
    { value: 180, label: '180 с.' },
  ];

  return (
    <aside className={styles.roomSidebar}>
      <div className={styles.roomSidebar__header}>
        <div className={styles.roomSidebar__nameContainer}>
          {isEditingName ? (
            <div className={styles.roomSidebar__nameEditWrapper}>
              <input
                className={styles.roomSidebar__nameInput}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdateName();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
              />
              <div className={styles.roomSidebar__nameActions}>
                <button onClick={handleUpdateName}>
                  <Check className={styles.icon_save} size={20} />
                </button>
                <button onClick={() => setIsEditingName(false)}>
                  <X className={styles.icon_cancel} size={20} />
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.roomSidebar__nameView}>
              <h2 className={styles.roomSidebar__roomName}>{room.name}</h2>
              {isOwner && (
                <button onClick={handleStartEdit}>
                  <Pencil className={styles.edit_icon} size={20} />
                </button>
              )}
            </div>
          )}
        </div>
        <span className={styles.roomSidebar__status}>{room.status}</span>
      </div>

      <div className={styles.roomSidebar__configGrid}>
        <EditableSelector
          value={room.maxPlayers}
          icon={Users}
          options={maxPlayersOptions}
          isOwner={isOwner}
          onSelect={(val) => onSaveSetting('maxPlayers', val)}
        />
        <EditableSelector
          value={currentSettings['turnTimeSeconds']}
          icon={Clock}
          options={timerOptions}
          isOwner={isOwner}
          suffix="с."
          onSelect={(val) => onSaveSetting('turnTimeSeconds', val)}
        />
      </div>

      {isOwner ? (
        <button className={styles.roomSidebar__btnStart} disabled={!room.canStart} onClick={handleStartGame}>
          Начать игру
        </button>
      ) : (
        <div className={styles.roomSidebar__waitMessage}>
          Организатор шепчется с ветром о стратегии грядущей партии
        </div>
      )}
    </aside>
  );
};