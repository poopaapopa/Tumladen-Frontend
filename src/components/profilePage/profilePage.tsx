import { useEffect, useState, type CSSProperties } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User,
  Trophy,
  Lock,
  Pencil,
  ChevronDown,
  ChevronUp,
  Award,
} from 'lucide-react';

import styles from './profilePage.module.scss';
import { userService } from '@/api/user.ts';
import { useUserStore } from '@/store/useUserStore.ts';
import Modal from '../modal/modal.tsx';
import { EditProfileModal } from '../editProfileModal/editProfileModal.tsx';
import type {
  UserProfile,
  OwnUserProfile,
  MatchHistoryEntry,
  OverallStats,
  MatchPlayer,
} from '@/types/user.ts';
import { isOwnProfile, GAME_TYPE_LABELS } from '@/types/user.ts';
import { MINIO_URL } from '@/api/config.ts';
import elfAvatar from '@/assets/elf-avatar.svg';
import elfMountains from '@/assets/elf-mountains.png';
import editModalStyles from '../editProfileModal/editProfileModal.module.scss';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  const months = Math.floor(days / 30);

  if (minutes < 60) return `${minutes} мин. назад`;
  if (hours < 24) return `${hours} ч. назад`;
  if (days < 30) return `${days} дн. назад`;
  return `${months} мес. назад`;
}

function getMatchOutcome(
  entry: MatchHistoryEntry,
  userId: string,
): 'win' | 'loss' | 'draw' {
  if (!entry.result.hasResult) return 'draw';
  if (entry.result.winners.length === 0) return 'draw';
  if (entry.result.winners.includes(userId)) return 'win';
  return 'loss';
}

