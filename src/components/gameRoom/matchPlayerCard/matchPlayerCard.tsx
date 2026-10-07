import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { Star, Crown, Bot, Smile, Shield, Flame } from "lucide-react";
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import styles from './matchPlayerCard.module.scss';
import defaultAvatar from '@/assets/elf-avatar.svg';
import { avatarSrc } from '@/utils/avatar.ts';
import { getPlayerColorBySeat } from "@/utils/playerColor.ts";
import { Meeple3D } from "./meeple.tsx";
import type { ActorType, BotDifficulty } from '@/types/room';
import type { MeepleType } from '@/types/match';
import { MarqueeText } from '@/components/marqueeText/marqueeText';

const DIFFICULTY_LABELS: Record<BotDifficulty, string> = {
  easy: 'Лёгкий',
  medium: 'Средний',
  hard: 'Сложный',
};

const DIFFICULTY_COLORS: Record<BotDifficulty, string> = {
  easy: '#27AE60',
  medium: '#E2A308',
  hard: '#e74c3c',
};

const DIFFICULTY_ICONS: Record<BotDifficulty, LucideIcon> = {
  easy: Smile,
  medium: Shield,
  hard: Flame,
};

const FULL_REGULAR_MEEPLE_COUNT = 7;

interface MatchPlayerCardProps {
  displayName: string;
  isRoomOwner: boolean;
  isTurn: boolean;
  score: number;
  meeplesLeft: number;
  bigMeeplesLeft?: number;
  seat: number;
  avatarUrl?: string | null;
  actorType?: ActorType;
  botDifficulty?: BotDifficulty;
  canSelectMeeple?: boolean;
  selectedMeepleType?: MeepleType;
  onSelectMeepleType?: (type: MeepleType) => void;
  mode?: 'playing' | 'ranking';
  rank?: number;
  isCurrentUser?: boolean;
}

