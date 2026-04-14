import { API_BASE_URL } from './config.ts';
import { useUserStore } from '../store/useUserStore';

export interface ParticipantResponse {
  actorId: string;
  displayName: string;
  joinedAt: string;
}

export interface Settings {
  [key: string]: string | number;
}

export interface RoomResponse {
  settings: Settings;
  id: string;
  name: string;
  isPrivate: boolean;
  inviteCode: string;
  ownerActorId: string;
  status: string;
  gameType: string;
  maxPlayers: number;
  canStart: boolean;
  playersCount: number;
  participants?: ParticipantResponse[];
  createdAt: string;
  updatedAt: string;
  currentTurnActorId?: string;
}


interface MatchPlayer {
  actorId: string;
  displayName: string;
  score: number;
  meeplesLeft: number;
  seat: number;
}

// Структура самого матча (match_state)
export interface MatchStatePayload {
  id: string;
  roomId: string;
  status: string;
  gameType: string;
  isYourTurn: boolean;
  gameState: {
    currentPlayerId: string;
    players: MatchPlayer[];
    turnNumber: number;
    phase: string;
    board: unknown[];
  };
}

export interface WsErrorPayload {
  message: string;
}

export type WsPayload = RoomResponse | MatchStatePayload | WsErrorPayload;

export interface ListPublicRoomsResponse {
  rooms: RoomResponse[];
}

export interface GetRoomByInviteCodeResponse {
  room: RoomResponse;
}

export interface UpdateRoomSettingsPayload {
  name: string;
  roomId: string;
  gameType: string;
  maxPlayers: number;
  settings: Record<string, number | string | boolean>;
}

export const roomService = {
  getHeaders(): HeadersInit {
    const token = useUserStore.getState().token;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  },

  async createRoom(name: string): Promise<RoomResponse> {
    const res = await fetch(`${API_BASE_URL}/rooms`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Ошибка при создании комнаты');
    return res.json();
  },

  async getPublicRooms(): Promise<ListPublicRoomsResponse> {
    const res = await fetch(`${API_BASE_URL}/rooms/public`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Ошибка при получении списка комнат');
    return res.json();
  },

  async getRoomById(id: string): Promise<GetRoomByInviteCodeResponse> {
    const res = await fetch(`${API_BASE_URL}/rooms/invite/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Ошибка при получении данных комнаты');
    return res.json();
  }
};