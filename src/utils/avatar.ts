import { MINIO_URL } from '@/api/config.ts';

export function avatarSrc(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${MINIO_URL}${url}`;
}