function avatarSrc(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${MINIO_URL}${url}`;
}

// ─── Stats cards ──────────────────────────────────────────────────────────────

function StatsCards({ stats }: { stats: OverallStats }) {
  return (
    <div className={styles.statsCards}>
      <div className={styles.statCard}>
        <span className={styles.statCardLabel}>Матчи</span>
        <span className={styles.statCardValue}>{stats.matches}</span>
      </div>
      <div className={styles.statCard}>
        <span className={styles.statCardLabel}>Победы</span>
        <span className={styles.statCardValue}>{stats.wins}</span>
        <span className={styles.statCardSub}>{(stats.winRate * 100).toFixed(0)}% побед</span>
      </div>
      <div className={styles.statCard}>
        <span className={styles.statCardLabel}>Всего очков</span>
        <span className={styles.statCardValue}>{stats.totalScore}</span>
        <span className={styles.statCardSub}>{stats.averageScore.toFixed(0)} в среднем</span>
      </div>
      <div className={styles.statCard}>
        <span className={styles.statCardLabel}>Рекорд</span>
        <span className={styles.statCardValue}>{stats.bestScore}</span>
      </div>
    </div>
  );
}

// ─── Match results table ──────────────────────────────────────────────────────

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

// ─── Match card (expandable) ──────────────────────────────────────────────────

function MatchCard({
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

// ─── Main component ───────────────────────────────────────────────────────────

const ALL_GAMES = 'all';

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { actor, token } = useUserStore();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsTab, setStatsTab] = useState<'overall' | string>('overall');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [matchFilter, setMatchFilter] = useState<string>(ALL_GAMES);

  // Edit profile modal
  const [editOpen, setEditOpen] = useState(false);
  const [editCloseTrigger, setEditCloseTrigger] = useState(0);

  const isOwn = !!actor && actor.id === id;

  // Fetch profile
  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    const fetchProfile = async () => {
      try {
        let data: UserProfile;
        if (isOwn && token) {
          data = await userService.getMe(token);
        } else {
          data = await userService.getUserById(id, token ?? undefined);
        }
        setProfile(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Не удалось загрузить профиль');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [id, isOwn, token]);

  // ── Render states ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.stateCenter}>
          <User size={48} strokeWidth={1.5} />
          <span>Загрузка профиля…</span>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.page}>
        <div className={styles.stateCenter}>
          <span>{error ?? 'Профиль не найден'}</span>
        </div>
      </div>
    );
  }

  // ── Derived data ───────────────────────────────────────────────────────────

  const src = avatarSrc(profile.avatarUrl);
  const stats = profile.stats ?? {
    overall: { matches: 0, wins: 0, draws: 0, losses: 0, winRate: 0, totalScore: 0, averageScore: 0, bestScore: 0 },
    byGame: [],
  };
  const matchHistory = profile.matchHistory ?? [];
  const gameTypes = stats.byGame.map((g) => g.gameType);

  // All unique game types present in match history
  const matchGameTypes = Array.from(
    new Set(matchHistory.map((m) => m.gameType)),
  );

  const filteredMatches =
    matchFilter === ALL_GAMES
      ? matchHistory
      : matchHistory.filter((m) => m.gameType === matchFilter);

  const recentMatches = filteredMatches.slice(0, 5);

  const activeStats =
    statsTab === 'overall'
      ? stats.overall
      : stats.byGame.find((g) => g.gameType === statsTab) ??
        stats.overall;

  // Placeholder achievements (8 slots)
  const achievements = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    unlocked: false,
  }));

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* ── Left column ─────────────────────────────────────────────────── */}
        <div className={styles.leftCol}>
          {/* Avatar card */}
          <div className={styles.avatarCard}>
            <div className={styles.avatarWrapper}>
              {src ? (
                <img
                  src={src}
                  alt={profile.nickname}
                  className={styles.avatar}
                />
              ) : (
                <div
                  className={styles.avatarPlaceholder}
                  role="img"
                  aria-label="Аватар по умолчанию"
                  style={{ '--avatar-url': `url(${elfAvatar})` } as CSSProperties}
                />
              )}
            </div>
          </div>

          {/* Achievements card */}
          <div className={styles.achievementsCard}>
            <p className={styles.sectionTitle}>Достижения</p>
            <div className={styles.achievementsGrid}>
              {achievements.map((a) => (
                <div
                  key={a.id}
                  className={`${styles.achievementBadge} ${
                    a.unlocked ? styles.achievementBadge_unlocked : ''
                  }`}
                  title={a.unlocked ? 'Достижение получено' : 'Заблокировано'}
                >
                  {a.unlocked ? (
                    <Trophy size={20} />
                  ) : (
                    <Lock size={16} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right column ────────────────────────────────────────────────── */}
        <div className={styles.rightCol}>
          {/* Nickname + email + edit button header */}
          <div className={styles.profileNameHeader}>
            <div className={styles.profileNameLeft}>
              <span className={styles.profileNickname}>{profile.nickname}</span>
              {isOwnProfile(profile) && (
                <span className={styles.profileEmail}>{profile.email}</span>
              )}
            </div>
            {isOwn && (
              <button
                className={styles.editBtn}
                onClick={() => setEditOpen(true)}
              >
                <Pencil size={14} />
                Редактировать
              </button>
            )}
          </div>

          {/* Recent matches card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Последние игры</span>
            </div>

            {/* Game filter tabs for match list */}
            <div className={styles.matchFilterTabs}>
              <button
                className={`${styles.matchFilterTab} ${matchFilter === ALL_GAMES ? styles.matchFilterTab_active : ''}`}
                onClick={() => setMatchFilter(ALL_GAMES)}
              >
                Все
              </button>
              {matchGameTypes.map((gt) => (
                <button
                  key={gt}
                  className={`${styles.matchFilterTab} ${matchFilter === gt ? styles.matchFilterTab_active : ''}`}
                  onClick={() => setMatchFilter(gt)}
                >
                  {GAME_TYPE_LABELS[gt] ?? gt}
                </button>
              ))}
            </div>

            {recentMatches.length === 0 ? (
              <div className={styles.emptyState}>
                <img
                  src={elfMountains}
                  alt="Эльф смотрит на горы"
                  className={styles.emptyStateImg}
                />
                <p className={styles.emptyStateText}>
                  Ваши подвиги ещё не вписаны в историю.<br />
                  Время сделать первый ход!
                </p>
              </div>
            ) : (
              <>
                <div className={styles.matchList}>
                  {recentMatches.map((entry) => (
                    <MatchCard key={entry.id} entry={entry} userId={profile.id} />
                  ))}
                </div>

                {filteredMatches.length > 5 && (
                  <button
                    className={styles.viewAllBtn}
                    onClick={() => setHistoryOpen(true)}
                  >
                    Посмотреть всю историю ({filteredMatches.length} матчей)
                  </button>
                )}
              </>
            )}
          </div>

          {/* Stats card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Статистика</span>
            </div>

            {/* Game-type tabs */}
            <div className={styles.statsTabs}>
              <button
                className={`${styles.statsTab} ${
                  statsTab === 'overall' ? styles.statsTab_active : ''
                }`}
                onClick={() => setStatsTab('overall')}
              >
                Общая
              </button>
              {gameTypes.map((gt) => (
                <button
                  key={gt}
                  className={`${styles.statsTab} ${
                    statsTab === gt ? styles.statsTab_active : ''
                  }`}
                  onClick={() => setStatsTab(gt)}
                >
                  {GAME_TYPE_LABELS[gt] ?? gt}
                </button>
              ))}
            </div>

            <StatsCards stats={activeStats} />
          </div>
        </div>
      </div>

      {/* ── Full history modal ─────────────────────────────────────────────── */}
      <Modal isOpen={historyOpen} onClose={() => setHistoryOpen(false)}>
        <div>
          <p className={styles.historyModalTitle}>
            История матчей ({filteredMatches.length})
          </p>
          <div className={styles.historyModal}>
            {filteredMatches.map((entry) => (
              <MatchCard key={entry.id} entry={entry} userId={profile.id} />
            ))}
          </div>
        </div>
      </Modal>

      {/* ── Edit profile modal ─────────────────────────────────────────────── */}
      {isOwn && isOwnProfile(profile) && (
        <Modal
          isOpen={editOpen}
          onClose={() => setEditCloseTrigger((n) => n + 1)}
          className={editModalStyles.wideModal}
        >
          <EditProfileModal
            profile={profile as OwnUserProfile}
            closeAttemptTrigger={editCloseTrigger}
            onConfirmClose={() => {
              setEditOpen(false);
              setEditCloseTrigger(0);
            }}
            onSuccess={(updated) => {
              setProfile((current) => ({
                ...(current ?? profile),
                ...updated,
                stats: updated.stats ?? (current ?? profile).stats,
                matchHistory: updated.matchHistory ?? (current ?? profile).matchHistory,
              }));
              setEditOpen(false);
              setEditCloseTrigger(0);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
