import { Crown, Star, UserRoundX } from 'lucide-react';
import clsx from 'clsx';
import { type RoomResponse, type ParticipantResponse } from '../../api/room.ts';
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
  const showKickButton = isOwner && !isThisParticipantOwner;

  return (
    <div
      className={clsx(
        styles.playerSlot,
        participant && styles.playerSlot_occupied,
        showKickButton && styles.playerSlot_kickable
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
              <Star size={20} className={styles.icon_star} />
              {showKickButton && (
                <button
                  className={styles.playerSlot__btnKick}
                  onClick={() => onKick(participant.actorId, participant.displayName)}
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
};