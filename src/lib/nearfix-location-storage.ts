/**
 * Versioned NearFix location snapshot in localStorage.
 * Single source of truth for client-side location reused across the app and API calls.
 */

export const NEARFIX_LOCATION_STORAGE_KEY = 'nearfix.location.v1';

/** Dispatched on the window after same-tab writes (storage event only fires cross-tab). */
export const NEARFIX_LOCATION_CHANGED_EVENT = 'nearfix:location-changed';

export type NearFixLocationSource = 'gps' | 'ip';

export interface NearFixLocationSnapshot {
  v: 1;
  lat: number;
  lng: number;
  city: string;
  locality: string;
  source: NearFixLocationSource;
  updatedAt: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidSnapshot(value: unknown): value is NearFixLocationSnapshot {
  if (!isRecord(value)) return false;
  if (value.v !== 1) return false;
  if (typeof value.lat !== 'number' || Number.isNaN(value.lat)) return false;
  if (typeof value.lng !== 'number' || Number.isNaN(value.lng)) return false;
  if (typeof value.city !== 'string') return false;
  if (typeof value.locality !== 'string') return false;
  if (value.source !== 'gps' && value.source !== 'ip') return false;
  if (typeof value.updatedAt !== 'string') return false;
  return true;
}

export function readStoredLocation(): NearFixLocationSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(NEARFIX_LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeStoredLocation(
  payload: Omit<NearFixLocationSnapshot, 'v' | 'updatedAt'>
): NearFixLocationSnapshot {
  const snapshot: NearFixLocationSnapshot = {
    v: 1,
    ...payload,
    updatedAt: new Date().toISOString(),
  };
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(NEARFIX_LOCATION_STORAGE_KEY, JSON.stringify(snapshot));
    window.dispatchEvent(new CustomEvent(NEARFIX_LOCATION_CHANGED_EVENT));
  }
  return snapshot;
}

export function clearStoredLocation(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(NEARFIX_LOCATION_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(NEARFIX_LOCATION_CHANGED_EVENT));
  }
}

/** Prefer a granular label for discovery string matching; fall back to city. */
export function discoveryLabelFromSnapshot(snapshot: NearFixLocationSnapshot): string {
  const loc = snapshot.locality.trim();
  const city = snapshot.city.trim();
  if (loc && city && loc.toLowerCase() !== city.toLowerCase()) return loc;
  return loc || city || 'Bengaluru';
}

export function getNearFixLocationRequestHeaders(): Record<string, string> {
  const snapshot = readStoredLocation();
  if (!snapshot) return {};
  return {
    'X-NearFix-Location-Lat': String(snapshot.lat),
    'X-NearFix-Location-Lng': String(snapshot.lng),
    'X-NearFix-Location-City': snapshot.city,
    'X-NearFix-Location-Locality': snapshot.locality,
    'X-NearFix-Location-Source': snapshot.source,
    'X-NearFix-Location-Updated-At': snapshot.updatedAt,
  };
}

export function subscribeStoredLocation(listener: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === NEARFIX_LOCATION_STORAGE_KEY || event.key === null) {
      listener();
    }
  };

  const onCustom = () => listener();

  window.addEventListener('storage', onStorage);
  window.addEventListener(NEARFIX_LOCATION_CHANGED_EVENT, onCustom);

  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(NEARFIX_LOCATION_CHANGED_EVENT, onCustom);
  };
}
