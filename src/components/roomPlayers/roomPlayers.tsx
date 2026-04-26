import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2, LogOut, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import styles from './roomPlayers.module.scss';
import { type RoomResponse } from '../../api/room.ts';
import { PlayerSlot } from "../playerSlot/playerSlot.tsx";
import Modal from "../modal/modal.tsx";
import { ConfirmModal } from "../confirmKick/confirmKick.tsx";
import elfExileImg from "../../assets/elf-exile.png";

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
    <section className={styles.roomPlayers}>
        <h2 className={styles.roomPlayers__title}>
          Участники:
        </h2>

        <div className={styles.roomPlayers__list}>
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

        <div className={styles.roomPlayers__actions}>
          <button className={styles.roomPlayers__btnInvite}
            onClick={(handleCopyLink)}>
            <Share2 size={20} /> Пригласить
          </button>
          <button
            className={styles.roomPlayers__btnExit}
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
            <ConfirmModal
              title="Изгнание из комнаты"
              text={
                <>
                  Вы действительно желаете выгнать игрока <strong>{kickTarget.name}</strong>?<br />
                  Он сможет вернуться в комнату в любой момент, но ваше действие явно отразится на его желании играть с вами.
                </>
              }
              onConfirm={confirmKick}
              onCancel={() => setKickTarget(null)}
              onConfirmText="Изгнать"
              onCancelText="Оставить"
              image={elfExileImg}
            />
          )}
        </Modal>

        <Modal isOpen={isKicked} onClose={() => navigate('/')}>
          <ConfirmModal
            title="Вы вне игры"
            text="Организатор партии решил продолжить подготовку без вашего участия.
              Вы можете вновь войти в эту комнату, но вряд ли вам будут рады."
            onConfirm={() => navigate('/')}
            onConfirmText="Уйти на главную"
            image={ElfClosingDoorImg}
          />
        </Modal>
    </section>
  );
};