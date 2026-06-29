import { Lock } from 'lucide-react';
import type { Achievement } from '@/types/user';
import { getAchievementImage } from '@/utils/achievementImages';
import styles from './achievementBadge.module.scss';

interface AchievementBadgeProps {
  achievement: Achievement;
  onClick?: () => void;
}

export function AchievementBadge({ achievement, onClick }: AchievementBadgeProps) {
  const unlocked = !!achievement.unlockedAt;
  const image = unlocked ? getAchievementImage(achievement.code) : undefined;

  return (
    <button
      type="button"
      className={`${styles.badge} ${unlocked ? styles.unlocked : styles.locked}`}
      onClick={unlocked ? onClick : undefined}
      disabled={!unlocked}
      title={unlocked ? achievement.title : 'Заблокировано'}
      aria-label={unlocked ? achievement.title : 'Достижение заблокировано'}
    >
      {unlocked && image ? (
        <img src={image} alt={achievement.title} className={styles.image} />
      ) : unlocked ? (
        <span className={styles.initial}>{achievement.title.charAt(0)}</span>
      ) : (
        <Lock size={16} />
      )}
    </button>
  );
}
