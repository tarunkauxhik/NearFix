import type { Request } from 'express';

/** Parsed from `X-NearFix-Location-*` headers sent by the web client (`apiFetch` / `authApiFetch`). */
export interface NearFixRequestLocation {
  lat: number | null;
  lng: number | null;
  city: string | null;
  locality: string | null;
  source: 'gps' | 'ip' | null;
  updatedAt: string | null;
}

function readHeader(req: Request, name: string): string | undefined {
  const value = req.headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return typeof value === 'string' ? value : undefined;
}

function parseNumber(value: string | undefined): number | null {
  if (value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function getNearFixLocationFromRequest(req: Request): NearFixRequestLocation {
  const lat = parseNumber(readHeader(req, 'x-nearfix-location-lat'));
  const lng = parseNumber(readHeader(req, 'x-nearfix-location-lng'));
  const city = readHeader(req, 'x-nearfix-location-city')?.trim() || null;
  const locality = readHeader(req, 'x-nearfix-location-locality')?.trim() || null;
  const rawSource = readHeader(req, 'x-nearfix-location-source')?.trim();
  const source = rawSource === 'gps' || rawSource === 'ip' ? rawSource : null;
  const updatedAt = readHeader(req, 'x-nearfix-location-updated-at')?.trim() || null;

  return { lat, lng, city, locality, source, updatedAt };
}
