import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import styles from './roomPage.module.scss';
import castleImg from '../../assets/zamok.png';
import { roomService, type RoomResponse, type UpdateRoomSettingsPayload } from '../../api/room.ts'
import { useUserStore } from '../../store/useUserStore';
import { useRoomSocket, type WebSocketMessage } from '../../api/ws.ts';

import { RoomSidebar } from "../roomSidebar/roomSidebar.tsx";
import { RoomPageSkeleton } from "./roomPageSkeleton.tsx";
import { RoomPlayers } from '../roomPlayers/roomPlayers.tsx';

const RoomPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const currentUser = useUserStore((state) => state.actor);

  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isKicked, setIsKicked] = useState(false);
  const [isRoomDeleted, setIsRoomDeleted] = useState(false);

  const checkAvailableSlots = useCallback((roomData: RoomResponse) => {
    if (!currentUser) return false;

    const isAlreadyInRoom = roomData.participants?.some(p => p.actorId === currentUser.id);

    return !isAlreadyInRoom && roomData.playersCount >= roomData.maxPlayers;
  }, [currentUser]);

  const fetchRoomData = useCallback(async () => {
    if (!id) return;
    try {
      const data = await roomService.getRoomById(id);

      if (checkAvailableSlots(data.room)) {
        navigate('/');
        return;
      }

      setRoom(data.room);
      setError(null);
    } catch (e) {
      setError("Не удалось войти в чертоги комнаты...");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate, checkAvailableSlots]);

  const handleRoomUpdate = useCallback((data: WebSocketMessage) => {
    if (data.type === 'room_state') {
      const updatedRoom = data.payload as RoomResponse;
      if (checkAvailableSlots(updatedRoom)) {
        navigate('/');
        return;
      }
      setRoom(updatedRoom);
    }

    if (data.type === 'room_deleted') {
      setIsRoomDeleted(true);
    }
  }, [checkAvailableSlots, navigate]);

  const handleKicked = useCallback(() => {
    setIsKicked(true);
  }, []);

  const { sendMessage } = useRoomSocket(room?.id, handleRoomUpdate, handleKicked);

  const handleSaveSetting = (key: string, newValue: number | string | boolean) => {
    if (!room || !isOwner) return;

    const currentSettings = (room.settings as unknown as Record<string, number | string | boolean>) || {};

    let hasChanged: boolean;

    if (key === 'name')
      hasChanged = room.name !== String(newValue);
    else if (key === 'maxPlayers')
      hasChanged = room.maxPlayers !== Number(newValue);
    else
      hasChanged = currentSettings[key] !== newValue;

    if (!hasChanged) return;

    const payload: UpdateRoomSettingsPayload = {
      roomId: room.id,
      gameType: room.gameType,
      name: key === 'name' ? String(newValue) : room.name,
      maxPlayers: key === 'maxPlayers' ? Number(newValue) : room.maxPlayers,
      settings: (key !== 'name' && key !== 'maxPlayers')
        ? { ...currentSettings, [key]: newValue }
        : currentSettings
    };

    sendMessage('update_room_settings', payload as unknown as Record<string, unknown>);
  };

  useEffect(() => {
    fetchRoomData();
  }, [fetchRoomData]);

  useEffect(() => {
    if (room?.status === 'playing') {
      navigate(`/room/game/${id}`);
    }
  }, [room?.status, navigate, id]);

  if (isLoading) return <RoomPageSkeleton />;
  if (error || !room) return <div className={styles.error}>{error || "Комната исчезла"}</div>;

  const isOwner = currentUser?.id === room.ownerActorId;

  return (
    <div className={styles.roomPage}>
      <RoomSidebar
        room={room}
        isOwner={isOwner}
        isRoomDeleted={isRoomDeleted}
        onSaveSetting={handleSaveSetting}
        sendMessage={sendMessage}
      />

      <main className={styles.roomPage__main}>
        <div className={styles.roomPage__visual}>
          <img src={castleImg} alt="Game Art" className={styles.roomPage__image} />
          <div className={styles.roomPage__overlay} />
        </div>
        <h1 className={styles.roomPage__gameTitle}>{room.gameType}</h1>
        <div className={styles.roomPage__rules}>Правила игры...</div>
      </main>

      <RoomPlayers
        room={room}
        isOwner={currentUser?.id === room.ownerActorId}
        sendMessage={sendMessage}
        isKicked={isKicked}
      />
    </div>
  );
};

export default RoomPage;