/**
 * Resolve device location: GPS + reverse geocode via same-origin `/api/geocode/*` proxy (Nominatim on server),
 * with IP-based fallback. Avoids browser CORS blocks on direct Nominatim calls.
 */

import { apiFetch } from '@/lib/api-client';
import {
  type NearFixLocationSnapshot,
  type NearFixLocationSource,
  writeStoredLocation,
} from '@/lib/nearfix-location-storage';

export { labelsFromNominatimAddress } from '@/lib/nearfix-location-address';

export async function reverseGeocode(lat: number, lng: number): Promise<{ city: string; locality: string }> {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  return apiFetch<{ city: string; locality: string }>(`/geocode/reverse?${params.toString()}`);
}

/** Single-result forward search when we only have a place name (e.g. IP gave city but no coordinates). */
export async function forwardGeocodeQuery(query: string): Promise<{ lat: number; lng: number } | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const params = new URLSearchParams({ q: trimmed });
  const result = await apiFetch<{ lat: number | null; lng: number | null }>(`/geocode/search?${params.toString()}`);
  if (result.lat == null || result.lng == null) return null;
  return { lat: result.lat, lng: result.lng };
}

export function requestGpsCoordinates(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout: 15_000,
      }
    );
  });
}

/** Free HTTPS endpoints; use conservatively. Primary ipwho.is, fallback ipapi.co. */
export async function fetchIpApproxLocation(): Promise<{
  lat: number | null;
  lng: number | null;
  city: string;
  locality: string;
}> {
  try {
    const response = await fetch('https://ipwho.is/ip', { headers: { Accept: 'application/json' } });
    if (response.ok) {
      const data = (await response.json()) as {
        success?: boolean;
        latitude?: number;
        longitude?: number;
        city?: string;
        region?: string;
        country?: string;
      };
      if (data.success !== false) {
        const lat = typeof data.latitude === 'number' ? data.latitude : null;
        const lng = typeof data.longitude === 'number' ? data.longitude : null;
        const city = [data.city, data.region].filter(Boolean).join(', ') || data.country || 'Unknown';
        return {
          lat,
          lng,
          city,
          locality: data.city || city,
        };
      }
    }
  } catch {
    // try fallback
  }

  const response = await fetch('https://ipapi.co/json/', { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error('IP location lookup failed');
  }
  const data = (await response.json()) as {
    latitude?: number | null;
    longitude?: number | null;
    city?: string | null;
    region?: string | null;
    country_name?: string | null;
  };
  const lat = typeof data.latitude === 'number' ? data.latitude : null;
  const lng = typeof data.longitude === 'number' ? data.longitude : null;
  const city =
    [data.city, data.region, data.country_name].filter(Boolean).join(', ') || 'Unknown';
  return {
    lat,
    lng,
    city,
    locality: data.city || city,
  };
}

function persist(
  lat: number,
  lng: number,
  city: string,
  locality: string,
  source: NearFixLocationSource
): NearFixLocationSnapshot {
  return writeStoredLocation({ lat, lng, city, locality, source });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Full resolution: try GPS → reverse geocode; on failure use IP (then reverse if coords exist).
 * Persists to localStorage and returns the snapshot.
 */
export async function resolveAndStoreNearFixLocation(): Promise<NearFixLocationSnapshot> {
  try {
    const { lat, lng } = await requestGpsCoordinates();
    try {
      const { city, locality } = await reverseGeocode(lat, lng);
      return persist(lat, lng, city || 'Unknown', locality || city || 'Unknown', 'gps');
    } catch {
      await delay(1100);
      try {
        const { city, locality } = await reverseGeocode(lat, lng);
        return persist(lat, lng, city || 'Unknown', locality || city || 'Unknown', 'gps');
      } catch {
        return persist(lat, lng, 'Unknown', 'Near you', 'gps');
      }
    }
  } catch {
    const ip = await fetchIpApproxLocation();
    const source: NearFixLocationSource = 'ip';

    if (ip.lat != null && ip.lng != null) {
      try {
        const { city, locality } = await reverseGeocode(ip.lat, ip.lng);
        return persist(
          ip.lat,
          ip.lng,
          city || ip.city,
          locality || ip.locality || ip.city,
          source
        );
      } catch {
        return persist(ip.lat, ip.lng, ip.city, ip.locality || ip.city, source);
      }
    }

    const placeQuery = (ip.locality || ip.city).trim();
    if (!placeQuery) {
      throw new Error('Could not determine your location');
    }

    const approx = await forwardGeocodeQuery(placeQuery);
    if (!approx) {
      throw new Error('Could not resolve your area on the map');
    }

    try {
      const { city, locality } = await reverseGeocode(approx.lat, approx.lng);
      return persist(
        approx.lat,
        approx.lng,
        city || ip.city,
        locality || ip.locality || ip.city,
        source
      );
    } catch {
      return persist(approx.lat, approx.lng, ip.city, ip.locality || ip.city, source);
    }
  }
}
