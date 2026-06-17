import { useEffect, useState, type CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import {
  User,
  Trophy,
  Lock,
  Pencil,
  X
} from 'lucide-react';
import styles from './profilePage.module.scss';
import { userService } from '@/api/user.ts';
import { useUserStore } from '@/store/useUserStore.ts';
import Modal from '../modal/modal.tsx';
import { EditProfileModal } from './editProfileModal/editProfileModal.tsx';
import type { UserProfile, OwnUserProfile } from '@/types/user.ts';
import { isOwnProfile, GAME_TYPE_LABELS } from '@/types/user.ts';
import { avatarSrc } from '@/utils/avatar.ts';
import elfAvatar from '@/assets/elf-avatar.svg';
import elfMountains from '@/assets/elf-mountains.png';
import editModalStyles from './editProfileModal/editProfileModal.module.scss';
import { StatsCards } from './statsCards/statsCards.tsx';
import { MatchCard } from './matchCard/matchCard.tsx';
import { useIsMobile } from '@/hooks/useIsMobile.ts';

// ─── Main component ───────────────────────────────────────────────────────────

const ALL_GAMES = 'all';
type CompletionFilter = 'all' | 'finished' | 'unfinished';

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { actor, token } = useUserStore();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsTab, setStatsTab] = useState<'overall' | string>('overall');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [matchFilter, setMatchFilter] = useState<string>(ALL_GAMES);
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>('all');
  const isMobile = useIsMobile();

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

  const gameFilteredMatches =
    matchFilter === ALL_GAMES
      ? matchHistory
      : matchHistory.filter((m) => m.gameType === matchFilter);

  const filteredMatches =
    completionFilter === 'all'
      ? gameFilteredMatches
      : completionFilter === 'finished'
        ? gameFilteredMatches.filter((m) => m.result.hasResult)
        : gameFilteredMatches.filter((m) => !m.result.hasResult);

  const recentMatches = filteredMatches.slice(0, 5);

  const activeStats =
    statsTab === 'overall'
      ? stats.overall
      : stats.byGame.find((g) => g.gameType === statsTab) ??
        stats.overall;

  const achievements = Array.from({ length: isMobile ? 12 : 8 }, (_, i) => ({
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

              {/* Mobile-only overlay: name + email + edit button over the photo */}
              <div className={styles.avatarOverlayInfo}>
                <div className={styles.avatarOverlayText}>
                  <span className={styles.avatarOverlayName}>{profile.nickname}</span>
                  {isOwnProfile(profile) && profile.email && (
                    <span className={styles.avatarOverlayEmail}>{profile.email}</span>
                  )}
                </div>
                {isOwn && (
                  <button
                    className={styles.avatarOverlayEditBtn}
                    onClick={() => setEditOpen(true)}
                    aria-label="Редактировать профиль"
                  >
                    <Pencil size={18} />
                  </button>
                )}
              </div>
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

            {/* Completion filter tabs */}
            <div className={styles.matchFilterTabs}>
              <button
                className={`${styles.matchFilterTab} ${completionFilter === 'all' ? styles.matchFilterTab_active : ''}`}
                onClick={() => setCompletionFilter('all')}
              >
                Все
              </button>
              <button
                className={`${styles.matchFilterTab} ${completionFilter === 'finished' ? styles.matchFilterTab_active : ''}`}
                onClick={() => setCompletionFilter('finished')}
              >
                Завершённые
              </button>
              <button
                className={`${styles.matchFilterTab} ${completionFilter === 'unfinished' ? styles.matchFilterTab_active : ''}`}
                onClick={() => setCompletionFilter('unfinished')}
              >
                Незавершённые
              </button>
            </div>

            {recentMatches.length === 0 ? (
              <div className={styles.emptyState}>
                <img
                  src={elfMountains}
                  alt="Эльф смотрит на горы"
                  className={styles.emptyStateImg}
                />
                <p className={styles.emptyStateText}>
                  История партий пока пуста. <br/>Когда появятся партии, они будут показаны здесь
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
      <Modal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        className={styles.historyModalWindow}
      >
        <div className={styles.historyModalCard}>
          <div className={styles.historyModalHeader}>
            <p className={styles.historyModalTitle}>
              История матчей ({filteredMatches.length})
            </p>
            <button
              className={styles.historyModalClose}
              onClick={() => setHistoryOpen(false)}
              aria-label="Закрыть историю"
            >
              <X size={22} />
            </button>
          </div>
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
