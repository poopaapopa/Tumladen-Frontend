import React from 'react';
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
          <span className={styles.playerCard__count}>
            {score}
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