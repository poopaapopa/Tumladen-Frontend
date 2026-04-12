import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {Users, Clock, Star, Crown, LogOut, Share2, CheckCircle, UserRoundX} from 'lucide-react';
import styles from './roomPage.module.scss';
import castleImg from '../../assets/zamok.png';
import {
  roomService,
  type RoomResponse,
  type UpdateRoomSettingsPayload
} from '../../api/room.ts'
import { useUserStore } from '../../store/useUserStore';
import { useRoomSocket } from '../../api/ws.ts';
import { motion, AnimatePresence } from 'framer-motion';
import { EditableSelector } from '../editableSelector/editableSelector.tsx';
import { Pencil, Check, X } from 'lucide-react';
import clsx from "clsx";

const copyToClipboard = async (text: string) => {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return fallbackCopy(text);
    }
  }
  return fallbackCopy(text);
};

const fallbackCopy = (text: string) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  Object.assign(textArea.style, { position: "fixed", left: "-9999px", top: "0" });
  document.body.appendChild(textArea);
  textArea.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(textArea);
  }
};

const RoomPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const currentUser = useUserStore((state) => state.actor);

  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(room?.name || '');

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentSettings = (room?.settings as Record<string, number | string | boolean>) || {};

  const maxPlayersOptions = Array.from({ length: 5 }, (_, i) => {
    const val = i + 2;
    return {
      value: val,
      label: `${val}`,
      disabled: room ? val < room.playersCount : false
    };
  });

  const timerOptions = [
    { value: 60, label: '60 с.' },
    { value: 90, label: '90 с.' },
    { value: 120, label: '120 с.' },
    { value: 180, label: '180 с.' },
  ];

  useEffect(() => {
    if (room?.name) setTempName(room.name);
  }, [room?.name]);

  const handleUpdateName = () => {
    const trimmed = tempName.trim();

    if (trimmed && trimmed !== room?.name)
      handleSaveSetting('name', trimmed);

    setIsEditingName(false);
  };

  const triggerToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setShowCopyToast(true);
    toastTimer.current = setTimeout(() => setShowCopyToast(false), 3000);
  }, []);

  const handleCopyLink = async () => {
    const success = await copyToClipboard(window.location.href);
    if (success) triggerToast();
  };

  const checkAvailableSlots = useCallback((roomData: RoomResponse) => {
    if (!currentUser) return false;

    const isAlreadyInRoom = roomData.participants?.some(p => p.actorId === currentUser.id);

    return !isAlreadyInRoom && roomData.playersCount >= roomData.maxPlayers;
  }, [currentUser]);

  const fetchRoomData = useCallback(async () => {
    if (!id) return;
    try {
      const data = await roomService.getRoomById(id);

      if (checkAvailableSlots(data.room)) {
        navigate('/');
        return;
      }

      setRoom(data.room);
      setError(null);
    } catch (e) {
      setError("Не удалось войти в чертоги комнаты...");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate, checkAvailableSlots]);

  const handleRoomUpdate = useCallback((updatedRoom: RoomResponse) => {
    if (checkAvailableSlots(updatedRoom)) {
      navigate('/');
      return;
    }

    const isStillInRoom = updatedRoom.participants?.some(
      p => p.actorId === currentUser?.id
    );

    if (currentUser && !isStillInRoom) {
      alert("Вы были изгнаны из комнаты владельцем.");
      navigate('/');
      return;
    }

    setRoom(updatedRoom);
  }, [checkAvailableSlots, navigate, currentUser]);

  const { sendMessage } = useRoomSocket(room?.id, handleRoomUpdate);

  const handleSaveSetting = (key: string, newValue: number | string | boolean) => {
    if (!room || !isOwner) return;

    const currentSettings = (room.settings as unknown as Record<string, number | string | boolean>) || {};

    let hasChanged: boolean;

    if (key === 'name')
      hasChanged = room.name !== String(newValue);
    else if (key === 'maxPlayers')
      hasChanged = room.maxPlayers !== Number(newValue);
    else
      hasChanged = currentSettings[key] !== newValue;

    if (!hasChanged) return;

    const payload: UpdateRoomSettingsPayload = {
      roomId: room.id,
      gameType: room.gameType,
      name: key === 'name' ? String(newValue) : room.name,
      maxPlayers: key === 'maxPlayers' ? Number(newValue) : room.maxPlayers,
      settings: (key !== 'name' && key !== 'maxPlayers')
        ? currentSettings
        : { ...currentSettings, [key]: newValue }
    };

    sendMessage('update_room_settings', payload as unknown as Record<string, unknown>);
  };

  const handleKickClick = (targetId: string, targetName: string) => {
    if (!room) return;

    const confirmed = window.confirm(`Вы действительно хотите изгнать игрока ${targetName}?`);

    if (confirmed) {
      sendMessage('kick_participant', {
        roomId: room.id,
        targetActorId: targetId
      });
    }
  };

  useEffect(() => {
    fetchRoomData();
  }, [fetchRoomData]);

  if (isLoading) return <div className={styles.loading}>Загрузка...</div>;
  if (error || !room) return <div className={styles.error}>{error || "Комната исчезла"}</div>;

  const isOwner = currentUser?.id === room.ownerActorId;

  return (
    <div className={styles.roomPage}>
      <aside className={styles.roomPage__sidebar}>
        <div className={styles.roomPage__header}>
          <div className={styles.roomPage__nameContainer}>
            {isEditingName ? (
              <div className={styles.roomPage__nameEditWrapper}>
                <input
                  className={styles.roomPage__nameInput}
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateName();
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                />
                <div className={styles.roomPage__nameActions}>
                  <button onClick={handleUpdateName} className={styles.iconsButton}><Check className={styles.icon_save} size={20} /></button>
                  <button onClick={() => setIsEditingName(false)} className={styles.iconsButton}><X className={styles.icon_cancel} size={20} /></button>
                </div>
              </div>
            ) : (
              <div className={styles.roomPage__nameView}>
                <h2 className={styles.roomPage__roomName}>{room.name}</h2>
                {isOwner && (
                  <button onClick={() => setIsEditingName(true)} className={styles.iconsButton}>
                    <Pencil className={styles.edit_icon} size={20} />
                  </button>
                )}
              </div>
            )}
          </div>
          <span className={styles.roomPage__status}>{room.status}</span>
        </div>

        <div className={styles.roomPage__configGrid}>
          <EditableSelector
            value={room.maxPlayers}
            icon={Users}
            options={maxPlayersOptions}
            isOwner={isOwner}
            onSelect={(val) => handleSaveSetting('maxPlayers', val)}
          />
          <EditableSelector
            value={currentSettings['turnTimeSeconds']}
            icon={Clock}
            options={timerOptions}
            isOwner={isOwner}
            suffix="с."
            onSelect={(val) => handleSaveSetting('turnTimeSeconds', val)}
          />
        </div>

        {isOwner ? (
          <button
            className={styles.roomPage__btnStart}
            disabled={!room.canStart}
          >
            Начать игру
          </button>
        ) : (
          <div className={styles.roomPage__waitMessage}>
            Ожидаем решения организатора...
          </div>
        )}
      </aside>

      <main className={styles.roomPage__main}>
        <div className={styles.roomPage__visual}>
          <img src={castleImg} alt="Game Art" className={styles.roomPage__image} />
          <div className={styles.roomPage__overlay} />
        </div>
        <h1 className={styles.roomPage__gameTitle}>{room.gameType}</h1>
        <div className={styles.roomPage__rules}>Правила игры...</div>
      </main>

      <section className={styles.roomPage__players}>
        <h2 className={styles.roomPage__playersTitle}>
          Участники:
        </h2>

        <div className={styles.roomPage__playerList}>
          {Array.from({ length: room.maxPlayers }).map((_, idx) => {
            const participant = room.participants?.[idx];
            const isThisParticipantOwner = participant?.actorId === room.ownerActorId;
            const showKickButton = isOwner && participant && participant.actorId !== currentUser?.id;

            return (
              <div
                key={idx}
                className={clsx(
                  styles.roomPage__playerSlot,
                  participant && styles.roomPage__playerSlot_occupied,
                  showKickButton && styles.roomPage__playerSlot_kickable
                )}
              >
                <div className={styles.roomPage__playerInfo}>
                  <span className={styles.roomPage__slotNum}>{idx + 1}</span>
                  <span className={styles.roomPage__playerName}>
                    {participant?.displayName || "Ожидание..."}
                  </span>
                </div>

                {participant && (
                  <div className={styles.roomPage__playerBadge}>
                    {isThisParticipantOwner ? (
                      <Crown size={20} className={styles.icon_crown} />
                    ) : (
                      <>
                        <Star size={20} className={styles.icon_star} />
                        {showKickButton && (
                          <button
                            className={styles.roomPage__btnKick}
                            onClick={() => handleKickClick(participant.actorId, participant.displayName)}
                            title="Выгнать игрока"
                          >
                            <UserRoundX size={20} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className={styles.roomPage__actions}>
          <button className={styles.roomPage__btnInvite}
            onClick={(handleCopyLink)}>
            <Share2 size={20} /> Пригласить
          </button>
          <button
            className={styles.roomPage__btnExit}
            onClick={() => navigate('/')}
          >
            <LogOut size={20} /> Покинуть
          </button>
        </div>
      </section>
      <AnimatePresence>
        {showCopyToast && (
          <motion.div
            className={styles.copyToast}
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
          >
            <CheckCircle size={20} className={styles.copyToast__icon} />
            <span>Ссылка успешно скопирована</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoomPage;