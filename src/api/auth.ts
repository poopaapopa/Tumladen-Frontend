import { API_BASE_URL } from './config.ts';
import type { ActiveRoomSession } from '../types/user.ts';

export interface Actor {
  id: string;
  displayName: string;
  type: 'guest' | 'user';
  avatarUrl?: string | null;
  currentRoom?: ActiveRoomSession | null;
}

interface AuthResponse {
  actor: Actor;
  token: string;
}

interface loginResponse {
  identifier: string;
  password: string;
}

interface registryResponse {
  nickname: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

async function handleResponse(response: Response) {
  if (response.ok) {
    return response.json();
  }

  const text = await response.text();
  let errorMessage = 'Ошибка запроса';
  
  try {
    const json = JSON.parse(text);
    errorMessage = json.message || json.error || text;
  } catch {
    errorMessage = text;
  }

  throw new Error(errorMessage);
}

export const authService = {
  async createGuestSession(displayName: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/guest-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName }),
    });

    return handleResponse(response);
  },

  async register(payload: registryResponse): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return handleResponse(response);
  },

  async login(payload: loginResponse): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return handleResponse(response);
  },

  async getMe(token: string): Promise<Actor> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) throw new Error('Сессия истекла');
    
    const data = await response.json();
    return data.actor || data;
  }
};