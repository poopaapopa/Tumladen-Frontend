import { API_BASE_URL } from './config.ts';
import type { OwnUserProfile, PublicUserProfile } from '../types/user.ts';

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>;
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

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export interface UpdateProfilePayload {
  nickname?: string;
  email?: string;
  /** Optional — only send when changing password */
  password?: string;
  /** Required when `password` is provided */
  passwordConfirm?: string;
}

export const userService = {
  /** GET /users/me — own full profile (includes email) */
  async getMe(token: string): Promise<OwnUserProfile> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: authHeaders(token),
    });
    return handleResponse<OwnUserProfile>(response);
  },

  /** GET /users/:id — public profile (no email) */
  async getUserById(id: string, token?: string): Promise<PublicUserProfile> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE_URL}/users/${id}`, { headers });
    return handleResponse<PublicUserProfile>(response);
  },

  /** PUT /users/profile — update nickname, email, optionally password */
  async updateProfile(
    token: string,
    payload: UpdateProfilePayload,
  ): Promise<OwnUserProfile> {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    return handleResponse<OwnUserProfile>(response);
  },

  /** POST /users/avatar — upload or replace avatar (multipart/form-data) */
  async uploadAvatar(token: string, file: File): Promise<OwnUserProfile> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${API_BASE_URL}/users/avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // NOTE: do NOT set Content-Type here — browser sets it with boundary automatically
      },
      body: formData,
    });
    return handleResponse<OwnUserProfile>(response);
  },

  /** DELETE /users/avatar — remove current avatar */
  async deleteAvatar(token: string): Promise<OwnUserProfile> {
    const response = await fetch(`${API_BASE_URL}/users/avatar`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
    return handleResponse<OwnUserProfile>(response);
  },
};
