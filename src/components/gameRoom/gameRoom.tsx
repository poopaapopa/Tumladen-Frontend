import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './gameRoom.module.scss';
import sidebarstyles from '../mainPage/MainPage.module.scss'
import { useRoomSocket, type WebSocketMessage } from '../../api/ws';
import { useState, useCallback, useEffect } from 'react';
import { roomService, type RoomResponse } from '../../api/room';
import { useUserStore } from '../../store/useUserStore';
import Modal from '../modal/modal';
import gameExitImage from '../../assets/gameExit.png';
import GameBoard from "./gameBoard.tsx";
import { TILE_IMAGES } from "../../utils/tiles.config.ts";
import { getPlayerColorBySeat } from "../../utils/playerColor.ts";
import { MatchPlayerCard } from "../matchPlayerCard/matchPlayerCard.tsx";
import { ConfirmModal } from '../confirmKick/confirmKick.tsx';

interface MatchPlayer {
  actorId: string;
  displayName: string;
  score: number;
  meeplesLeft: number;
  seat: number;
}

export interface MatchStatePayload {
  id: string;
  roomId: string;
  status: string;
  gameType: string;
  isYourTurn: boolean;
  gameState: GameState;
}

interface GameState {
  currentPlayerId: string;
  players: MatchPlayer[];
  turnNumber: number;
  phase: string;
  board: Board;
}

interface Board {
  tiles: Tile[];
}

export interface Tile {
  tileId: string;
  x: number;
  y: number;
  rotation: number;
}

const GameRoom = () => {
  const { id: inviteCode } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.actor);

  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [match, setMatch] = useState<MatchStatePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isRoomDeleted, setIsRoomDeleted] = useState(false);

  const fetchInitialData = useCallback(async () => {
    if (!inviteCode) return;
    try {
      const data = await roomService.getRoomById(inviteCode);
      setRoom(data.room);

    } catch (err) {
      console.error("Ошибка:", err);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [inviteCode, navigate]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleMessage = useCallback((data: WebSocketMessage) => {
    if (data.type === 'match_state') {
      setMatch(data.payload as MatchStatePayload);
    }

    if (data.type === 'match_finished') {
      setIsRoomDeleted(true);
    }
  }, []);

  const { sendMessage } = useRoomSocket(room?.id, handleMessage);

  const handleLeftGame = () => {
    if (room?.id) {
      sendMessage('delete_room', {
        roomId: room.id
      });
      navigate('/');
    }
  };

  if (isLoading) return <div className={sidebarstyles.pageWrapper}>Загрузка...</div>;

  const currentTurnId = match?.gameState?.currentPlayerId;
  const ownerId = room?.ownerActorId;
  const currentTileId = "1";
  const players = match?.gameState?.players || [];
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.actorId === currentUser?.id) return -1;
    if (b.actorId === currentUser?.id) return 1;
    return 0;
  });
  const currentPlayer = players.find(p => p.actorId === currentTurnId);
  const currentColor = getPlayerColorBySeat(currentPlayer?.seat);

  return (
    <main className={sidebarstyles.pageWrapper}>
      <div className={sidebarstyles.sidebar}>
        <div className={sidebarstyles.sidebar__title}>Игроки</div>
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

              {index === 0 && (
                <div className={styles.playersList__divider} />
              )}
            </React.Fragment>
          ))}
        </div>

        <button onClick={() => setIsExitModalOpen(true)} className={styles.leftGameButton}>
          Покинуть игру
        </button>
      </div>

      <div className={styles.boardContainer}>
        <GameBoard
          board={match?.gameState?.board?.tiles || []}
        />
        {currentTileId && (
          <img
            src={TILE_IMAGES[currentTileId]}
            alt="Next tile"
            className={styles.nexTile}
            style={{
              ['--player-color' as string]: currentColor
            }}
          />
        )}
      </div>

      <Modal isOpen={isExitModalOpen} onClose={() => {setIsExitModalOpen(false); navigate('/')}}>
        <ConfirmModal
          title="Вы действительно хотите покинуть игру?"
          text="Игра будет завершена досрочно, а этот бесчестный поступок отразится на вашей репутации в сообществе"
          onCancel={() => setIsExitModalOpen(false)}
          onConfirm={() => {handleLeftGame(); navigate('/')}}
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
          onConfirm={() => navigate('/')}
          onConfirmText="Уйти на главную"
          image={gameExitImage}
        />
      </Modal>
    </main>
  );
};

export default GameRoom;