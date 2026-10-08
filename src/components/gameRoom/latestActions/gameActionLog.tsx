import { useState } from 'react';
import { ScrollText, X } from 'lucide-react';
import clsx from 'clsx';
import styles from './latestAction.module.scss';
import { TILE_IMAGES } from '@/utils/tiles.config.ts';
import type { MatchActivity, MatchPlayer } from '@/types/match.ts';
import { getPlayerColorBySeat } from '@/utils/playerColor.ts';

interface PresentedAction {
  id: string;
  text: string;
  color: string;
  nickname: string;
  tileId?: string;
}

const FEATURE_TYPE_LABELS: Record<string, string> = {
  city: 'в город',
  road: 'на дорогу',
  monastery: 'в монастырь',
  field: 'на поле',
};

const describeFeature = (featureType: unknown): string | null => {
  if (typeof featureType !== 'string' || featureType.length === 0) return null;
  return FEATURE_TYPE_LABELS[featureType] ?? `на ${featureType}`;
};

const describeActivity = (activity: MatchActivity): string | null => {
  switch (activity.type) {
    case 'tile_placed':
      return 'поставил квадрат';
    case 'meeple_placed': {
      const feature = describeFeature(activity.payload?.featureType);
      return feature
        ? `поставил подданного ${feature}`
        : 'поставил подданного';
    }
    default:
      return null;
  }
};

const presentMatchActivities = (
  activities: MatchActivity[],
  players: MatchPlayer[],
): PresentedAction[] => {
  const playersByActorId = new Map(
    players.map((player) => [player.actorId, player]),
  );

  return activities.flatMap((activity) => {
    const text = describeActivity(activity);
    if (!text) return [];

    const player = playersByActorId.get(activity.actorId);
    const tileId = activity.type === 'tile_placed'
      && typeof activity.payload?.tileId === 'string'
      ? activity.payload.tileId
      : undefined;

    return [{
      id: activity.id,
      text,
      color: getPlayerColorBySeat(player?.seat),
      nickname: player?.displayName || 'Неизвестный герой',
      tileId,
    }];
  });
};

interface GameActionLogProps {
  activities: MatchActivity[];
  players: MatchPlayer[];
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
  elevateMobilePanel?: boolean;
}

export const GameActionLog = ({
  activities,
  players,
  mobileOpen,
  onMobileOpenChange,
  elevateMobilePanel = false,
}: GameActionLogProps) => {
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const isMobileOpen = mobileOpen ?? internalMobileOpen;
  const entries = presentMatchActivities(activities, players);

  const setMobilePanelOpen = (nextOpen: boolean) => {
    if (mobileOpen === undefined) {
      setInternalMobileOpen(nextOpen);
    }
    onMobileOpenChange?.(nextOpen);
  };

  const toggleMobilePanel = () => setMobilePanelOpen(!isMobileOpen);

  if (entries.length === 0) return null;

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
