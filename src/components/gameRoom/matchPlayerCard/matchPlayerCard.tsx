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
}, ref) => {
  const playerColor = getPlayerColorBySeat(seat);
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
      setDisplayScore(score);
      setIsScoreAnimating(false);
      return;
    }

    const difference = score - startScore;
    const duration = Math.min(3400, Math.max(1500, difference * 270));
    const animationStart = performance.now();

    setIsScoreAnimating(true);

    const animateScore = (timestamp: number) => {
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

  const hasAvatar = Boolean(avatarUrl);

  return (
    <div
      ref={ref}
      className={clsx(
        styles.playerCard,
        isTurn ? styles.playerCard_active : styles.playerCard_dimmed
      )}
      style={{
        ['--player-color' as string]: playerColor
      }}
    >
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
          <span className={countClassName}>
            {displayScore}
            <Star size={20} strokeWidth={2.5} className={styles.playerCard__starIcon} />
          </span>
        </div>

        <div
          className={styles.playerCard__figurines}
          style={{ ['--meeple-gap' as string]: `${meeplesLeft + bigMeeplesLeft > 7 ? -8 : -3}px` }}
        >
          {bigMeeplesLeft > 0 && (
            <div
              className={clsx(
                styles.playerCard__meepleWrapper,
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
