import React from 'react';
import { AlarmClock } from 'lucide-react';
import sidebarstyles from '../mainPage/MainPage.module.scss';
import styles from './gameRoom.module.scss';
import type { MatchPlayer } from '@/types/match';
import { MatchPlayerCard } from '../matchPlayerCard/matchPlayerCard.tsx';

interface GameRoomSidebarProps {
  players: MatchPlayer[];
  currentUserId?: string;
  ownerId?: string;
  currentTurnId?: string;
  timeLeft: number | null;
  onLeaveClick: () => void;
}

export const GameRoomSidebar = ({
  players,
  currentUserId,
  ownerId,
  currentTurnId,
  timeLeft,
  onLeaveClick,
}: GameRoomSidebarProps) => {
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.actorId === currentUserId) {
      return -1;
    }

    if (b.actorId === currentUserId) {
      return 1;
    }

    return 0;
  });

  return (
    <div className={sidebarstyles.sidebar}>
      <div className={sidebarstyles.sidebar__gameInfo}>
        <div className={sidebarstyles.sidebar__title}>Игроки</div>
        {timeLeft !== null && (
          <div className={sidebarstyles.sidebar__timer}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            <AlarmClock className={sidebarstyles.sidebar__timerIcon} />
          </div>
        )}
      </div>

      <div className={styles.playersList}>
        {sortedPlayers.map((player, index) => (
          <React.Fragment key={player.actorId}>
            <MatchPlayerCard
              displayName={player.displayName}
              isRoomOwner={player.actorId === ownerId}
              isTurn={player.actorId === currentTurnId}
              score={player.score}
              meeplesLeft={player.meeplesLeft}
              seat={player.seat}
            />

            {index === 0 && <div className={styles.playersList__divider} />}
          </React.Fragment>
        ))}
      </div>

      <button onClick={onLeaveClick} className={styles.leftGameButton}>
        Покинуть игру
      </button>
    </div>
  );
};
