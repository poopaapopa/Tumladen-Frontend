import styles from './latestAction.module.scss';
import { TILE_IMAGES } from '@/utils/tiles.config.ts';
import type { LogEntry } from '@/types/match.ts';

interface GameActionLogProps {
  entries: LogEntry[];
}

export const GameActionLog = ({ entries }: GameActionLogProps) => {
  return (
    <div className={styles.latestActions}>
      <h4 className={styles.latestActions__title}>Последние действия:</h4>
      <div className={styles.latestActions__list}>
        {entries.map((entry) => (
          <div key={entry.id} className={styles.latestActions__item}>
            <span className={styles.latestActions__time}>
              {entry.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>

            <div className={styles.latestActions__content}>
              <span
                className={styles.latestActions__nickname}
                style={{ color: entry.color }}
              >
                {entry.nickname}
              </span>
              <span className={styles.latestActions__text}>{entry.text}</span>
              {entry.tileId && (
                <div className={styles.latestActions__image}>
                  <img src={TILE_IMAGES[entry.tileId]} alt="tile" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
