import React from 'react';
import styles from './gameRoom.module.scss';
import type { SidebarPlayer } from '@/types/match';
import { MatchPlayerCard } from './matchPlayerCard/matchPlayerCard.tsx';

interface GameRoomSidebarProps {
  players: SidebarPlayer[];
  currentUserId?: string;
  ownerId?: string;
  currentTurnId?: string;
  onLeaveClick: () => void;
  /** Кол-во подданных, которые сейчас в полёте (ещё не «приземлились» в карточку) */
  pendingMeeples?: Record<string, number>;
  /** Регистрация DOM-узла карточки игрока для координат анимации полёта */
  registerPlayerCardRef?: (actorId: string, el: HTMLDivElement | null) => void;
}

export const GameRoomSidebar = ({
  players,
  currentUserId,
  ownerId,
  currentTurnId,
  onLeaveClick,
  pendingMeeples,
  registerPlayerCardRef,
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
    <div className={styles.sidebar}>
      <div className={styles.sidebar__gameInfo}>
        <div className={styles.sidebar__title}>Игроки</div>
      </div>

      <div className={styles.playersList}>
        {sortedPlayers.map((player, index) => {
          const pending = pendingMeeples?.[player.actorId] ?? 0;
          const displayedMeeples = Math.max(0, player.meeplesLeft - pending);
          return (
            <React.Fragment key={player.actorId}>
              <MatchPlayerCard
                ref={(el) => registerPlayerCardRef?.(player.actorId, el)}
                displayName={player.displayName}
                avatarUrl={player.avatarUrl}
                isRoomOwner={player.actorId === ownerId}
                isTurn={player.actorId === currentTurnId}
                score={player.score}
                meeplesLeft={displayedMeeples}
                seat={player.seat}
                actorType={player.actorType}
                botDifficulty={player.botDifficulty}
              />

              {index === 0 && <div className={styles.playersList__divider} />}
            </React.Fragment>
          );
        })}
      </div>

      <button onClick={onLeaveClick} className={styles.leftGameButton}>
        Покинуть игру
      </button>
    </div>
  );
};
