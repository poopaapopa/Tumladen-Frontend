import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, Pencil, Check, X, Trash2, Lock, LockOpen } from 'lucide-react';
import type { RoomResponse } from '@/types/room.ts';
import clsx from 'clsx';
import { EditableSelector } from '../editableSelector/editableSelector.tsx';
import Modal from '../modal/modal.tsx';
import styles from './roomSidebar.module.scss';

import deleteRoomImg from '@/assets/elves-delete-room.png';
import { ConfirmModal } from '../confirmModal/confirmModal.tsx';

interface RoomSidebarProps {
  room: RoomResponse;
  isOwner: boolean;
  isRoomDeleted: boolean;
  onSaveSetting: (key: string, newValue: number | string | boolean) => void;
  sendMessage: (type: string, payload: Record<string, unknown>) => void;
}

export const RoomSidebar = ({ room, isOwner, isRoomDeleted, onSaveSetting, sendMessage }: RoomSidebarProps) => {
  const navigate = useNavigate();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const currentSettings = room?.settings || {};

  const handleDeleteRoom = () => {
    if (room?.id) {
      sendMessage('delete_room', { roomId: room.id });
      setIsDeleteConfirmOpen(false);
      navigate('/');
    }
  };

  const handleStartGame = () => {
    if (isOwner && room.canStart) {
      setIsStarting(true);
      sendMessage('start_room', { roomId: room.id });
    }
  };

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

  const maxPlayersOptions = Array.from({ length: 4 }, (_, i) => {
    const val = i + 2;
    return {
      value: val,
      label: `${val}`,
      disabled: val < room.playersCount
    };
  });

  const timerOptions = [
    { value: 30, label: '30 с.' },
    { value: 60, label: '60 с.' },
    { value: 90, label: '90 с.' },
    { value: 120, label: '120 с.' },
    { value: 180, label: '180 с.' },
    { value: 0, label: '∞' }
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
                onFocus={(e) => e.target.select()}
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
                <>
                  <button onClick={handleStartEdit}>
                    <Pencil className={styles.edit_icon} size={20} />
                  </button>
                  <button onClick={() => setIsDeleteConfirmOpen(true)}>
                    <Trash2 className={styles.delete_icon} size={20} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        <span className={styles.roomSidebar__status}>{room.status}</span>
      </div>

      <div
        className={clsx(
          styles.roomSidebar__privacyBox,
          room.isPrivate && styles.roomSidebar__privacyBox_active,
          isOwner && styles.roomSidebar__privacyBox_editable
        )}
        onClick={() => isOwner && onSaveSetting('isPrivate', !room.isPrivate)}
      >
        {room.isPrivate ? <Lock size={20} /> : <LockOpen size={20} />}
        <span>{room.isPrivate ? 'Закрытая' : 'Открытая'}</span>
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
        <button
          className={styles.roomSidebar__btnStart}
          disabled={!room.canStart || isStarting}
          onClick={handleStartGame}
        >
          {isStarting ? 'Запуск...' : 'Начать игру'}
        </button>
      ) : (
        <div className={styles.roomSidebar__waitMessage}>
          Ожидаем, пока организатор завершит подготовку
        </div>
      )}
      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)}>
        <ConfirmModal
          title="Удаление комнаты"
          text={<>Как владелец, вы в праве распустить игроков и <strong>удалить комнату</strong>.<br/>
            Действительно ли вы принимаете это необратимое решение?</>}
          onConfirm={handleDeleteRoom}
          onConfirmText="Да, удалить"
          onCancel={() => setIsDeleteConfirmOpen(false)}
          onCancelText="Отмена"
          image={deleteRoomImg}
        />
      </Modal>

      <Modal isOpen={isRoomDeleted} onClose={() => navigate('/')}>
        <ConfirmModal
          title="Комната уничтожена"
          text="К сожалению, организатор решил распустить группу и удалил эту комнату.
            Все текущие приготовления были отменены — участиники ищут себе новое пристанище."
          onConfirm={() => navigate('/')}
          onConfirmText="Уйти на главную"
          image={deleteRoomImg}
        />
      </Modal>
    </aside>
  );
};
