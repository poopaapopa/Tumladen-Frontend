import { useEffect, useRef } from 'react';
import { useUserStore } from '../store/useUserStore';
import { WS_BASE_URL } from './config.ts';
import { roomService, type RoomResponse } from './room.ts';
import type { MatchStatePayload } from "../components/gameRoom/gameRoom.tsx";

export interface WebSocketMessage {
  type: 'room_state' | 'participant_kicked' | 'match_state' | 'error' | 'match_finished'| 'room_deleted';
  payload: RoomResponse | ParticipantKickedPayload | MatchStatePayload;
}

export interface ParticipantKickedPayload {
  reason: string;
}

interface CentrifugeEnvelope {
  push?: {
    pub?: {
      data: WebSocketMessage;
    };
    message?: {
      data: WebSocketMessage;
    };
  };
  id?: number;
  connect?: string;
}

const HEARTBEAT_INTERVAL_MS = 30_000;
const RECONNECT_BASE_DELAY_MS = 1_000;
const RECONNECT_MAX_DELAY_MS = 30_000;
const RECONNECT_MAX_ATTEMPTS = 10;

export const useRoomSocket = (
  roomId: string | undefined,
  onMessage: (data: WebSocketMessage) => void,
  onKicked?: () => void
) => {
  const socket = useRef<WebSocket | null>(null);
  const token = useUserStore((state) => state.token);
  const isComponentMounted = useRef(true);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const onKickedRef = useRef(onKicked);
  useEffect(() => {
    onKickedRef.current = onKicked;
  }, [onKicked]);

  useEffect(() => {
    if (!roomId || !token) return;

    // Fix: reset the flag at the start of each effect run,
    // not just on initial mount — prevents blocking reconnects
    // after RoomPage → GameRoom navigation.
    isComponentMounted.current = true;
    reconnectAttempt.current = 0;

    const clearHeartbeat = () => {
      if (heartbeatTimer.current !== null) {
        clearInterval(heartbeatTimer.current);
        heartbeatTimer.current = null;
      }
    };

    const clearReconnectTimer = () => {
      if (reconnectTimer.current !== null) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };

    const connect = async () => {
      if (!isComponentMounted.current) return;

      try {
        const { ticket } = await roomService.getWsTicket();

        if (!isComponentMounted.current) return;

        const url = new URL(WS_BASE_URL);
        url.searchParams.set('ticket', ticket);

        const ws = new WebSocket(url.toString());
        socket.current = ws;

        ws.onopen = () => {
          if (ws.readyState !== WebSocket.OPEN) return;

          reconnectAttempt.current = 0;

          ws.send(JSON.stringify({ id: 1, connect: {} }));
          ws.send(JSON.stringify({
            send: {
              data: {
                type: "join_room",
                payload: { roomId }
              }
            }
          }));

          // Heartbeat: send a ping every 30s to keep the connection
          // alive through proxies/nginx that close idle connections.
          clearHeartbeat();
          heartbeatTimer.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ ping: {} }));
            }
          }, HEARTBEAT_INTERVAL_MS);
        };

        ws.onmessage = (event) => {
          const lines = event.data.split('\n').filter((line: string) => line.trim() !== '');

          for (const line of lines) {
            try {
              const envelope: CentrifugeEnvelope = JSON.parse(line);

              if (envelope.push?.pub?.data) {
                const data = envelope.push.pub.data;

                if (data.type === 'participant_kicked' && onKickedRef.current) {
                  onKickedRef.current();
                } else {
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
          clearHeartbeat();

          // Reconnect only if the component is still mounted and
          // we haven't exceeded the maximum number of attempts.
          if (
            !isComponentMounted.current ||
            reconnectAttempt.current >= RECONNECT_MAX_ATTEMPTS
          ) return;

          const delay = Math.min(
            RECONNECT_BASE_DELAY_MS * 2 ** reconnectAttempt.current,
            RECONNECT_MAX_DELAY_MS
          );
          reconnectAttempt.current += 1;

          reconnectTimer.current = setTimeout(connect, delay);
        };

      } catch (err) {
        console.error('WebSocket connection error:', err);

        if (!isComponentMounted.current) return;

        const delay = Math.min(
          RECONNECT_BASE_DELAY_MS * 2 ** reconnectAttempt.current,
          RECONNECT_MAX_DELAY_MS
        );
        reconnectAttempt.current += 1;
        reconnectTimer.current = setTimeout(connect, delay);
      }
    };

    connect();

    return () => {
      isComponentMounted.current = false;
      clearHeartbeat();
      clearReconnectTimer();
      if (socket.current) {
        socket.current.close();
        socket.current = null;
      }
    };
    // token is intentionally included: if the token changes a new
    // WS ticket must be obtained, so we reconnect from scratch.
  }, [roomId, token]);

  const sendMessage = (type: string, payload: Record<string, unknown>) => {
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify({
        send: {
          data: {
            type,
            payload
          }
        }
      }));
    }
  };

  return { sendMessage };
};
