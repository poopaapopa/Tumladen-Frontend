import { useState } from 'react';
import { ScrollText, X } from 'lucide-react';
import clsx from 'clsx';
import styles from './latestAction.module.scss';
import { TILE_IMAGES } from '@/utils/tiles.config.ts';
import type { LogEntry } from '@/types/match.ts';

interface GameActionLogProps {
  entries: LogEntry[];
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
  elevateMobilePanel?: boolean;
}

export const GameActionLog = ({
  entries,
  mobileOpen,
  onMobileOpenChange,
  elevateMobilePanel = false,
}: GameActionLogProps) => {
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const isMobileOpen = mobileOpen ?? internalMobileOpen;

  const setMobilePanelOpen = (nextOpen: boolean) => {
    if (mobileOpen === undefined) {
      setInternalMobileOpen(nextOpen);
    }
    onMobileOpenChange?.(nextOpen);
  };

  const toggleMobilePanel = () => setMobilePanelOpen(!isMobileOpen);

  return (
    <>
      {/* Mobile toggle button — visible only on small screens via CSS */}
      <button
        className={styles.logToggle}
        onClick={toggleMobilePanel}
        aria-label={isMobileOpen ? 'Скрыть лог действий' : 'Показать лог действий'}
        aria-expanded={isMobileOpen}
        aria-controls="game-action-log"
      >
        <ScrollText size={18} />
      </button>

      <div
        id="game-action-log"
        className={clsx(
          styles.latestActions,
          isMobileOpen && styles['latestActions--mobileOpen'],
          elevateMobilePanel && styles['latestActions--aboveFinalScoring'],
        )}
      >
        <div className={styles.latestActions__header}>
          <h4 className={styles.latestActions__title}>Последние действия</h4>
          <button
            type="button"
            className={styles.latestActions__close}
            onClick={() => setMobilePanelOpen(false)}
            aria-label="Закрыть лог действий"
          >
            <X size={17} />
          </button>
        </div>
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
              {entry.tileId && TILE_IMAGES[entry.tileId] && (
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
