import { useCallback, useEffect, useRef, useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { WS_BASE_URL } from './config.ts';
import { roomService, UnauthorizedError } from './room.ts';
import type { WebSocketMessage } from '../types/ws';
export type { WebSocketMessage, ParticipantKickedPayload } from '@/types/ws';

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
  connect?: Record<string, unknown>;
  error?: unknown;
}

const RECONNECT_BASE_DELAY_MS = 1_000;
const RECONNECT_MAX_DELAY_MS = 30_000;
const RECONNECT_BACKOFF_STEPS = 5;
const CONNECT_HANDSHAKE_TIMEOUT_MS = 10_000;

export type RoomSocketStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected';

export const useRoomSocket = (
  roomId: string | undefined,
  onMessage: (data: WebSocketMessage) => void,
  onKicked?: () => void,
  onDisconnected?: () => void,
) => {
  const socket = useRef<WebSocket | null>(null);
  const isProtocolConnected = useRef(false);
  const token = useUserStore((state) => state.token);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handshakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasConnectedOnce = useRef(false);
  const connectionTarget = useRef<{ roomId?: string; token?: string }>({});
  const [connectionStatus, setConnectionStatus] = useState<RoomSocketStatus>('idle');
  const [connectionGeneration, setConnectionGeneration] = useState(0);

  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const onKickedRef = useRef(onKicked);
  useEffect(() => {
    onKickedRef.current = onKicked;
  }, [onKicked]);

  const onDisconnectedRef = useRef(onDisconnected);
  useEffect(() => {
    onDisconnectedRef.current = onDisconnected;
  }, [onDisconnected]);

  useEffect(() => {
    if (!roomId || !token) {
      isProtocolConnected.current = false;
      hasConnectedOnce.current = false;
      connectionTarget.current = {};
      return;
    }

    if (
      connectionTarget.current.roomId !== roomId
      || connectionTarget.current.token !== token
    ) {
      connectionTarget.current = { roomId, token };
      hasConnectedOnce.current = false;
    }

    let cancelled = false;
    let connectionInFlight = false;
    reconnectAttempt.current = 0;
    isProtocolConnected.current = false;

    const clearReconnectTimer = () => {
      if (reconnectTimer.current !== null) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };

    const clearHandshakeTimer = () => {
      if (handshakeTimer.current !== null) {
        clearTimeout(handshakeTimer.current);
        handshakeTimer.current = null;
      }
    };

    const connect = async () => {
      if (
        cancelled
        || connectionInFlight
        || socket.current?.readyState === WebSocket.OPEN
        || socket.current?.readyState === WebSocket.CONNECTING
      ) return;

      connectionInFlight = true;
      try {
        clearReconnectTimer();
        setConnectionStatus(
          hasConnectedOnce.current || reconnectAttempt.current > 0
            ? 'reconnecting'
            : 'connecting',
        );
        const { ticket } = await roomService.getWsTicket();
        if (cancelled) return;

        const url = new URL(WS_BASE_URL);
        url.searchParams.set('ticket', ticket);
        url.searchParams.set('cf_ws_frame_ping_pong', 'true');

        const ws = new WebSocket(url.toString());
        socket.current = ws;
        clearHandshakeTimer();
        handshakeTimer.current = setTimeout(() => {
          if (
            !cancelled
            && socket.current === ws
            && !isProtocolConnected.current
          ) ws.close();
        }, CONNECT_HANDSHAKE_TIMEOUT_MS);

        ws.onopen = () => {
          if (cancelled || socket.current !== ws) {
            ws.close();
            return;
          }
          if (ws.readyState !== WebSocket.OPEN) return;

          ws.send(JSON.stringify({ id: 1, connect: {} }));
        };

        ws.onmessage = (event) => {
          if (cancelled || socket.current !== ws) return;
          const lines = event.data.split('\n').filter((line: string) => line.trim() !== '');

          for (const line of lines) {
            try {
              const envelope: CentrifugeEnvelope = JSON.parse(line);

              if (envelope.id === 1 && envelope.connect) {
                clearHandshakeTimer();
                isProtocolConnected.current = true;
                hasConnectedOnce.current = true;
                reconnectAttempt.current = 0;
                setConnectionStatus('connected');
                ws.send(JSON.stringify({
                  send: {
                    data: {
                      type: 'join_room',
                      payload: { roomId },
                    },
                  },
                }));
              } else if (envelope.id === 1 && envelope.error) {
                ws.close();
              } else if (envelope.push?.pub?.data) {
                const data = envelope.push.pub.data;

                if (data.type === 'participant_kicked' && onKickedRef.current) {
                  onKickedRef.current();
                } else {
                  onMessageRef.current(data);
                }
              } else if (envelope.push?.message?.data) {
                const data = envelope.push.message.data;
                console.log('WS message:', data);
                onMessageRef.current(data);
              }
            } catch (err) {
              console.error('WS parsing error:', err);
            }
          }
        };

        ws.onerror = (e) => console.error("WS Error Object:", e);

        ws.onclose = () => {
          if (cancelled || socket.current !== ws) return;

          clearHandshakeTimer();
          isProtocolConnected.current = false;
          socket.current = null;

          onDisconnectedRef.current?.();

          setConnectionStatus('reconnecting');

          const delay = Math.min(
            RECONNECT_BASE_DELAY_MS * 2 ** Math.min(
              reconnectAttempt.current,
              RECONNECT_BACKOFF_STEPS,
            ),
            RECONNECT_MAX_DELAY_MS
          );
          reconnectAttempt.current += 1;

          reconnectTimer.current = setTimeout(connect, delay);
        };

      } catch (err) {
        if (cancelled) return;
        console.error('WebSocket connection error:', err);

        if (err instanceof UnauthorizedError) {
          setConnectionStatus('disconnected');
          return;
        }

        setConnectionStatus('reconnecting');

        const delay = Math.min(
          RECONNECT_BASE_DELAY_MS * 2 ** Math.min(
            reconnectAttempt.current,
            RECONNECT_BACKOFF_STEPS,
          ),
          RECONNECT_MAX_DELAY_MS
        );
        reconnectAttempt.current += 1;
        reconnectTimer.current = setTimeout(connect, delay);
      } finally {
        connectionInFlight = false;
      }
    };

    const reconnectWhenOnline = () => {
      if (
        cancelled
        || socket.current?.readyState === WebSocket.OPEN
        || socket.current?.readyState === WebSocket.CONNECTING
      ) return;
      clearReconnectTimer();
      void connect();
    };

    const markOffline = () => {
      if (cancelled) return;
      isProtocolConnected.current = false;
      setConnectionStatus('reconnecting');
      socket.current?.close();
    };

    window.addEventListener('online', reconnectWhenOnline);
    window.addEventListener('offline', markOffline);
    void connect();

    return () => {
      cancelled = true;
      isProtocolConnected.current = false;
      window.removeEventListener('online', reconnectWhenOnline);
      window.removeEventListener('offline', markOffline);
      clearHandshakeTimer();
      clearReconnectTimer();
      const activeSocket = socket.current;
      socket.current = null;
      if (activeSocket) {
        activeSocket.close();
      }
    };
  }, [roomId, token, connectionGeneration]);

  const reconnect = useCallback(() => {
    setConnectionGeneration((generation) => generation + 1);
  }, []);

  const sendMessage = useCallback((type: string, payload: Record<string, unknown>) => {
    const activeSocket = socket.current;
    if (
      activeSocket?.readyState !== WebSocket.OPEN
      || !isProtocolConnected.current
    ) return false;

    try {
      activeSocket.send(JSON.stringify({
        send: {
          data: {
            type,
            payload
          }
        }
      }));
      return true;
    } catch (err) {
      console.error('WebSocket send error:', err);
      return false;
    }
  }, []);

  return {
    sendMessage,
    connectionStatus: roomId && token ? connectionStatus : 'idle',
    reconnect,
  };
};
