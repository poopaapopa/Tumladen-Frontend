import { useEffect, useRef } from 'react';
import { useUserStore } from '../store/useUserStore';
import { WS_BASE_URL } from './config.ts';
import type { RoomResponse } from './room.ts';

interface WebSocketMessage {
  type: 'room_state' | 'participant_kicked';
  payload: RoomResponse | ParticipantKickedPayload;
}

export interface ParticipantKickedPayload {
  reason: string;
}

export const useRoomSocket = (
  roomId: string | undefined,
  onMessage: (data: RoomResponse) => void,
  onKicked: () => void
) => {
  const socket = useRef<WebSocket | null>(null);
  const token = useUserStore((state) => state.token);

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
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "join_room", payload: { roomId } }));
      }
    }

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        console.log(data);
        
        if (data.type === 'room_state') {
          onMessageRef.current(data.payload as RoomResponse);
        }

        if (data.type === 'participant_kicked') {
          onKicked();
        }
      } catch (err) {
        console.error('WS parsing error:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WS Error:', error);
    };

    ws.onclose = () => {
      console.log('WS Disconnected');
    };

    return () => {
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