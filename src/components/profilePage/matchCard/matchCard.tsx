import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Award } from 'lucide-react';
import type { MatchHistoryEntry, MatchPlayer } from '@/types/user.ts';
import { GAME_TYPE_LABELS } from '@/types/user.ts';
import { timeAgo } from '@/utils/time.ts';
import styles from './matchCard.module.scss';

function getMatchOutcome(
  entry: MatchHistoryEntry,
  userId: string,
): 'win' | 'loss' | 'draw' {
  if (!entry.result.hasResult) return 'draw';
  if (entry.result.winners.length === 0) return 'draw';
  if (entry.result.winners.includes(userId)) return 'win';
  return 'loss';
}

function MatchResultsTable({ players }: { players: MatchPlayer[] }) {
  const sorted = [...players].sort((a, b) => a.rank - b.rank);
  return (
    <div className={styles.matchResultsTable}>
      <div className={styles.matchResultsHeader}>
        <span className={styles.matchResultsCell_rank}>#</span>
        <span className={styles.matchResultsCell_name}>Игрок</span>
        <span className={styles.matchResultsCell_score}>Очки</span>
      </div>
      {sorted.map((p) => (
        <div
          key={p.actorId}
          className={`${styles.matchResultsRow} ${p.isWinner ? styles.matchResultsRow_winner : ''}`}
        >
          <span className={styles.matchResultsCell_rank}>{p.rank}</span>
          <span className={styles.matchResultsCell_name}>
            {p.actorType === 'user' ? (
              <Link to={`/profile/${p.actorId}`} className={styles.playerLink}>
                {p.displayName}
              </Link>
            ) : (
              <span className={styles.guestName}>{p.displayName}</span>
            )}
            {p.isWinner && <Award size={16} className={styles.winnerIcon} />}
          </span>
          <span className={styles.matchResultsCell_score}>{p.score}</span>
        </div>
      ))}
    </div>
  );
}

export function MatchCard({
  entry,
  userId,
}: {
  entry: MatchHistoryEntry;
  userId: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const outcome = getMatchOutcome(entry, userId);
  const gameLabel = GAME_TYPE_LABELS[entry.gameType] ?? entry.gameType;
  const myPlayer = entry.players.find((p) => p.actorId === userId);

  return (
    <div className={styles.matchCard}>
      {/* Summary row */}
      <button
        className={styles.matchCardHeader}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span
          className={`${styles.matchResult} ${
            outcome === 'win'
              ? styles.matchResult_win
              : outcome === 'loss'
              ? styles.matchResult_loss
              : styles.matchResult_draw
          }`}
        />
        <span className={styles.matchGame}>{gameLabel}</span>
        {myPlayer && (
          <span className={styles.matchScore}>{myPlayer.score} очков · #{myPlayer.rank}</span>
        )}
        <span className={styles.matchDate}>{timeAgo(entry.terminatedAt)}</span>
        <span className={styles.matchExpandIcon}>
          {expanded ? <ChevronUp size={22} strokeWidth={2.5} /> : <ChevronDown size={22} strokeWidth={2.5} />}
        </span>
      </button>

      {/* Expanded results */}
      {expanded && (
        <div className={styles.matchCardBody}>
          <MatchResultsTable players={entry.players} />
        </div>
      )}
    </div>
  );
}
