import { useEffect, useRef, type CSSProperties } from 'react';
import {
  Castle,
  Church,
  ListChecks,
  Route,
  Wheat,
  X,
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
  mobileHistoryOpen?: boolean;
  onMobileHistoryToggle?: () => void;
  hasActionLog?: boolean;
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
  mobileHistoryOpen = false,
  onMobileHistoryToggle,
  hasActionLog = false,
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
  const currentVisibleEvent = visibleEvents[0];

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

  const renderLedgerEntry = ({
    event,
    originalIndex,
  }: (typeof visibleEvents)[number]) => {
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

        <div className={styles.currentSummary}>
          {currentVisibleEvent ? (
            <ol className={styles.currentSummaryList}>
              {renderLedgerEntry(currentVisibleEvent)}
            </ol>
          ) : (
            <p className={styles.emptyLedger}>Начислений пока нет</p>
          )}
        </div>

        {visibleEvents.length > 0 ? (
          <ol className={styles.ledgerList} ref={ledgerRef}>
            {visibleEvents.map(renderLedgerEntry)}
          </ol>
        ) : (
          <p className={styles.emptyLedger}>Начислений пока нет</p>
        )}
      </section>

      <button
        type="button"
        className={`${styles.historyToggle} ${!hasActionLog ? styles.historyToggleFirst : ''}`}
        onClick={onMobileHistoryToggle}
        aria-label={mobileHistoryOpen
          ? 'Скрыть весь итоговый подсчёт'
          : 'Показать весь итоговый подсчёт'}
        aria-expanded={mobileHistoryOpen}
        aria-controls="final-scoring-history"
      >
        <ListChecks size={18} />
      </button>

      {mobileHistoryOpen && (
        <section
          id="final-scoring-history"
          className={styles.historySheet}
          aria-label="Журнал итогового подсчёта"
        >
          <header className={styles.historyHeader}>
            <h3 className={styles.historyTitle}>Все начисления</h3>
            <div className={styles.historyControls}>
              <span className={styles.historyCount}>{visibleEvents.length}</span>
              <button
                type="button"
                className={styles.historyClose}
                onClick={onMobileHistoryToggle}
                aria-label="Закрыть журнал итогового подсчёта"
              >
                <X size={17} />
              </button>
            </div>
          </header>
          {visibleEvents.length > 0 ? (
            <ol className={styles.historyList}>
              {visibleEvents.map(renderLedgerEntry)}
            </ol>
          ) : (
            <p className={styles.emptyLedger}>Начислений пока нет</p>
          )}
        </section>
      )}
    </aside>
  );
};
