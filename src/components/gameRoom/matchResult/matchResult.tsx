import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { Award } from 'lucide-react';
import styles from './matchResult.module.scss';
import type { MatchFinishedPayload } from '@/types/ws';
import type { MatchPlayer } from '@/types/match';
import { getPlayerColorBySeat } from '@/utils/playerColor';
import { avatarSrc } from '@/utils/avatar.ts';
import defaultAvatar from '@/assets/elf-avatar.svg';
import elfGameImage from '@/assets/elf-game.png';

const CONFETTI_COLORS = [
  '#F5C518',
  '#E94E77',
  '#4FC1E9',
  '#48CFAD',
  '#AC92EC',
  '#FC6E51',
  '#FFCE54',
  '#FF6B6B',
  '#5D9CEC',
];

interface ConfettiPiece {
  id: number;
  color: string;
  dx: number;
  dy: number;
  rotate: number;
  delay: number;
  duration: number;
  width: number;
  height: number;
  shape: 'rect' | 'circle';
}

const buildPieces = (
  side: 'left' | 'right',
  count: number
): ConfettiPiece[] => {
  const dir = side === 'left' ? 1 : -1;
  return Array.from({ length: count }, (_, i) => {
    const horizontalSpread = 350 + Math.random() * 490;
    const verticalLift = 610 + Math.random() * 550;
    return {
      id: i,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      dx: dir * horizontalSpread,
      dy: -verticalLift,
      rotate: (Math.random() * 720 - 360) * dir,
      delay: Math.random() * 160,
      duration: 1900 + Math.random() * 1300,
      width: 6 + Math.random() * 6,
      height: 8 + Math.random() * 10,
      shape: Math.random() > 0.7 ? 'circle' : 'rect',
    };
  });
};

const formatScore = (score: number) => {
  const absoluteScore = Math.abs(score);
  const lastTwoDigits = absoluteScore % 100;
  const lastDigit = absoluteScore % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${score} очков`;
  }

  if (lastDigit === 1) {
    return `${score} очко`;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${score} очка`;
  }

  return `${score} очков`;
};

export interface MatchResultAchievement {
  id: string;
  title: string;
  description?: string;
  icon?: string;
}

interface MatchResultModalProps {
  result: MatchFinishedPayload;
  players: MatchPlayer[];
  currentUserId?: string;
  achievements?: MatchResultAchievement[];
  onReturnToRoom: () => void;
  onConfirm: () => void;
  confirmText?: string;
}

interface WinnerViewModel {
  actorId: string;
  displayName: string;
  color: string;
  score: number;
  avatarUrl?: string | null;
}

