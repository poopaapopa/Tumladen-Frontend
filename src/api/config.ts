const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL
  || `${wsProtocol}//${window.location.host}/ws`;
export const MINIO_URL = import.meta.env.VITE_MINIO_URL || '/tumladan-avatars/';
