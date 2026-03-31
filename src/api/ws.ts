import { useEffect, useRef } from 'react';
import { useUserStore } from '../store/useUserStore';
import { WS_BASE_URL } from '../api/config';
import type { RoomResponse } from '../api/room';

interface WebSocketMessage {
  type: 'room_state';
  payload: RoomResponse;
}

export const useRoomSocket = (roomId: string | undefined, onMessage: (data: RoomResponse) => void) => {
  const socket = useRef<WebSocket | null>(null);
  const token = useUserStore((state) => state.token);

  useEffect(() => {
    if (!roomId || !token) return;

    const wsUrl = `${WS_BASE_URL}?token=${token}`;
    const ws = new WebSocket(wsUrl);
    socket.current = ws;

    ws.onopen = () => {
      const connectMessage = {
        type: "join_room",
        payload: {
          roomId: roomId
        }
      };
      ws.send(JSON.stringify(connectMessage));
    }

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        
        if (data.type === 'room_state') {
          onMessage(data.payload);
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
      ws?.close();
    };
  }, [roomId, token, onMessage]);

  const sendMessage = (type: string, payload: Record<string, unknown>) => {
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify({ type, payload }));
    }
  };

  return { sendMessage };
};