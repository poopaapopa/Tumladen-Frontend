import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2, LogOut, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import styles from './roomPage.module.scss';
import { type RoomResponse } from '../../api/room.ts';
import { PlayerSlot } from "../playerSlot/playerSlot.tsx";
import Modal from "../modal/modal.tsx";
import { ConfirmKick } from "../confirmKick/confirmKick.tsx";

import ElfClosingDoorImg from '../../assets/elf-closing-door.png';

interface RoomPlayersProps {
  room: RoomResponse;
  isOwner: boolean;
  sendMessage: (type: string, payload: Record<string, unknown>) => void;
  isKicked: boolean;
}

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
export const RoomPlayers = ({
  room,
  isOwner,
  sendMessage,
  isKicked,
}: RoomPlayersProps) => {
  const navigate = useNavigate();

  const [showCopyToast, setShowCopyToast] = useState(false);
  const [kickTarget, setKickTarget] = useState<{id: string, name: string} | null>(null);

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

  const handleLeftGame = () => {
    if (room?.id) {
      sendMessage('leave_room', {
        roomId: room.id
      });
      navigate('/');
    }
  };

  return (
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
            onClick={handleLeftGame}
          >
            <LogOut size={20} /> Покинуть
          </button>
        </div>
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
    </section>

  );
};