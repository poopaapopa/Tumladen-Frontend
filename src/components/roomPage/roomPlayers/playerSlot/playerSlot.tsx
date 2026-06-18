import { Crown, Star, UserRoundX, Bot } from 'lucide-react';
import clsx from 'clsx';
import type { RoomResponse, ParticipantResponse, BotDifficulty } from '@/types/room.ts';
import { BotDifficultyPopover } from '../botDifficultyPopover/botDifficultyPopover.tsx';
import styles from './playerSlot.module.scss';

const DIFFICULTY_LABELS: Record<BotDifficulty, string> = {
  easy: 'Лёгкий',
  medium: 'Средний',
  hard: 'Сложный',
};

const DIFFICULTY_COLORS: Record<BotDifficulty, string> = {
  easy: '#27AE60',
  medium: '#E2A308',
  hard: '#e74c3c',
};

interface PlayerSlotProps {
  idx: number;
  participant?: ParticipantResponse;
  room: RoomResponse;
  isOwner: boolean;
  onKick: (targetId: string, targetName: string) => void;
  onAddBot: (difficulty: BotDifficulty) => void;
  onRemoveBot: (actorId: string) => void;
  onChangeBotDifficulty: (actorId: string, difficulty: BotDifficulty) => void;
}

export const PlayerSlot = ({ idx, participant, room, isOwner, onKick, onAddBot, onRemoveBot, onChangeBotDifficulty }: PlayerSlotProps) => {
  const isThisParticipantOwner = participant?.actorId === room.ownerActorId;
  const isBot = participant?.actorType === 'bot';

  return (
    <div
      className={clsx(
        styles.playerSlot,
        participant && styles.playerSlot_occupied,
        isBot && styles.playerSlot_bot
      )}
    >
      <div className={styles.playerSlot__playerInfo}>
        <span className={styles.playerSlot__slotNum}>{idx + 1}</span>
        {participant ? (
          <span className={styles.playerSlot__playerName}>
            {isBot && <Bot size={18} className={styles.icon_bot} />}
            {participant.displayName}
            {isBot && participant.botDifficulty && (
              isOwner ? (
                <BotDifficultyPopover
                  onSelect={(newDifficulty) => onChangeBotDifficulty(participant.actorId, newDifficulty)}
                  renderTrigger={({ ref, onClick }) => (
                    <button
                      ref={ref}
                      type="button"
                      className={clsx(styles.playerSlot__difficultyBadge, styles.playerSlot__difficultyBadge_clickable)}
                      style={{ backgroundColor: DIFFICULTY_COLORS[participant.botDifficulty!] }}
                      onClick={onClick}
                      title="Изменить сложность"
                    >
                      {DIFFICULTY_LABELS[participant.botDifficulty!]}
                    </button>
                  )}
                />
              ) : (
                <span
                  className={styles.playerSlot__difficultyBadge}
                  style={{ backgroundColor: DIFFICULTY_COLORS[participant.botDifficulty] }}
                >
                  {DIFFICULTY_LABELS[participant.botDifficulty]}
                </span>
              )
            )}
          </span>
        ) : (
          isOwner ? (
            <BotDifficultyPopover onSelect={onAddBot} />
          ) : (
            <span className={styles.playerSlot__playerName}>Ожидание...</span>
          )
        )}
      </div>

      {participant && (
        <div className={styles.playerSlot__playerBadge}>
          {isBot ? (
            isOwner && (
              <button
                className={styles.playerSlot__btnKick}
                onClick={() => onRemoveBot(participant.actorId)}
                title="Удалить бота"
              >
                <UserRoundX size={20} />
              </button>
            )
          ) : isThisParticipantOwner ? (
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
