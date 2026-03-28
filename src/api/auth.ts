import { API_BASE_URL } from './config.ts';

export interface Actor {
  id: string;
  displayName: string;
  type: 'guest' | 'user';
}

interface GuestSessionResponse {
  actor: Actor;
  token: string;
}

export const authService = {
  async createGuestSession(displayName: string): Promise<GuestSessionResponse> {
    const response = await fetch(`${API_BASE_URL}/guest-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName }),
    });

    if (!response.ok) throw new Error('Ошибка при создании сессии');

    return response.json();
  }
};