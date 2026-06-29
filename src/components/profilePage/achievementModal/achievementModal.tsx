import { Calendar, X } from 'lucide-react';
import Modal from '@/components/modal/modal';
import type { Achievement } from '@/types/user';
import { formatDate } from '@/utils/time';
import { getAchievementImage } from '@/utils/achievementImages';
import styles from './achievementModal.module.scss';

interface AchievementModalProps {
  achievement: Achievement | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AchievementModal({ achievement, isOpen, onClose }: AchievementModalProps) {
  if (!achievement) {
    return null;
  }

  const image = getAchievementImage(achievement.code);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.modal}>
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Закрыть"
        >
          <X size={22} />
        </button>
        <div className={styles.iconSide}>
          <div className={styles.imageWrapper}>
            {image ? (
              <img src={image} alt={achievement.title} className={styles.image} />
            ) : (
              <span className={styles.fallback}>{achievement.title.charAt(0)}</span>
            )}
          </div>
        </div>
        <div className={styles.infoSide}>
          <h2 className={styles.title}>{achievement.title}</h2>
          <p className={styles.description}>{achievement.description}</p>
          {achievement.unlockedAt && (
            <div className={styles.dateRow}>
              <Calendar size={16} />
              <span>Разблокировано: {formatDate(achievement.unlockedAt)}</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