export const MatchPlayerCard = forwardRef<HTMLDivElement, MatchPlayerCardProps>(({
  displayName,
  isRoomOwner,
  isTurn,
  score,
  meeplesLeft,
  bigMeeplesLeft = 0,
  seat,
  avatarUrl,
  actorType,
  botDifficulty,
  canSelectMeeple,
  selectedMeepleType,
  onSelectMeepleType,
  mode = 'playing',
  rank,
  isCurrentUser = false,
}, ref) => {
  const playerColor = getPlayerColorBySeat(seat);
  const isRanking = mode === 'ranking';
  const [displayScore, setDisplayScore] = useState(score);
  const [isScoreAnimating, setIsScoreAnimating] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const animationTimeoutRef = useRef<number | null>(null);
  const displayedScoreRef = useRef(score);

  const isBot = actorType === 'bot';

  useEffect(() => {
    displayedScoreRef.current = displayScore;
  }, [displayScore]);

  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (animationTimeoutRef.current) {
      window.clearTimeout(animationTimeoutRef.current);
    }

    const startScore = displayedScoreRef.current;

    if (score <= startScore) {
      animationFrameRef.current = requestAnimationFrame(() => {
        setDisplayScore(score);
        setIsScoreAnimating(false);
      });

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }

    const difference = score - startScore;
    const duration = Math.min(3400, Math.max(1500, difference * 270));
    const animationStart = performance.now();
    let hasStarted = false;

    const animateScore = (timestamp: number) => {
      if (!hasStarted) {
        hasStarted = true;
        setIsScoreAnimating(true);
      }

      const progress = Math.min((timestamp - animationStart) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 2.1);
      const nextScore = Math.round(startScore + difference * easedProgress);

      setDisplayScore((prevScore) => (nextScore > prevScore ? nextScore : prevScore));

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animateScore);
        return;
      }

      setDisplayScore(score);
      animationTimeoutRef.current = window.setTimeout(() => {
        setIsScoreAnimating(false);
      }, 450);
    };

    animationFrameRef.current = requestAnimationFrame(animateScore);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (animationTimeoutRef.current) {
        window.clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [score]);

  const countClassName = useMemo(() => clsx(
    styles.playerCard__count,
    isScoreAnimating && styles.playerCard__count_animating
  ), [isScoreAnimating]);
  const rankClassName = clsx(
    styles.playerCard__rank,
    rank === 1 && styles.playerCard__rank_first,
    rank === 2 && styles.playerCard__rank_second,
    rank === 3 && styles.playerCard__rank_third,
  );
  const rankAriaLabel = rank === undefined ? 'Место ещё не определено' : `Место ${rank}`;

  const hasAvatar = Boolean(avatarUrl);

  return (
    <div
      ref={ref}
      className={clsx(
        styles.playerCard,
        isRanking && styles.playerCard_ranking,
        !isRanking && (isTurn ? styles.playerCard_active : styles.playerCard_dimmed),
      )}
      style={{
        ['--player-color' as string]: playerColor
      }}
    >
      {isRanking && (
        <span
          className={clsx(rankClassName, styles.playerCard__rank_desktop)}
          aria-label={rankAriaLabel}
        >
          {rank ?? '—'}
        </span>
      )}

      {isBot ? (
        <span
          className={styles.playerCard__imageFallback}
          aria-label={displayName}
          role="img"
          style={{ ['--avatar-url' as string]: `url(${defaultAvatar})` }}
        />
      ) : hasAvatar ? (
        <img src={avatarSrc(avatarUrl)} alt={displayName} className={styles.playerCard__image} />
      ) : (
        <span
          className={styles.playerCard__imageFallback}
          aria-label={displayName}
          role="img"
          style={{ ['--avatar-url' as string]: `url(${defaultAvatar})` }}
        />
      )}

      <div className={styles.playerCard__body}>
        <div className={styles.playerCard__header}>
          <div className={styles.playerCard__nickname}>
            {isBot && <Bot size={18} className={styles.playerCard__botIcon} />}
            <div className={styles.playerCard__nicknameWrapper}>
              <MarqueeText text={displayName} />
            </div>
            {isRanking && isCurrentUser && (
              <span className={styles.playerCard__youBadge}>Вы</span>
            )}
            {isBot && botDifficulty && (() => {
              const DiffIcon = DIFFICULTY_ICONS[botDifficulty];
              return (
                <span
                  className={styles.playerCard__difficultyBadge}
                  style={{ backgroundColor: DIFFICULTY_COLORS[botDifficulty] }}
                >
                  <span className={styles.playerCard__difficultyLabel}>
                    {DIFFICULTY_LABELS[botDifficulty]}
                  </span>
                  <DiffIcon size={12} className={styles.playerCard__difficultyIcon} />
                </span>
              );
            })()}
            {isRoomOwner && !isBot && <Crown size={18} className={styles.playerCard__crown} />}
          </div>
          <div className={styles.playerCard__scoreGroup}>
            <span className={countClassName}>
              {displayScore}
              <Star size={20} strokeWidth={2.5} className={styles.playerCard__starIcon} />
            </span>
            {isRanking && (
              <span
                className={clsx(rankClassName, styles.playerCard__rank_mobile)}
                aria-label={rankAriaLabel}
              >
                {rank ?? '—'}
              </span>
            )}
          </div>
        </div>

        <div
          className={clsx(
            styles.playerCard__figurines,
            meeplesLeft === FULL_REGULAR_MEEPLE_COUNT && styles.playerCard__figurines_full,
          )}
        >
          {bigMeeplesLeft > 0 && (
            <div
              className={clsx(
                styles.playerCard__meepleWrapper,
                styles.playerCard__meepleWrapper_big,
                canSelectMeeple && styles.playerCard__meepleWrapper_selectable,
                canSelectMeeple && selectedMeepleType === 'big' && styles.playerCard__meepleWrapper_selected,
              )}
              onClick={() => canSelectMeeple && onSelectMeepleType?.('big')}
            >
              <Meeple3D
                size={48}
                color={playerColor}
                className={styles.playerCard__figurinesIcon}
              />
            </div>
          )}
          {Array.from({ length: meeplesLeft }).map((_, i) => (
            <div
              key={i}
              className={clsx(
                styles.playerCard__meepleWrapper,
                styles.playerCard__meepleWrapper_regular,
                canSelectMeeple && styles.playerCard__meepleWrapper_selectable,
                canSelectMeeple && selectedMeepleType === 'regular' && styles.playerCard__meepleWrapper_selected,
              )}
              onClick={() => canSelectMeeple && onSelectMeepleType?.('regular')}
            >
              <Meeple3D
                size={40}
                color={playerColor}
                className={styles.playerCard__figurinesIcon}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

MatchPlayerCard.displayName = 'MatchPlayerCard';
