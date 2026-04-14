import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LogOut, Share2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import styles from './roomPage.module.scss';
import castleImg from '../../assets/zamok.png';
import ElfClosingDoorImg from '../../assets/elf-closing-door.png';
import { roomService, type RoomResponse, type UpdateRoomSettingsPayload } from '../../api/room.ts'
import { useUserStore } from '../../store/useUserStore';
import { useRoomSocket } from '../../api/ws.ts';

import { PlayerSlot } from "../playerSlot/playerSlot.tsx";
import { RoomSidebar } from "../roomSidebar/roomSidebar.tsx";
import { RoomPageSkeleton } from "./roomPageSkeleton.tsx";
import Modal from "../modal/modal.tsx";
import { ConfirmKick } from "../confirmKick/confirmKick.tsx";

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
  const [kickTarget, setKickTarget] = useState<{id: string, name: string} | null>(null);
  const [isKicked, setIsKicked] = useState(false);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    setRoom(updatedRoom);
  }, [checkAvailableSlots, navigate]);

  const handleKicked = useCallback(() => {
    setIsKicked(true);
  }, []);

  const { sendMessage } = useRoomSocket(room?.id, handleRoomUpdate, handleKicked);

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
        ? { ...currentSettings, [key]: newValue }
        : currentSettings
    };

    sendMessage('update_room_settings', payload as unknown as Record<string, unknown>);
  };

  const handleKick = (targetId: string, targetName: string) => {
    setKickTarget({ id: targetId, name: targetName });
  };

  const confirmKick = () => {
    if (kickTarget && room) {
      sendMessage('kick_participant', {
        roomId: room.id,
        targetActorId: kickTarget.id
      });
      setKickTarget(null);
    }
  };

  useEffect(() => {
    fetchRoomData();
  }, [fetchRoomData]);

  if (isLoading) return <RoomPageSkeleton />;
  if (error || !room) return <div className={styles.error}>{error || "Комната исчезла"}</div>;

  const isOwner = currentUser?.id === room.ownerActorId;

  return (
    <div className={styles.roomPage}>
      <RoomSidebar
        room={room}
        isOwner={isOwner}
        onSaveSetting={handleSaveSetting}
      />

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
          {Array.from({ length: room.maxPlayers }).map((_, idx) => (
            <PlayerSlot
              key={idx}
              idx={idx}
              participant={room.participants?.[idx]}
              room={room}
              isOwner={isOwner}
              onKick={handleKick}
            />
          ))}
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
            <Check size={20} className={styles.copyToast__icon} />
            <span>Ссылка успешно скопирована</span>
          </motion.div>
        )}
      </AnimatePresence>
      <Modal isOpen={kickTarget !== null} onClose={() => setKickTarget(null)}>
        {kickTarget && (
          <ConfirmKick
            targetName={kickTarget.name}
            onConfirm={confirmKick}
            onCancel={() => setKickTarget(null)}
          />
        )}
      </Modal>
      <Modal isOpen={isKicked} onClose={() => navigate('/')}>
        <div className={styles.kickedModal}>
          <h2 className={styles.kickedModal__title}>Вы вне игры</h2>
          <img src={ElfClosingDoorImg} alt="Изгнанник" className={styles.kickedModal__image} />
          <p className={styles.kickedModal__text}>
            Организатор партии решил продолжить подготовку без вашего участия.
            Вы можете вновь войти в эту комнату, но вряд ли вам будут рады.
          </p>
          <div className={styles.kickedModal__layout}>
            <button
              className={styles.kickedModal__btn}
              onClick={() => navigate('/')}
            >
              Уйти на главную
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RoomPage;