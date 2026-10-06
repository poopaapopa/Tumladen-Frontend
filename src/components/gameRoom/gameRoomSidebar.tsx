import React from 'react';
import styles from './gameRoom.module.scss';
import type { MeepleType, SidebarPlayer } from '@/types/match';
import { MatchPlayerCard } from './matchPlayerCard/matchPlayerCard.tsx';

export type GameRoomSidebarMode = 'playing' | 'ranking';

interface GameRoomSidebarProps {
  players: SidebarPlayer[];
  currentUserId?: string;
  ownerId?: string;
  currentTurnId?: string;
  onLeaveClick: () => void;
  /** Подданные, которые ещё показаны на поле либо летят к карточке игрока. */
  pendingMeeples?: Record<string, { regular: number; big: number }>;
  /** Регистрация DOM-узла карточки игрока для координат анимации полёта */
  registerPlayerCardRef?: (actorId: string, el: HTMLDivElement | null) => void;
  isMeeplePlacementPhase?: boolean;
  selectedMeepleType?: MeepleType;
  onSelectMeepleType?: (type: MeepleType) => void;
  /** В режиме ranking карточки сортируются по счёту, а не закрепляют текущего игрока сверху. */
  mode?: GameRoomSidebarMode;
  /** Промежуточный счёт, который уже должен быть виден в живом рейтинге. */
  rankingScores?: Record<string, number>;
  /** Счёт для порядка карточек: обновляется после завершения текущего события. */
  rankingOrderScores?: Record<string, number>;
  /** Текст нижней кнопки; расположение и обработчик остаются прежними. */
  leaveButtonText?: string;
}

export const GameRoomSidebar = ({
  players,
  currentUserId,
  ownerId,
  currentTurnId,
  onLeaveClick,
  pendingMeeples,
  registerPlayerCardRef,
  isMeeplePlacementPhase,
  selectedMeepleType,
  onSelectMeepleType,
  mode = 'playing',
  rankingScores,
  rankingOrderScores,
  leaveButtonText = 'Покинуть игру',
}: GameRoomSidebarProps) => {
  const isRanking = mode === 'ranking';
  const scoreFor = (player: SidebarPlayer) => (
    rankingScores?.[player.actorId] ?? player.score
  );
  const orderScoreFor = (player: SidebarPlayer) => (
    rankingOrderScores?.[player.actorId] ?? scoreFor(player)
  );
  const sortedPlayers = [...players].sort((a, b) => {
    if (isRanking) {
      return orderScoreFor(b) - orderScoreFor(a) || a.seat - b.seat;
    }

    if (a.actorId === currentUserId && b.actorId !== currentUserId) return -1;
    if (b.actorId === currentUserId && a.actorId !== currentUserId) return 1;

    return 0;
  });

  const ranksByActor = new Map<string, number>();
  if (isRanking) {
    let previousScore: number | undefined;
    let previousRank = 0;

    sortedPlayers.forEach((player, index) => {
      const score = orderScoreFor(player);
      const rank = previousScore === score ? previousRank : index + 1;
      ranksByActor.set(player.actorId, rank);
      previousScore = score;
      previousRank = rank;
    });
  }

  const title = isRanking ? 'Итоговый рейтинг' : 'Игроки';

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebar__gameInfo}>
        <div className={styles.sidebar__title}>{title}</div>
      </div>

      <div className={styles.playersList}>
        {sortedPlayers.map((player, index) => {
          const pending = pendingMeeples?.[player.actorId]
            ?? { regular: 0, big: 0 };
          const displayedMeeples = Math.max(
            0,
            player.meeplesLeft - pending.regular,
          );
          const displayedBigMeeples = Math.max(
            0,
            (player.bigMeeplesLeft ?? 0) - pending.big,
          );
          return (
            <React.Fragment key={player.actorId}>
              <MatchPlayerCard
                ref={(el) => registerPlayerCardRef?.(player.actorId, el)}
                displayName={player.displayName}
                avatarUrl={player.avatarUrl}
                isRoomOwner={!isRanking && player.actorId === ownerId}
                isTurn={!isRanking && player.actorId === currentTurnId}
                score={scoreFor(player)}
                meeplesLeft={displayedMeeples}
                bigMeeplesLeft={displayedBigMeeples}
                seat={player.seat}
                actorType={player.actorType}
                botDifficulty={player.botDifficulty}
                mode={mode}
                rank={ranksByActor.get(player.actorId)}
                isCurrentUser={player.actorId === currentUserId}
                canSelectMeeple={
                  !isRanking &&
                  isMeeplePlacementPhase &&
                  player.actorId === currentUserId &&
                  player.actorId === currentTurnId &&
                  displayedBigMeeples > 0
                }
                selectedMeepleType={selectedMeepleType}
                onSelectMeepleType={onSelectMeepleType}
              />

              {!isRanking && index === 0 && (
                <div className={styles.playersList__divider} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <button onClick={onLeaveClick} className={styles.leftGameButton}>
        {leaveButtonText}
      </button>
    </div>
  );
};
