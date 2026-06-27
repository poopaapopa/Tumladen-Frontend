import { API_BASE_URL } from './config.ts';
import { useUserStore } from '@/store/useUserStore';
import type { GetRoomByInviteCodeResponse, ListPublicRoomsResponse, RoomResponse } from '@/types/room';

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

async function handleResponse(res: Response, errorMessage: string): Promise<Response> {
  if (res.status === 401) {
    useUserStore.getState().logout();
    window.location.href = '/';
    throw new UnauthorizedError('Сессия истекла. Пожалуйста, войдите снова.');
  }
  if (!res.ok) throw new Error(errorMessage);
  return res;
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
    return (await handleResponse(res, 'Ошибка при создании комнаты')).json();
  },

  async getPublicRooms(): Promise<ListPublicRoomsResponse> {
    const res = await fetch(`${API_BASE_URL}/rooms/public`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return (await handleResponse(res, 'Ошибка при получении списка комнат')).json();
  },

  async getRoomById(id: string): Promise<GetRoomByInviteCodeResponse> {
    const res = await fetch(`${API_BASE_URL}/rooms/invite/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return (await handleResponse(res, 'Ошибка при получении данных комнаты')).json();
  },

  async getWsTicket(): Promise<{ ticket: string }> {
    const res = await fetch(`${API_BASE_URL}/ws-ticket`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return (await handleResponse(res, 'Не удалось получить тикет')).json();
  },
};
