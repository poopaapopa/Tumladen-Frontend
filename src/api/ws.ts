import { useEffect, useRef } from 'react';
import { useUserStore } from '../store/useUserStore';
import { WS_BASE_URL } from './config.ts';
import { roomService, type RoomResponse } from './room.ts';
import type { MatchStatePayload, PrivateState } from "../components/gameRoom/gameRoom.tsx";

export interface WebSocketMessage {
  type: 'room_state' | 'participant_kicked' | 'match_state' | 'match_private_state' | 'error' | 'match_finished'| 'room_deleted';
  payload: RoomResponse | ParticipantKickedPayload | MatchStatePayload | PrivateState;
}

export interface ParticipantKickedPayload {
  reason: string;
}

interface CentrifugeEnvelope {
  push?: {
    pub: {
      data: WebSocketMessage;
    };
    message?: {
      data: WebSocketMessage;
    };
  };
  id?: number;
  connect?: string;
  message?: string;
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

    const connect = async () => {
      try {
        if (!isComponentMounted.current) return;

        const { ticket } = await roomService.getWsTicket();

        const url = new URL(WS_BASE_URL); 
        url.searchParams.set('ticket', ticket);
        url.searchParams.set('cf_ws_frame_ping_pong', 'true');

        const ws = new WebSocket(url.toString());
        socket.current = ws;

        ws.onopen = () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ id: 1, connect: {} }));
            ws.send(JSON.stringify({
              send: {
                data: { 
                  type: "join_room", 
                  payload: { roomId } 
                }
              }
            }));
          }
        }

        ws.onmessage = (event) => {
          const lines = event.data.split('\n').filter((line: string) => line.trim() !== '');

          for (const line of lines) {
            try {
              const envelope: CentrifugeEnvelope = JSON.parse(line);              

              if (envelope.push?.pub?.data) {
                const data = envelope.push.pub.data;
                // console.log("WS Data:", data);

                if (data.type === 'participant_kicked' && onKicked) {
                  onKicked();
                }  else {
                  onMessageRef.current(data);
                }
              } else if (envelope.push?.message?.data) {
                const data = envelope.push.message.data;
                onMessageRef.current(data);
              }
            } catch (err) {
              console.error('WS parsing error:', err);
            }
          }
        };

        ws.onerror = (e) => console.error("WS Error Object:", e);
        ws.onclose = () => {
          // console.log(`WS: Соединение закрыто. Код: ${e.code}, Причина: ${e.reason || 'не указана'}`);
        };

      } catch (err) {
        console.error('WebSocket connection error:', err);
      }
    }

    connect();

    return () => {
      isComponentMounted.current = false;
      if (socket.current) {
        socket.current.close();
      }
    };
  }, [roomId]);

  const sendMessage = (type: string, payload: Record<string, unknown>) => {
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify({
        send: {
          data: { 
            type, 
            payload }
        }
      }));
    }
  };

  return { sendMessage };
};