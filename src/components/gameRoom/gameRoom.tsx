import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './gameRoom.module.scss';
import sidebarstyles from '../mainPage/MainPage.module.scss';
import { useRoomSocket } from '@/api/ws';
import type { WebSocketMessage } from '@/types/ws';
import {
  type MatchStatePayload,
  type PrivateState,
} from '@/types/match';
import type { RoomResponse } from '@/types/room';
import { roomService } from '@/api/room';
import { useUserStore } from '@/store/useUserStore';
import { getPlayerColorBySeat } from '@/utils/playerColor.ts';
import Modal from '../modal/modal';
import gameExitImage from '@/assets/gameExit.png';
import GameBoard from './gameBoard.tsx';
import { ConfirmModal } from '../confirmKick/confirmKick.tsx';
import { GameRoomSidebar } from './gameRoomSidebar.tsx';
import { CurrentTurnPanel } from '../turnPanel/currentTurnPanel.tsx';
import { GameActionLog } from '../latestActions/gameActionLog.tsx';
import { useMatchActionLog } from './hooks/useMatchActionLog.ts';
import { useTurnTimer } from './hooks/useTurnTimer.ts';

export type { Tile, MatchStatePayload, PrivateState } from '../../types/match';

const GameRoom = () => {
  const { id: inviteCode } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.actor);

  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [match, setMatch] = useState<MatchStatePayload | null>(null);
  const matchRef = useRef<MatchStatePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isRoomDeleted, setIsRoomDeleted] = useState(false);
  const [privateState, setPrivateState] = useState<PrivateState | null>(null);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [pendingPlacement, setPendingPlacement] = useState<{ x: number; y: number; rotation: number } | null>(null);

  const { actionLog, addToLog, clearLog } = useMatchActionLog(inviteCode);
  const { timeLeft, setTurnDeadline } = useTurnTimer(match?.status === 'active');

  const fetchInitialData = useCallback(async () => {
    if (!inviteCode) return;
    try {
      const data = await roomService.getRoomById(inviteCode);
      setRoom(data.room);
    } catch (err) {
      console.error('Ошибка:', err);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [inviteCode, navigate]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const sendMessageRef = useRef<ReturnType<typeof useRoomSocket>['sendMessage'] | null>(null);

  const handleMessage = useCallback((data: WebSocketMessage) => {
    if (data.type === 'match_state') {
      const newMatch = data.payload;
      const prevTurnNumber = matchRef.current?.gameState?.turnNumber;
      const newTurnNumber = newMatch.gameState?.turnNumber;
      const isTurnChanged = prevTurnNumber !== newTurnNumber;
      const prevMatch = matchRef.current;

      if (prevMatch) {
        const prevGs = prevMatch.gameState;
        const nextGs = newMatch.gameState;

        if (prevGs.phase === 'place_tile' && nextGs.phase === 'place_meeple') {
          const placedTileId = prevGs.currentTurn?.drawnTile?.tileId;
          addToLog('поставил тайл', prevGs.currentPlayerId, prevGs.players, placedTileId);
        }

        if (nextGs.meeples.length > prevGs.meeples.length) {
          addToLog('поставил мипла на тайл', prevGs.currentPlayerId, prevGs.players);
        }

        if (nextGs.turnNumber > prevGs.turnNumber && nextGs.meeples.length === prevGs.meeples.length) {
          addToLog('решил не ставить мипла', prevGs.currentPlayerId, nextGs.players);
        }
      }

      setTurnDeadline(newMatch.gameState?.currentTurn?.turnEndsAt);
      setMatch(newMatch);
      matchRef.current = newMatch;

      if (isTurnChanged) {
        setCurrentRotation(0);
        setPendingPlacement(null);
      }
    }

    if (data.type === 'match_private_state') {
      const privatePayload = data.payload;
      setPrivateState(privatePayload);

      if (
        privatePayload.phase === 'place_meeple' &&
        privatePayload.isYourTurn &&
        privatePayload.validMeeplePlacements.length === 0
      ) {
        const currentRoom = matchRef.current;
        if (currentRoom?.roomId) {
          sendMessageRef.current?.('match_action', {
            roomId: currentRoom.roomId,
            action: 'skip_meeple',
            payload: { roomId: currentRoom.roomId },
          });
        }
      }
    }

    if (data.type === 'match_finished') {
      clearLog();
      setIsRoomDeleted(true);
    }
  }, [addToLog, clearLog, setTurnDeadline]);

  const { sendMessage } = useRoomSocket(room?.id, handleMessage);

  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  const handlePlaceTile = (x: number, y: number) => {
    if (!room?.id) return;

    const placement = privateState?.validPlacements.find((p) => p.x === x && p.y === y);
    if (!placement) return;

    const rotation = placement.rotations.includes(currentRotation)
      ? currentRotation
      : placement.rotations[0];

    setPendingPlacement({ x, y, rotation });
  };

  const handleRotateTile = (x: number, y: number, rotations: number[]) => {
    if (!pendingPlacement) return;
    const currentIdx = rotations.indexOf(pendingPlacement.rotation);
    const nextRotation = rotations[(currentIdx + 1) % rotations.length];
    setPendingPlacement({ x, y, rotation: nextRotation });
  };

  const handleConfirmPlaceTile = () => {
    if (!room?.id || !pendingPlacement) return;

    sendMessage('match_action', {
      roomId: room.id,
      action: 'place_tile',
      payload: {
        roomId: room.id,
        x: pendingPlacement.x,
        y: pendingPlacement.y,
        rotation: pendingPlacement.rotation,
      },
    });
  };

  const handlePlaceMeeple = (zoneId: string) => {
    if (!room?.id) return;
    sendMessage('match_action', {
      roomId: room.id,
      action: 'place_meeple',
      payload: {
        roomId: room.id,
        zoneId,
      },
    });
  };

  const handleSkipMeeple = () => {
    if (!room?.id) return;
    sendMessage('match_action', {
      roomId: room.id,
      action: 'skip_meeple',
      payload: { roomId: room.id },
    });
  };

  const handleLeftGame = () => {
    if (room?.inviteCode) {
      clearLog();
      sendMessage('leave_match', {
        roomId: room.id,
      });
      navigate(`/room/${room.inviteCode}`);
    }
  };

  const gameState = match?.gameState;
  const currentTurnId = gameState?.currentPlayerId;
  const phase = gameState?.phase;

  if (isLoading) return <div className={sidebarstyles.pageWrapper}>Загрузка...</div>;

  const ownerId = room?.ownerActorId;
  const players = match?.gameState?.players || [];
  const drawnTile = gameState?.currentTurn?.drawnTile;
  const remainingTiles = gameState?.deck?.remainingCount;
  const currentTileId = drawnTile?.tileId || '1';

  const currentPlayer = players.find((player) => player.actorId === currentTurnId);
  const currentColor = getPlayerColorBySeat(currentPlayer?.seat);

  const lastPlacedTile = gameState?.currentTurn?.placedTile;

  return (
    <main className={sidebarstyles.pageWrapper}>
      <GameRoomSidebar
        players={players}
        currentUserId={currentUser?.id}
        ownerId={ownerId}
        currentTurnId={currentTurnId}
        timeLeft={timeLeft}
        onLeaveClick={() => setIsExitModalOpen(true)}
      />

      <div className={styles.boardContainer}>
        <GameBoard
          board={gameState?.board?.tiles || []}
          validPlacements={privateState?.validPlacements || []}
          onPlaceTile={handlePlaceTile}
          onRotateTile={handleRotateTile}
          currentTileId={currentTileId}
          phase={phase}
          validMeeplePlacements={privateState?.validMeeplePlacements || []}
          onPlaceMeeple={handlePlaceMeeple}
          lastPlacedTile={lastPlacedTile}
          currentPlayerColor={currentColor}
          players={players}
          placedMeeples={gameState?.meeples || []}
          pendingPlacement={pendingPlacement}
        />

        <CurrentTurnPanel
          currentPlayerName={currentPlayer?.displayName || 'Ожидание...'}
          phase={phase}
          currentTileId={currentTileId}
          remainingTiles={remainingTiles}
          currentColor={currentColor}
        />

        {phase === 'place_meeple' && privateState?.isYourTurn && (
          <button className={styles.skipButton} onClick={handleSkipMeeple}>
            Не ставить мипла
          </button>
        )}

        {phase === 'place_tile' && privateState?.isYourTurn && pendingPlacement !== null && (
          <button
            className={styles.skipButton}
            onClick={handleConfirmPlaceTile}
          >
            Поставить тайл
          </button>
        )}

        <GameActionLog entries={actionLog} />
      </div>

      <Modal isOpen={isExitModalOpen} onClose={() => setIsExitModalOpen(false)}>
        <ConfirmModal
          title="Вы действительно хотите покинуть игру?"
          text="Игра будет завершена досрочно, а этот бесчестный поступок отразится на вашей репутации в сообществе"
          onCancel={() => setIsExitModalOpen(false)}
          onConfirm={() => handleLeftGame()}
          onConfirmText="Да, выйти"
          onCancelText="Остаться"
          image={gameExitImage}
        />
      </Modal>

      <Modal isOpen={isRoomDeleted} onClose={() => navigate('/')}>
        <ConfirmModal
          title="Игра была завершена досрочно"
          text="К превеликому сожалению, один из нас решил с позором покинуть игру.
            В сообществе пойдёт молва о его трусливом дезертирстве."
          onConfirm={() => { room?.inviteCode ? navigate(`/room/${room.inviteCode}`) : navigate('/'); }}
          onConfirmText="Вернуться в комнату"
          image={gameExitImage}
        />
      </Modal>
    </main>
  );
};

export default GameRoom;
