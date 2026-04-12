import { useState } from 'react';
import { Users, Clock, Pencil, Check, X } from 'lucide-react';
import { type RoomResponse } from '../../api/room.ts';
import { EditableSelector } from '../editableSelector/editableSelector.tsx';
import styles from './roomSidebar.module.scss';

interface RoomSidebarProps {
  room: RoomResponse;
  isOwner: boolean;
  onSaveSetting: (key: string, newValue: number | string | boolean) => void;
}

export const RoomSidebar = ({ room, isOwner, onSaveSetting }: RoomSidebarProps) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  const currentSettings = (room?.settings as Record<string, number | string | boolean>) || {};

  const handleStartEdit = () => {
    setTempName(room.name);
    setIsEditingName(true);
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
        <button className={styles.roomSidebar__btnStart} disabled={!room.canStart}>
          Начать игру
        </button>
      ) : (
        <div className={styles.roomSidebar__waitMessage}>
          Ожидаем решения организатора...
        </div>
      )}
    </aside>
  );
};