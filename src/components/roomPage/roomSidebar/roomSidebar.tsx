import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Clock,
  Pencil,
  Check,
  X,
  Trash2,
  Lock,
  LockOpen,
} from 'lucide-react';
import type { RoomResponse, SettingValue } from '@/types/room.ts';
import { useUserStore } from '@/store/useUserStore';
import clsx from 'clsx';
import { EditableSelector } from '@/components/editableSelector/editableSelector.tsx';
import Modal from '@/components/modal/modal.tsx';
import { getGameExpansionRules } from '@/components/gameRules/gameRulesRegistry.ts';
import { ExpansionInfoPopover } from './expansionInfoPopover.tsx';
import styles from './roomSidebar.module.scss';

import deleteRoomImg from '@/assets/elves-delete-room.webp';
import { ConfirmModal } from '@/components/confirmModal/confirmModal.tsx';

interface RoomSidebarProps {
  room: RoomResponse;
  isOwner: boolean;
  isRoomDeleted: boolean;
  onSaveSetting: (key: string, newValue: SettingValue) => void;
  sendMessage: (type: string, payload: Record<string, unknown>) => void;
  showStartAction: boolean;
  isStarting: boolean;
  onStartGame: () => void;
}

export const RoomSidebar = ({
  room,
  isOwner,
  isRoomDeleted,
  onSaveSetting,
  sendMessage,
  showStartAction,
  isStarting,
  onStartGame,
}: RoomSidebarProps) => {
  const navigate = useNavigate();
  const clearCurrentRoom = useUserStore((s) => s.clearCurrentRoom);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const currentSettings = room?.settings || {};
  const expansions = Array.isArray(currentSettings['expansions'])
    ? currentSettings['expansions'].filter((expansion): expansion is string => (
      typeof expansion === 'string'
    ))
    : [];
  const availableExpansions = getGameExpansionRules(room.gameType);

  const handleDeleteRoom = () => {
    if (room?.id) {
      sendMessage('delete_room', { roomId: room.id });
      setIsDeleteConfirmOpen(false);
      clearCurrentRoom();
      navigate('/');
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
    { value: 0, label: 'Без ограничений' }
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
          value={currentSettings['turnTimeSeconds'] as string | number | boolean}
          icon={Clock}
          options={timerOptions}
          isOwner={isOwner}
          suffix="с."
          onSelect={(val) => onSaveSetting('turnTimeSeconds', val)}
        />
      </div>

      <div className={styles.roomSidebar__expansionsSection}>
        <span className={styles.roomSidebar__expansionsTitle}>Дополнения</span>
        {availableExpansions.map((expansion) => {
          const isEnabled = expansions.includes(expansion.id);
          const inputId = `expansion-${room.id}-${expansion.id}`;

          return (
            <div
              className={clsx(
                styles.roomSidebar__expansionRow,
                !isOwner && styles.roomSidebar__expansionRow_readOnly,
              )}
              key={expansion.id}
            >
              <div className={styles.roomSidebar__expansionDetails}>
                <label
                  htmlFor={inputId}
                  className={clsx(
                    styles.roomSidebar__expansionLabel,
                    isEnabled && styles.roomSidebar__expansionLabel_active,
                  )}
                >
                  {expansion.title}
                </label>
                <ExpansionInfoPopover
                  title={expansion.title}
                  summary={expansion.summary}
                />
              </div>
              <input
                id={inputId}
                type="checkbox"
                className={styles.roomSidebar__expansionCheckbox}
                checked={isEnabled}
                disabled={!isOwner}
                onChange={() => {
                  const next = isEnabled
                    ? expansions.filter((enabledExpansion) => enabledExpansion !== expansion.id)
                    : [...expansions, expansion.id];
                  onSaveSetting('expansions', next);
                }}
              />
              <label
                htmlFor={inputId}
                className={styles.roomSidebar__switch}
                aria-label={`${isEnabled ? 'Выключить' : 'Включить'} дополнение «${expansion.title}»`}
              />
            </div>
          );
        })}

        <div className={clsx(styles.roomSidebar__expansionRow, styles.roomSidebar__expansionRow_disabled)}>
          <span className={styles.roomSidebar__expansionLabel}>
            Торговцы и Строители
          </span>
          <span className={styles.roomSidebar__comingSoonBadge}>Скоро</span>
        </div>

        <div className={clsx(styles.roomSidebar__expansionRow, styles.roomSidebar__expansionRow_disabled)}>
          <span className={styles.roomSidebar__expansionLabel}>
            Принцесса и Дракон
          </span>
          <span className={styles.roomSidebar__comingSoonBadge}>Скоро</span>
        </div>
      </div>

      {showStartAction && (
        isOwner ? (
          <button
            className={styles.roomSidebar__btnStart}
            disabled={!room.canStart || isStarting}
            onClick={onStartGame}
          >
            {isStarting ? 'Запуск...' : 'Начать игру'}
          </button>
        ) : (
          <div className={styles.roomSidebar__waitMessage}>
            Ожидаем, пока организатор завершит подготовку
          </div>
        )
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

      <Modal isOpen={isRoomDeleted} onClose={() => { clearCurrentRoom(); navigate('/'); }}>
        <ConfirmModal
          title="Комната уничтожена"
          text="К сожалению, организатор решил распустить группу и удалил эту комнату.
            Все текущие приготовления были отменены — участиники ищут себе новое пристанище."
          onConfirm={() => { clearCurrentRoom(); navigate('/'); }}
          onConfirmText="Уйти на главную"
          image={deleteRoomImg}
        />
      </Modal>
    </aside>
  );
};
