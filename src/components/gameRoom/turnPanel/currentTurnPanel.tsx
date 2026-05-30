import React, { useRef, useEffect, useState } from 'react';
import styles from './currentTurnPanel.module.scss';
import iconImg from '@/assets/icon.png';
import { TILE_IMAGES } from '@/utils/tiles.config.ts';
import type { Phase } from '@/types/match.ts';
import { pluralizeRu } from '@/utils/pluralize.ts';

interface CurrentTurnPanelProps {
  currentPlayerName: string;
  currentColor: string;
  phase?: Phase;
  currentTileId?: string;
  remainingTiles?: number;
  /** Доля оставшейся колоды в процентах (0–100). Полоса уменьшается по мере убыли квадратов. */
  deckPercent?: number;
  timeLeft: number | null;
  turnDuration?: number;
}

const URGENT_THRESHOLD = 10;
const MARQUEE_SPEED = 40; // px per second

/**
 * Renders text with a continuous marquee scroll when it overflows its container.
 * The text duplicates itself so the loop appears seamless.
 */
const MarqueeText = ({ text, className }: { text: string; className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [needsMarquee, setNeedsMarquee] = useState(false);
  const [duration, setDuration] = useState(6);

  useEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    const check = () => {
      const textWidth = textEl.scrollWidth;
      const containerWidth = container.clientWidth;
      const overflows = textWidth > containerWidth;
      setNeedsMarquee(overflows);
      if (overflows) {
        setDuration(textWidth / MARQUEE_SPEED);
      }
    };

    check();

    const ro = new ResizeObserver(check);
    ro.observe(container);
    return () => ro.disconnect();
  }, [text]);

  return (
    <div ref={containerRef} className={styles.playerCard__nicknameMarquee}>
      {needsMarquee ? (
        <span
          ref={textRef}
          className={`${className ?? ''} ${styles.playerCard__nicknameTrack}`}
          data-text={text}
          style={{ '--marquee-duration': `${duration}s` } as React.CSSProperties}
        >
          {text}
        </span>
      ) : (
        <span ref={textRef} className={className}>
          {text}
        </span>
      )}
    </div>
  );
};

const TimerRing = ({
  timeLeft,
  duration,
}: {
  timeLeft: number | null;
  duration?: number;
}) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const safeDuration = duration && duration > 0 ? duration : 60;
  const isIdle = timeLeft == null;
  const clamped = isIdle ? 0 : Math.max(0, Math.min(timeLeft, safeDuration));
  const ratio = isIdle ? 1 : clamped / safeDuration;
  const dashOffset = circumference * (1 - ratio);
  const isUrgent = !isIdle && timeLeft !== null && timeLeft <= URGENT_THRESHOLD && timeLeft > 0;

  const ringClass = [
    styles.timerRing,
    isUrgent ? styles['timerRing--urgent'] : '',
    isIdle ? styles['timerRing--idle'] : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={ringClass}>
      <svg className={styles.timerRing__svg} viewBox="0 0 56 56">
        <circle className={styles.timerRing__track} cx="28" cy="28" r={radius} />
        <circle
          className={styles.timerRing__progress}
          cx="28"
          cy="28"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className={styles.timerRing__text}>{isIdle ? '—' : timeLeft}</div>
    </div>
  );
};

export const CurrentTurnPanel = ({
  currentPlayerName,
  currentColor,
  phase,
  currentTileId,
  remainingTiles,
  deckPercent,
  timeLeft,
  turnDuration,
}: CurrentTurnPanelProps) => {
  const isPlaceMeeple = phase === 'place_meeple';
  const remaining = remainingTiles ?? 0;
  const barPercent = Math.max(0, Math.min(100, deckPercent ?? 0));
  const tilesWord = pluralizeRu(remaining, ['квадрат', 'квадрата', 'квадратов']);

  return (
    <div
      className={styles.turnPanel}
      style={{ '--player-color': currentColor } as React.CSSProperties}
    >
      <div
        className={`${styles.playerCard} ${
          timeLeft === null ? styles['playerCard--noTimer'] : ''
        }`}
      >
        <div className={styles.playerCard__info}>
          <span className={styles.playerCard__label}>Сейчас ходит:</span>
          <MarqueeText text={currentPlayerName} className={styles.playerCard__nickname} />
        </div>
        {timeLeft !== null && (
          <TimerRing timeLeft={timeLeft} duration={turnDuration} />
        )}
      </div>

      {currentTileId && (
        <div className={styles.phaseCard}>
          <div className={styles.phaseStepper}>
            <span
              className={`${styles.phaseStepper__pill} ${
                !isPlaceMeeple ? styles['phaseStepper__pill--active'] : ''
              }`}
            >
              Квадрат
            </span>
            <span className={styles.phaseStepper__arrow}>→</span>
            <span
              className={`${styles.phaseStepper__pill} ${
                isPlaceMeeple ? styles['phaseStepper__pill--active'] : ''
              }`}
            >
              Подданный
            </span>
          </div>

          <div className={styles.tileWrapper}>
            <img
              src={TILE_IMAGES[currentTileId]}
              className={styles.tileImage}
              alt="Текущий квадрат"
            />
            <div className={styles.tileOverlay} />
          </div>
        </div>
      )}

      {remainingTiles !== undefined && (
        <div className={styles.deckCard}>
          <div className={styles.deckCard__row}>
            <img src={iconImg} alt="" className={styles.deckCard__icon} />
            <span className={styles.deckCard__count}>
              {remaining} {tilesWord}
            </span>
            <span className={styles.deckCard__label}>колода</span>
          </div>
          <div className={styles.deckCard__bar}>
            <div
              className={styles.deckCard__barFill}
              style={{ width: `${barPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
