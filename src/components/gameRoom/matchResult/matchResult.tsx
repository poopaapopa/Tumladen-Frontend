import { Fragment, useMemo } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { Award } from 'lucide-react';

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
import styles from './matchResult.module.scss';
import type { MatchFinishedPayload } from '@/types/ws';
import type { MatchPlayer } from '@/types/match';
import { getPlayerColorBySeat } from '@/utils/playerColor';
import { avatarSrc } from '@/utils/avatar.ts';
import defaultAvatar from '@/assets/elf-avatar.svg';
import elfGameImage from '@/assets/elf-game.png';

interface MatchResultModalProps {
  result: MatchFinishedPayload;
  players: MatchPlayer[];
  currentUserId?: string;
  onConfirm: () => void;
  confirmText?: string;
}

interface RankedRow {
  actorId: string;
  displayName: string;
  color: string;
  score: number;
  isWinner: boolean;
  place: number;
  avatarUrl?: string | null;
}

export const MatchResultModal = ({
  result,
  players,
  currentUserId,
  onConfirm,
  confirmText = 'Вернуться в комнату',
}: MatchResultModalProps) => {
  const winnersSet = new Set(result.winners);

  const playerById = new Map(players.map((p) => [p.actorId, p]));

  const merged = result.finalScores.map((entry) => {
    const player = playerById.get(entry.actorId);
    return {
      actorId: entry.actorId,
      displayName: player?.displayName ?? 'Игрок',
      avatarUrl: player?.avatarUrl,
      color: getPlayerColorBySeat(player?.seat),
      score: entry.score,
      isWinner: winnersSet.has(entry.actorId),
    };
  });

  const sorted = [...merged].sort((a, b) => b.score - a.score);

  let lastScore: number | null = null;
  let lastPlace = 0;
  const ranked: RankedRow[] = sorted.map((row, idx) => {
    const place = row.score === lastScore ? lastPlace : idx + 1;
    lastScore = row.score;
    lastPlace = place;
    return { ...row, place };
  });

  const winners = ranked.filter((r) => r.isWinner);
  const isCurrentUserWinner = !!(
    currentUserId && winners.some((w) => w.actorId === currentUserId)
  );

  const leftPieces = useMemo(
    () => (isCurrentUserWinner ? buildPieces('left', 60) : []),
    [isCurrentUserWinner]
  );
  const rightPieces = useMemo(
    () => (isCurrentUserWinner ? buildPieces('right', 60) : []),
    [isCurrentUserWinner]
  );

  const renderColoredName = (row: RankedRow) => (
    <span
      key={row.actorId}
      className={styles.matchResult__highlight}
      style={{ color: row.color }}
    >
      {row.displayName}
    </span>
  );

  const renderSubtitle = () => {
    if (winners.length === 0) {
      return null;
    }

    if (winners.length === 1) {
      return (
        <>
          Браво, {renderColoredName(winners[0])}!{' '}
          {isCurrentUserWinner ? 'Ваша' : 'Его'} стратегия
          оказалась самой мудрой в этой партии. Славься победитель!
        </>
      );
    }

    return (
      <>
        В коробке игры сегодня не одна золотая медаль!{' '}
        {winners.map((w, i) => (
          <Fragment key={w.actorId}>
            {i > 0 && ', '}
            {renderColoredName(w)}
          </Fragment>
        ))}{' '}
        набрали одинаковое количество очков.{' '}
        {isCurrentUserWinner ? 'Ваша' : 'Их'} стратегия была зеркально
        безупречной!
      </>
    );
  };

  const renderEmitter = (side: 'left' | 'right', pieces: ConfettiPiece[]) => (
    <div
      className={clsx(
        styles.matchResult__confetti,
        styles[`matchResult__confetti--${side}`]
      )}
      aria-hidden="true"
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className={clsx(
            styles.matchResult__confettiPiece,
            p.shape === 'circle' && styles['matchResult__confettiPiece--circle']
          )}
          style={{
            backgroundColor: p.color,
            width: `${p.width}px`,
            height: `${p.height}px`,
            animationDelay: `${p.delay}ms`,
            animationDuration: `${p.duration}ms`,
            ['--confetti-dx' as string]: `${p.dx}px`,
            ['--confetti-dy' as string]: `${p.dy}px`,
            ['--confetti-rotate' as string]: `${p.rotate}deg`,
          }}
        />
      ))}
    </div>
  );

  const confettiOverlay =
    isCurrentUserWinner && typeof document !== 'undefined'
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
      <h2 className={styles.matchResult__title}>Партия окончена</h2>
      <img
        src={elfGameImage}
        alt=""
        className={styles.matchResult__image}
      />
      <p className={styles.matchResult__subtitle}>{renderSubtitle()}</p>
      <ul className={styles.matchResult__list}>
        {ranked.map((row) => (
          <li
            key={row.actorId}
            className={clsx(
              styles.matchResult__row,
              row.isWinner && styles['matchResult__row--winner']
            )}
          >
            <span className={styles.matchResult__place}>{row.place}</span>
            <span className={styles.matchResult__player}>
              <span
                className={styles.matchResult__avatar}
                style={{ ['--player-color' as string]: row.color }}
              >
                {row.avatarUrl ? (
                  <img
                    src={avatarSrc(row.avatarUrl)}
                    alt={row.displayName}
                    className={styles.matchResult__avatarImg}
                  />
                ) : (
                  <span
                    className={styles.matchResult__avatarFallback}
                    aria-label={row.displayName}
                    role="img"
                    style={{ ['--avatar-url' as string]: `url(${defaultAvatar})` }}
                  />
                )}
              </span>
              <span
                className={styles.matchResult__name}
                style={{ color: row.color }}
              >
                {row.displayName}
                {row.isWinner && (
                  <Award
                    size={20}
                    strokeWidth={2.5}
                    className={styles.matchResult__awardIcon}
                  />
                )}
              </span>
            </span>
            <span className={styles.matchResult__score}>{row.score}</span>
          </li>
        ))}
      </ul>

      <div className={styles.matchResult__actions}>
        <button className={styles.matchResult__btn} onClick={onConfirm}>
          {confirmText}
        </button>
      </div>
    </div>
  );
};
