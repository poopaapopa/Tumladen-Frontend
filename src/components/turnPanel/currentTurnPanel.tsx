import React from 'react';
import styles from './currentTurnPanel.module.scss';
import iconImg from '@/assets/icon.png';
import { TILE_IMAGES } from '@/utils/tiles.config.ts';
import type { Phase } from '@/types/match.ts';

interface CurrentTurnPanelProps {
  currentPlayerName: string;
  phase?: Phase;
  currentTileId?: string;
  remainingTiles?: number;
  currentColor: string;
}

const getActionText = (phase?: Phase) => {
  if (phase === 'place_meeple') {
    return 'ставит мипла на тайл:';
  }

  return 'ставит тайл:';
};

export const CurrentTurnPanel = ({
  currentPlayerName,
  phase,
  currentTileId,
  remainingTiles,
  currentColor,
}: CurrentTurnPanelProps) => {
  if (!currentTileId) {
    return null;
  }

  return (
    <div
      className={styles.nexTile}
      style={{ '--player-color': currentColor } as React.CSSProperties}
    >
      <div className={styles.nexTile__status}>
        <span className={styles.nexTile__nickname}>{currentPlayerName}</span>
        <span className={styles.nexTile__action}>{getActionText(phase)}</span>
      </div>

      <div className={styles.nexTile__tileWrapper}>
        <div className={styles.nexTile__tileOverlay} />
        <img src={TILE_IMAGES[currentTileId]} className={styles.nexTile__image} />
      </div>

      <div className={styles.nexTile__count}>
        <img
          src={iconImg}
          alt="Осталось тайлов"
          className={styles.nexTile__countIcon}
        />
        <span className={styles.nexTile__countSubtext}>осталось</span>
        <span className={styles.nexTile__countText}>{remainingTiles}</span>
        <span className={styles.nexTile__countSubtext}>тайлов</span>
      </div>
    </div>
  );
};
