import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  Castle,
  ChevronLeft,
  ChevronRight,
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
  const latestEventIndexRef = useRef(safeCurrentIndex);
  const [selectedEventIndex, setSelectedEventIndex] = useState(
    Math.max(0, safeCurrentIndex),
  );
  const visibleEvents = safeCurrentIndex >= 0
    ? events
        .slice(0, safeCurrentIndex + 1)
        .map((event, originalIndex) => ({ event, originalIndex }))
        .reverse()
    : [];
  const selectedVisibleEvent = selectedEventIndex <= safeCurrentIndex
    ? {
        event: events[selectedEventIndex],
        originalIndex: selectedEventIndex,
      }
    : undefined;
  const selectedEventNumber = selectedVisibleEvent ? selectedEventIndex + 1 : 0;
  const progressPercent = totalEvents > 0
    ? (selectedEventNumber / totalEvents) * 100
    : 0;

  useEffect(() => {
    const previousLatestIndex = latestEventIndexRef.current;
    latestEventIndexRef.current = safeCurrentIndex;

    setSelectedEventIndex((previousIndex) => {
      if (safeCurrentIndex < 0) return 0;
      if (previousIndex === previousLatestIndex || previousIndex > safeCurrentIndex) {
        return safeCurrentIndex;
      }
      return previousIndex;
    });
  }, [safeCurrentIndex]);

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

  const showPreviousEvent = () => {
    setSelectedEventIndex((index) => Math.max(0, index - 1));
  };

  const showNextEvent = () => {
    setSelectedEventIndex((index) => Math.min(safeCurrentIndex, index + 1));
  };

  const renderLedgerEntry = ({
    event,
    originalIndex,
  }: (typeof visibleEvents)[number]) => {
    const feature = FEATURE_PRESENTATION[event.payload.featureType];
    const FeatureIcon = feature.icon;
    const isCurrent = originalIndex === selectedEventIndex;

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
  };

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
            aria-label={`Объект ${selectedEventNumber} из ${totalEvents}`}
          >
            {selectedEventNumber} / {totalEvents}
          </span>
        </header>

        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalEvents}
          aria-valuenow={selectedEventNumber}
        >
          <span
            className={styles.progressFill}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className={styles.mobilePager}>
          <button
            type="button"
            className={styles.pagerButton}
            onClick={showPreviousEvent}
            disabled={selectedEventIndex <= 0}
            aria-label="Предыдущий объект подсчёта"
          >
            <ChevronLeft size={24} aria-hidden="true" />
          </button>

          <div className={styles.currentSummary}>
            {selectedVisibleEvent?.event ? (
              <ol className={styles.currentSummaryList}>
                {renderLedgerEntry(selectedVisibleEvent)}
              </ol>
            ) : (
              <p className={styles.emptyLedger}>Начислений пока нет</p>
            )}
          </div>

          <button
            type="button"
            className={styles.pagerButton}
            onClick={showNextEvent}
            disabled={selectedEventIndex >= safeCurrentIndex}
            aria-label="Следующий объект подсчёта"
          >
            <ChevronRight size={24} aria-hidden="true" />
          </button>
        </div>

        {visibleEvents.length > 0 ? (
          <ol className={styles.ledgerList} ref={ledgerRef}>
            {visibleEvents.map(renderLedgerEntry)}
          </ol>
        ) : (
          <p className={styles.emptyLedger}>Начислений пока нет</p>
        )}
      </section>
    </aside>
  );
};