export const MatchResultModal = ({
  result,
  players,
  currentUserId,
  achievements = [],
  onReturnToRoom,
  onConfirm,
  confirmText = 'Посмотреть результаты',
}: MatchResultModalProps) => {
  const playerById = new Map(players.map((player) => [player.actorId, player]));
  const scoreByActorId = new Map(
    result.finalScores.map(({ actorId, score }) => [actorId, score])
  );
  const winners: WinnerViewModel[] = result.winners.map((actorId) => {
    const player = playerById.get(actorId);

    return {
      actorId,
      displayName: player?.displayName ?? 'Игрок',
      avatarUrl: player?.avatarUrl,
      color: getPlayerColorBySeat(player?.seat),
      score: scoreByActorId.get(actorId) ?? 0,
    };
  });
  const isCurrentUserWinner = Boolean(
    currentUserId && winners.some(({ actorId }) => actorId === currentUserId)
  );
  const hasSharedVictory = winners.length > 1;
  const winningScore = winners.reduce(
    (highestScore, winner) => Math.max(highestScore, winner.score),
    0
  );
  const shouldShowConfetti = winners.length > 0;

  const leftPieces = useMemo(
    () => (shouldShowConfetti ? buildPieces('left', 60) : []),
    [shouldShowConfetti]
  );
  const rightPieces = useMemo(
    () => (shouldShowConfetti ? buildPieces('right', 60) : []),
    [shouldShowConfetti]
  );

  const title = (() => {
    if (winners.length === 0) {
      return 'Партия окончена';
    }

    if (isCurrentUserWinner && hasSharedVictory) {
      return 'Вы разделили победу!';
    }

    if (isCurrentUserWinner) {
      return 'Вы победили!';
    }

    if (hasSharedVictory) {
      return 'Ничья за первое место!';
    }

    return 'У нас есть победитель!';
  })();

  const subtitle = (() => {
    if (winners.length === 0) {
      return 'Спасибо за эту партию.';
    }

    if (isCurrentUserWinner && hasSharedVictory) {
      return 'Поздравляем! Вы набрали лучший результат вместе с достойными соперниками.';
    }

    if (isCurrentUserWinner) {
      return 'Поздравляем! Ваша стратегия оказалась самой сильной в этой партии.';
    }

    if (hasSharedVictory) {
      return 'Сразу несколько игроков набрали лучший результат и разделили победу.';
    }

    return 'Лучший результат этой партии принадлежит этому игроку.';
  })();

  const renderEmitter = (side: 'left' | 'right', pieces: ConfettiPiece[]) => (
    <div
      className={clsx(
        styles.matchResult__confetti,
        styles[`matchResult__confetti--${side}`]
      )}
      aria-hidden="true"
    >
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className={clsx(
            styles.matchResult__confettiPiece,
            piece.shape === 'circle' &&
              styles['matchResult__confettiPiece--circle']
          )}
          style={{
            backgroundColor: piece.color,
            width: `${piece.width}px`,
            height: `${piece.height}px`,
            animationDelay: `${piece.delay}ms`,
            animationDuration: `${piece.duration}ms`,
            ['--confetti-dx' as string]: `${piece.dx}px`,
            ['--confetti-dy' as string]: `${piece.dy}px`,
            ['--confetti-rotate' as string]: `${piece.rotate}deg`,
          }}
        />
      ))}
    </div>
  );

  const confettiOverlay =
    shouldShowConfetti && typeof document !== 'undefined'
      ? createPortal(
          <div className={styles.matchResult__confettiOverlay} aria-hidden="true">
            {renderEmitter('left', leftPieces)}
            {renderEmitter('right', rightPieces)}
          </div>,
          document.body
        )
      : null;

  return (
    <div className={styles.matchResult}>
      {confettiOverlay}
      <img src={elfGameImage} alt="" className={styles.matchResult__image} />

      <h2 className={styles.matchResult__title}>{title}</h2>
      <p className={styles.matchResult__subtitle}>{subtitle}</p>

      {winners.length > 0 && (
        <>
          <div
            className={clsx(
              styles.matchResult__winners,
              winners.length === 1 && styles['matchResult__winners--single']
            )}
            aria-label={hasSharedVictory ? 'Победители' : 'Победитель'}
          >
            {winners.map((winner) => (
              <div className={styles.matchResult__winner} key={winner.actorId}>
                <span
                  className={styles.matchResult__avatar}
                  style={{ ['--player-color' as string]: winner.color }}
                >
                  {winner.avatarUrl ? (
                    <img
                      src={avatarSrc(winner.avatarUrl)}
                      alt=""
                      className={styles.matchResult__avatarImg}
                    />
                  ) : (
                    <span
                      className={styles.matchResult__avatarFallback}
                      aria-hidden="true"
                      style={{
                        ['--avatar-url' as string]: `url(${defaultAvatar})`,
                      }}
                    />
                  )}
                  <Award
                    size={24}
                    strokeWidth={2.5}
                    className={styles.matchResult__awardIcon}
                    aria-hidden="true"
                  />
                </span>
                <span
                  className={styles.matchResult__winnerName}
                  style={{ color: winner.color }}
                >
                  {winner.displayName}
                </span>
              </div>
            ))}
          </div>

          <div className={styles.matchResult__score}>
            <span className={styles.matchResult__scoreLabel}>
              Победный результат
            </span>
            <strong className={styles.matchResult__scoreValue}>
              {formatScore(winningScore)}
            </strong>
          </div>
        </>
      )}

      {achievements.length > 0 && (
        <section
          className={styles.matchResult__achievements}
          aria-labelledby="match-result-achievements-title"
        >
          <h3
            id="match-result-achievements-title"
            className={styles.matchResult__achievementsTitle}
          >
            Ваши достижения
          </h3>
          <ul className={styles.matchResult__achievementsList}>
            {achievements.map((achievement) => (
              <li
                className={styles.matchResult__achievement}
                key={achievement.id}
              >
                <span
                  className={styles.matchResult__achievementIcon}
                  aria-hidden="true"
                >
                  {achievement.icon ?? '🏅'}
                </span>
                <span className={styles.matchResult__achievementCopy}>
                  <strong>{achievement.title}</strong>
                  {achievement.description && (
                    <span>{achievement.description}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className={styles.matchResult__actions}>
        <button
          type="button"
          className={styles.matchResult__btn}
          onClick={onReturnToRoom}
        >
          Вернуться в комнату
        </button>
        <button
          type="button"
          className={clsx(
            styles.matchResult__btn,
            styles['matchResult__btn--secondary']
          )}
          onClick={onConfirm}
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
};
