import clsx from 'clsx';
import styles from './matchResult.module.scss';
import type { MatchFinishedPayload } from '@/types/ws';
import type { MatchPlayer } from '@/types/match';
import { getPlayerColorBySeat } from '@/utils/playerColor';

interface MatchResultModalProps {
  result: MatchFinishedPayload;
  players: MatchPlayer[];
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
}

export const MatchResultModal = ({
  result,
  players,
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

  const winnerNames = ranked.filter((r) => r.isWinner).map((r) => r.displayName);
  const subtitle =
    winnerNames.length === 0
      ? 'Игра завершена'
      : winnerNames.length === 1
        ? `Победитель — ${winnerNames[0]}`
        : `Победители — ${winnerNames.join(', ')}`;

  return (
    <div className={styles.matchResult}>
      <h2 className={styles.matchResult__title}>Игра завершена</h2>
      <p className={styles.matchResult__subtitle}>{subtitle}</p>

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
                className={styles.matchResult__dot}
                style={{ backgroundColor: row.color }}
              />
              <span className={styles.matchResult__name}>{row.displayName}</span>
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
