import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  NEARFIX_LOCATION_CHANGED_EVENT,
  NEARFIX_LOCATION_STORAGE_KEY,
  clearStoredLocation,
  discoveryLabelFromSnapshot,
  readStoredLocation,
  subscribeStoredLocation,
  writeStoredLocation,
} from '@/lib/nearfix-location-storage';

describe('nearfix-location-storage', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('round-trips a valid snapshot', () => {
    const written = writeStoredLocation({
      lat: 12.97,
      lng: 77.59,
      city: 'Bengaluru',
      locality: 'Koramangala',
      source: 'gps',
    });

    expect(written.v).toBe(1);
    expect(written.updatedAt).toMatch(/^\d{4}-/);

    const read = readStoredLocation();
    expect(read).toEqual(written);
  });

  it('returns null for invalid JSON', () => {
    localStorage.setItem(NEARFIX_LOCATION_STORAGE_KEY, 'not-json');
    expect(readStoredLocation()).toBeNull();
  });

  it('returns null for wrong schema version', () => {
    localStorage.setItem(NEARFIX_LOCATION_STORAGE_KEY, JSON.stringify({ v: 2, lat: 1, lng: 2 }));
    expect(readStoredLocation()).toBeNull();
  });

  it('clears stored location', () => {
    writeStoredLocation({
      lat: 1,
      lng: 2,
      city: 'A',
      locality: 'B',
      source: 'ip',
    });
    clearStoredLocation();
    expect(readStoredLocation()).toBeNull();
    expect(localStorage.getItem(NEARFIX_LOCATION_STORAGE_KEY)).toBeNull();
  });

  it('notifies subscribers on write', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeStoredLocation(listener);

    writeStoredLocation({
      lat: 1,
      lng: 2,
      city: 'A',
      locality: 'B',
      source: 'gps',
    });

    expect(listener).toHaveBeenCalled();
    unsubscribe();

    listener.mockClear();
    writeStoredLocation({
      lat: 3,
      lng: 4,
      city: 'C',
      locality: 'D',
      source: 'ip',
    });
    expect(listener).not.toHaveBeenCalled();
  });

  it('dispatches custom event on write for same-tab listeners', () => {
    const handler = vi.fn();
    window.addEventListener(NEARFIX_LOCATION_CHANGED_EVENT, handler);
    writeStoredLocation({
      lat: 1,
      lng: 2,
      city: 'A',
      locality: 'B',
      source: 'gps',
    });
    expect(handler).toHaveBeenCalled();
    window.removeEventListener(NEARFIX_LOCATION_CHANGED_EVENT, handler);
  });

  it('prefers locality in discoveryLabel when distinct from city', () => {
    const snap = writeStoredLocation({
      lat: 1,
      lng: 2,
      city: 'Bengaluru',
      locality: 'Indiranagar',
      source: 'gps',
    });
    expect(discoveryLabelFromSnapshot(snap)).toBe('Indiranagar');
  });
});
