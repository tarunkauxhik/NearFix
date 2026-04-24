import { useCallback, useEffect, useState } from 'react';

function formatLocationError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = Number((error as { code: unknown }).code);
    if (code === 1) {
      return 'Permission denied — try again or we will use approximate IP location.';
    }
    if (code === 2) {
      return 'Position unavailable — try again or we will use approximate IP location.';
    }
    if (code === 3) {
      return 'Location request timed out — try again or we will use approximate IP location.';
    }
  }
  return 'Location request failed';
}

import { resolveAndStoreNearFixLocation } from '@/lib/nearfix-location-resolve';
import {
  clearStoredLocation,
  discoveryLabelFromSnapshot,
  readStoredLocation,
  subscribeStoredLocation,
  type NearFixLocationSnapshot,
  type NearFixLocationSource,
} from '@/lib/nearfix-location-storage';

export type NearFixLocationStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface UseNearFixLocationResult {
  snapshot: NearFixLocationSnapshot | null;
  status: NearFixLocationStatus;
  errorMessage: string | null;
  requestLocation: () => Promise<NearFixLocationSnapshot | null>;
  clearLocation: () => void;
  lastSource: NearFixLocationSource | null;
  discoveryLabel: string | null;
}

export function useNearFixLocation(): UseNearFixLocationResult {
  const [snapshot, setSnapshot] = useState<NearFixLocationSnapshot | null>(null);
  const [status, setStatus] = useState<NearFixLocationStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshFromStorage = useCallback(() => {
    const next = readStoredLocation();
    setSnapshot(next);
    setStatus(next ? 'ready' : 'idle');
  }, []);

  useEffect(() => {
    refreshFromStorage();
    return subscribeStoredLocation(refreshFromStorage);
  }, [refreshFromStorage]);

  const requestLocation = useCallback(async (): Promise<NearFixLocationSnapshot | null> => {
    setStatus('loading');
    setErrorMessage(null);
    try {
      const next = await resolveAndStoreNearFixLocation();
      setSnapshot(next);
      setStatus('ready');
      return next;
    } catch (error) {
      const message = formatLocationError(error);
      setErrorMessage(message);
      setStatus('error');
      return null;
    }
  }, []);

  const clearLocation = useCallback(() => {
    clearStoredLocation();
    setSnapshot(null);
    setErrorMessage(null);
    setStatus('idle');
  }, []);

  return {
    snapshot,
    status,
    errorMessage,
    requestLocation,
    clearLocation,
    lastSource: snapshot?.source ?? null,
    discoveryLabel: snapshot ? discoveryLabelFromSnapshot(snapshot) : null,
  };
}
