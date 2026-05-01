import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Star, Crown } from "lucide-react";
import clsx from 'clsx';
import styles from './matchPlayerCard.module.scss';
import castleImage from '../../assets/castle.png';
import { getPlayerColorBySeat } from "../../utils/playerColor.ts";
import { Meeple3D } from "./meeple.tsx";

interface MatchPlayerCardProps {
  displayName: string;
  isRoomOwner: boolean;
  isTurn: boolean;
  score: number;
  meeplesLeft: number;
  seat: number;
}

export const MatchPlayerCard: React.FC<MatchPlayerCardProps> = ({
  displayName,
  isRoomOwner,
  isTurn,
  score,
  meeplesLeft,
  seat
}) => {
  const playerColor = getPlayerColorBySeat(seat);
  const [displayScore, setDisplayScore] = useState(score);
  const [isScoreAnimating, setIsScoreAnimating] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const animationTimeoutRef = useRef<number | null>(null);
  const displayedScoreRef = useRef(score);

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

  return (
    <div
      className={clsx(
        styles.playerCard,
        isTurn ? styles.playerCard_active : styles.playerCard_dimmed
      )}
      style={{
        ['--player-color' as string]: playerColor
      }}
    >
      <img src={castleImage} alt="Avatar" className={styles.playerCard__image} />

      <div className={styles.playerCard__body}>
        <div className={styles.playerCard__header}>
          <div className={styles.playerCard__nickname}>
            {displayName}
            {isRoomOwner && <Crown size={18} className={styles.playerCard__crown} />}
          </div>
          <span className={countClassName}>
            {displayScore}
            <Star size={20} strokeWidth={2.5} className={styles.playerCard__figurinesIcon} />
          </span>
        </div>

        <div className={styles.playerCard__figurines}>
          {Array.from({ length: meeplesLeft }).map((_, i) => (
            <Meeple3D
              key={i}
              size={40}
              color={playerColor}
              className={styles.playerCard__figurinesIcon}
            />
          ))}
        </div>
      </div>
    </div>
  );
};