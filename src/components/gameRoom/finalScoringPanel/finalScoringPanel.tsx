import { useEffect, useRef, type CSSProperties } from 'react';
import {
  Castle,
  Church,
  Route,
  Wheat,
  type LucideIcon,
} from 'lucide-react';
import type { FeatureScoredEvent } from '@/types/match';
import styles from './finalScoringPanel.module.scss';

type FeatureType = FeatureScoredEvent['payload']['featureType'];

export interface FinalScoringPanelPlayer {
  actorId: string;
  displayName: string;
  color: string;
}

export interface FinalScoringPanelProps {
  /** All final-scoring events in playback order. */
  events: FeatureScoredEvent[];
  players: FinalScoringPanelPlayer[];
  /** Zero-based index of the event currently being animated. */
  currentEventIndex: number;
}

interface FeaturePresentation {
  label: string;
  icon: LucideIcon;
  accent: string;
}

const FEATURE_PRESENTATION: Record<FeatureType, FeaturePresentation> = {
  road: {
    label: 'Дорога',
    icon: Route,
    accent: '#8a6b47',
  },
  city: {
    label: 'Замок',
    icon: Castle,
    accent: '#9a4f45',
  },
  monastery: {
    label: 'Монастырь',
    icon: Church,
    accent: '#667d8d',
  },
  field: {
    label: 'Поле',
    icon: Wheat,
    accent: '#637d45',
  },
};

const formatPoints = (points: number): string => (
  points > 0 ? `+${points}` : `${points}`
);

export const FinalScoringPanel = ({
  events,
  players,
  currentEventIndex,
}: FinalScoringPanelProps) => {
  const ledgerRef = useRef<HTMLOListElement>(null);
  const playersById = new Map(players.map((player) => [player.actorId, player]));
  const totalEvents = events.length;
  const safeCurrentIndex = totalEvents > 0
    ? Math.min(Math.max(0, currentEventIndex), totalEvents - 1)
    : -1;
  const currentEventNumber = safeCurrentIndex + 1;
  const visibleEvents = safeCurrentIndex >= 0
    ? events
        .slice(0, safeCurrentIndex + 1)
        .map((event, originalIndex) => ({ event, originalIndex }))
        .reverse()
    : [];
  const progressPercent = totalEvents > 0
    ? (currentEventNumber / totalEvents) * 100
    : 0;

  useEffect(() => {
    const ledger = ledgerRef.current;
    if (!ledger) {
      return;
    }

    ledger.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [safeCurrentIndex]);

  return (
    <aside
      className={styles.panel}
      aria-live="polite"
      aria-label="Итоговый подсчёт очков"
    >
      <section className={`${styles.card} ${styles.ledgerCard}`}>
        <header className={styles.header}>
          <h2 className={styles.title}>Итоговый подсчёт</h2>
          <span
            className={styles.progressCount}
            aria-label={`Объект ${currentEventNumber} из ${totalEvents}`}
          >
            {currentEventNumber} / {totalEvents}
          </span>
        </header>

        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalEvents}
          aria-valuenow={currentEventNumber}
        >
          <span
            className={styles.progressFill}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {visibleEvents.length > 0 ? (
          <ol className={styles.ledgerList} ref={ledgerRef}>
            {visibleEvents.map(({ event, originalIndex }) => {
              const feature = FEATURE_PRESENTATION[event.payload.featureType];
              const FeatureIcon = feature.icon;
              const isCurrent = originalIndex === safeCurrentIndex;

              return (
                <li
                  key={event.id}
                  className={`${styles.ledgerEntry} ${isCurrent ? styles.currentEntry : ''}`}
                  style={{ '--feature-accent': feature.accent } as CSSProperties}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <div className={styles.entryHeader}>
                    <span className={styles.entryIcon} aria-hidden="true">
                      <FeatureIcon size={16} strokeWidth={2.1} />
                    </span>
                    <strong className={styles.entryTitle}>{feature.label}</strong>
                  </div>

                  {event.payload.awards.length > 0 ? (
                    <ul className={styles.awardList}>
                      {event.payload.awards.map((award) => {
                        const player = playersById.get(award.actorId);
                        const playerColor = player?.color ?? '#4f6642';

                        return (
                          <li
                            key={award.actorId}
                            className={styles.awardRow}
                            style={{ '--player-color': playerColor } as CSSProperties}
                          >
                            <span className={styles.playerDot} aria-hidden="true" />
                            <span className={styles.playerName}>
                              {player?.displayName ?? 'Игрок'}
                            </span>
                            <strong className={styles.awardPoints}>
                              {formatPoints(award.points)}
                            </strong>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className={styles.emptyAwards}>Очки не начислены</p>
                  )}
                </li>
              );
            })}
          </ol>
        ) : (
          <p className={styles.emptyLedger}>Начислений пока нет</p>
        )}
      </section>
    </aside>
  );
};
