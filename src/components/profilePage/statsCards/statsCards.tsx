import type { OverallStats } from '@/types/user.ts';
import styles from './statsCards.module.scss';

export function StatsCards({ stats }: { stats: OverallStats }) {
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
