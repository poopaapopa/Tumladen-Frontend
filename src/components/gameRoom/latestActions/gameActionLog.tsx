import { useState } from 'react';
import { ScrollText } from 'lucide-react';
import clsx from 'clsx';
import styles from './latestAction.module.scss';
import { TILE_IMAGES } from '@/utils/tiles.config.ts';
import type { LogEntry } from '@/types/match.ts';

interface GameActionLogProps {
  entries: LogEntry[];
}

export const GameActionLog = ({ entries }: GameActionLogProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle button — visible only on small screens via CSS */}
      <button
        className={styles.logToggle}
        onClick={() => setMobileOpen((prev) => !prev)}
        aria-label="Показать лог действий"
      >
        <ScrollText size={18} />
      </button>

      <div
        className={clsx(
          styles.latestActions,
          mobileOpen && styles['latestActions--mobileOpen'],
        )}
      >
        <h4 className={styles.latestActions__title}>Последние действия</h4>
        <div className={styles.latestActions__list}>
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={styles.latestActions__item}
              style={{ '--player-color': entry.color } as React.CSSProperties}
            >
              <div className={styles.latestActions__content}>
                <span
                  className={styles.latestActions__nickname}
                  style={{ color: entry.color }}
                >
                  {entry.nickname}
                </span>
                <span className={styles.latestActions__text}>{entry.text}</span>
              </div>
              {entry.tileId && (
                <div className={styles.latestActions__image}>
                  <img src={TILE_IMAGES[entry.tileId]} alt="tile" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
