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

function authHeaders(token: string, csrfToken?: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
  };
}

const csrfTokenCache = new Map<string, string>();
const csrfTokenRequestCache = new Map<string, Promise<string>>();

async function fetchCsrfToken(token: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/users/csrf-token`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await handleResponse<string | { csrf_token: string; }>(response);
  const csrfToken = typeof data === 'string' ? data : data.csrf_token;

  if (!csrfToken) {
    throw new Error('CSRF-токен не получен');
  }

  return csrfToken;
}

async function getCsrfToken(token: string): Promise<string> {
  const cachedToken = csrfTokenCache.get(token);

  if (cachedToken) {
    return cachedToken;
  }

  const cachedRequest = csrfTokenRequestCache.get(token);

  if (cachedRequest) {
    return cachedRequest;
  }

  const request = fetchCsrfToken(token)
    .then((csrfToken) => {
      csrfTokenCache.set(token, csrfToken);
      return csrfToken;
    })
    .finally(() => {
      csrfTokenRequestCache.delete(token);
    });

  csrfTokenRequestCache.set(token, request);

  return request;
}

export interface UpdateProfilePayload {
  nickname: string;
  email: string;
  /** Optional — only send when changing password */
  password?: string;
  /** Required when `password` is provided */
  passwordConfirm?: string;
}

export interface AvatarResponse {
  avatarUrl: string | null;
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
    const csrfToken = await getCsrfToken(token);
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: authHeaders(token, csrfToken),
      body: JSON.stringify(payload),
    });
    return handleResponse<OwnUserProfile>(response);
  },

  /** POST /users/avatar — upload or replace avatar (multipart/form-data) */
  async uploadAvatar(token: string, file: File): Promise<AvatarResponse> {
    const formData = new FormData();
    formData.append('avatar', file);

    const csrfToken = await getCsrfToken(token);
    const response = await fetch(`${API_BASE_URL}/users/avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-CSRF-Token': csrfToken,
      },
      body: formData,
    });
    return handleResponse<AvatarResponse>(response);
  },

  /** DELETE /users/avatar — remove current avatar */
  async deleteAvatar(token: string): Promise<AvatarResponse> {
    const csrfToken = await getCsrfToken(token);
    const response = await fetch(`${API_BASE_URL}/users/avatar`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-CSRF-Token': csrfToken,
      },
    });
    return handleResponse<AvatarResponse>(response);
  },
};
