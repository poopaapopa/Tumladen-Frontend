import { useEffect, useRef } from 'react';
import { useUserStore } from '../store/useUserStore';
import { WS_BASE_URL } from './config.ts';
import type { RoomResponse } from './room.ts';
import type { MatchStatePayload } from "../components/gameRoom/gameRoom.tsx";

export interface WebSocketMessage {
  type: 'room_state' | 'participant_kicked' | 'match_state' | 'error';
  payload: RoomResponse | ParticipantKickedPayload | MatchStatePayload;
}

export interface ParticipantKickedPayload {
  reason: string;
}

export const useRoomSocket = (
  roomId: string | undefined,
  onMessage: (data: WebSocketMessage) => void,
  onKicked?: () => void
) => {
  const socket = useRef<WebSocket | null>(null);
  const token = useUserStore((state) => state.token);
  const isComponentMounted = useRef(true);

  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!roomId || !token) return;

    const wsUrl = `${WS_BASE_URL}?token=${token}`;
    const ws = new WebSocket(wsUrl);
    socket.current = ws;

    ws.onopen = () => {
      if (isComponentMounted.current && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "join_room", payload: { roomId } }));
      }
    }

    ws.onmessage = (event) => {
      if (!isComponentMounted.current) return;

      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        console.log(data);

        if (data.type === 'room_state' || data.type === 'match_state') {
          onMessageRef.current(data);
        }

        if (data.type === 'participant_kicked' && onKicked) {
          onKicked();
        }
      } catch (err) {
        console.error('WS parsing error:', err);
      }
    };

    ws.onerror = (error) => {
      if (isComponentMounted.current)
        console.error('WS Error:', error);
    };

    ws.onclose = () => {
      console.log('WS Disconnected');
    };

    return () => {
      isComponentMounted.current = false;

      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;

      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [roomId, token]);

  const sendMessage = (type: string, payload: Record<string, unknown>) => {
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify({ type, payload }));
    }
  };

  return { sendMessage };
};