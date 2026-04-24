// API client helpers for communicating with vite-plugin-api endpoints.

import { getNearFixLocationRequestHeaders } from '@/lib/nearfix-location-storage';

const API_BASE = '/api';

export type TokenGetter = () => Promise<string | null>;

function mergeRequestInit(init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers);
  const locationHeaders = getNearFixLocationRequestHeaders();
  for (const [key, value] of Object.entries(locationHeaders)) {
    headers.set(key, value);
  }
  return { ...init, headers };
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String(payload.error)
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, mergeRequestInit(init));
  return readJsonResponse<T>(response);
}

export async function authApiFetch<T>(
  path: string,
  getToken: TokenGetter,
  init?: RequestInit
): Promise<T> {
  const token = await getToken();
  if (!token) {
    throw new Error('You must be signed in to continue.');
  }

  const merged = mergeRequestInit(init);
  const mergedHeaders = new Headers(merged.headers);
  mergedHeaders.set('Authorization', `Bearer ${token}`);
  if (!mergedHeaders.has('Content-Type') && merged.body) {
    mergedHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...merged,
    headers: mergedHeaders,
  });

  return readJsonResponse<T>(response);
}

export async function checkHealth() {
  return apiFetch<{ status: string; timestamp: string; message: string }>('/health');
}

export function downloadJsonFile(fileName: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(objectUrl);
}