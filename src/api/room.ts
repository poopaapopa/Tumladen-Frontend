import { API_BASE_URL } from './config.ts';
import { useUserStore } from '@/store/useUserStore';
import type { GetRoomByInviteCodeResponse, ListPublicRoomsResponse, RoomResponse } from '@/types/room';

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
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
  },

  async getWsTicket(): Promise<{ ticket: string }> {
    const res = await fetch(`${API_BASE_URL}/ws-ticket`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (res.status === 401) {
      useUserStore.getState().logout();
      throw new UnauthorizedError('Сессия истекла. Пожалуйста, войдите снова.');
    }

    if (!res.ok) throw new Error('Не удалось получить тикет');
    return res.json();
  }
};
