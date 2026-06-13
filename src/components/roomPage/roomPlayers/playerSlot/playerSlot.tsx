import { Crown, Star, UserRoundX } from 'lucide-react';
import clsx from 'clsx';
import type { RoomResponse, ParticipantResponse } from '@/types/room.ts';
import styles from './playerSlot.module.scss';

interface PlayerSlotProps {
  idx: number;
  participant?: ParticipantResponse;
  room: RoomResponse;
  isOwner: boolean;
  onKick: (targetId: string, targetName: string) => void;
}

export const PlayerSlot = ({ idx, participant, room, isOwner, onKick }: PlayerSlotProps) => {
  const isThisParticipantOwner = participant?.actorId === room.ownerActorId;

  return (
    <div
      className={clsx(
        styles.playerSlot,
        participant && styles.playerSlot_occupied
      )}
    >
      <div className={styles.playerSlot__playerInfo}>
        <span className={styles.playerSlot__slotNum}>{idx + 1}</span>
        <span className={styles.playerSlot__playerName}>
          {participant?.displayName || "Ожидание..."}
        </span>
      </div>

      {participant && (
        <div className={styles.playerSlot__playerBadge}>
          {isThisParticipantOwner ? (
            <Crown size={20} className={styles.icon_crown} />
          ) : (
            <>
              {isOwner ? (
                <button
                  className={styles.playerSlot__btnKick}
                  onClick={() => onKick(participant.actorId, participant.displayName)}
                  title="Выгнать игрока"
                >
                  <UserRoundX size={20} />
                </button>
              ) : (
                <Star size={20} className={styles.icon_star} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};