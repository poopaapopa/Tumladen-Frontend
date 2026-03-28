const BASE_URL = '/api/v1';

export const roomApi = {
  setToken(token: string) {
    localStorage.setItem('auth_token', token);
  },
  getToken() {
    return localStorage.getItem('auth_token');
  },

  getHeaders() {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  async createGuestSession(displayName: string) {
    const res = await fetch(`${BASE_URL}/guest-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName }),
    });
    if (!res.ok){
      const errorText = await res.text();
      console.error(`Ошибка сервера (${res.status}):`, errorText);
      throw new Error(`Ошибка при создании сессии: ${res.status} ${errorText}`);
    } 
    
    const data = await res.json();
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  },

  async createRoom(name: string) {
    const res = await fetch(`${BASE_URL}/rooms`, {
      method: 'POST',
      headers: this.getHeaders(), 
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Ошибка при создании комнаты');
    return res.json();
  },

  async getPublicRooms() {
    const res = await fetch(`${BASE_URL}/rooms/public`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Ошибка при получении списка комнат');
    return res.json();
  },

  // 4. Данные комнаты
  async getRoomById(id: string) {
    const res = await fetch(`${BASE_URL}/rooms/invite/${id}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Ошибка при получении данных комнаты');
    return res.json();
  }
};